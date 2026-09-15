import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link2, Link2Off, Maximize2, Minus, Plus, RotateCcw } from 'lucide-react'
import { resolveArtworkImage, artworkNaturalSize, containSize } from '../lib/painting'

/**
 * 双作品同步浏览器（比较页的技术核心）
 * ----------------------------------
 * 状态模型：每一侧是一个归一化的视图状态 { scale, focus: {x, y} }
 *  - focus（0~1）：画面中当前位于视口中心的归一化坐标，与画幅纵横比无关，
 *    因此两幅不同形制（立轴 / 长卷 / 册页）可共享同一份状态；
 *  - scale：相对“contain 适配后”尺寸的放大倍数；
 *  - 同步模式两侧共用同一状态，拖动 / 缩放 / 点热点一起动；
 *    解开链接则各自独立，状态从同步值分叉。
 *
 * 坐标换算全部走“视口像素 ↔ 归一化坐标”，热点只存归一化坐标，
 * 不依赖高清图实际像素，换图或容器尺寸变化都不错位。
 * 触控：单指拖动平移、双指捏合缩放（焦点取两指中点），并阻止页面滚动。
 */

const MIN_SCALE = 1
const MAX_SCALE = 6

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function useElementSize(ref) {
  // 初始给一个非零视口：首帧（含 SSR 首屏）即按此布局热点与图片，
  // 挂载后 ResizeObserver 立即以真实容器尺寸校正，无可见跳动。
  const [size, setSize] = useState({ width: 600, height: 460 })
  useLayoutEffect(() => {
    if (!ref.current || typeof ResizeObserver === 'undefined') return undefined
    const update = () => {
      const rect = ref.current.getBoundingClientRect()
      setSize({ width: rect.width || 600, height: rect.height || 460 })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])
  return size
}

const INITIAL_VIEW = { scale: 1, focus: { x: 0.5, y: 0.5 } }

/** 归一化缩放：factor 为乘性倍率，cx/cy 为缩放焦点（视口内归一化，0.5 为中心）。 */
function zoomed(state, factor, cx = 0.5, cy = 0.5) {
  const scale = clamp(state.scale * factor, MIN_SCALE, MAX_SCALE)
  // 保持“焦点下的画面点”不动：n = focus + (c-.5)/scale，新 focus = n - (c-.5)/newScale。
  const fx = clamp(state.focus.x + (cx - 0.5) * (1 / state.scale - 1 / scale), 0, 1)
  const fy = clamp(state.focus.y + (cy - 0.5) * (1 / state.scale - 1 / scale), 0, 1)
  return { scale, focus: { x: fx, y: fy } }
}

function useCompareViews(locked) {
  // 共享状态（同步模式的单一事实来源）+ 解锁后两侧各自的分叉状态。
  const [shared, setShared] = useState(INITIAL_VIEW)
  const [free, setFree] = useState({ left: INITIAL_VIEW, right: INITIAL_VIEW })

  const commit = useCallback((side, updater) => {
    const apply = (prev) => (typeof updater === 'function' ? updater(prev) : updater)
    if (locked) {
      setShared((prev) => apply(prev))
    } else {
      setFree((prev) => ({ ...prev, [side]: apply(prev[side]) }))
    }
  }, [locked])

  const reset = useCallback((side) => {
    if (!side || locked) {
      setShared(INITIAL_VIEW)
      setFree({ left: INITIAL_VIEW, right: INITIAL_VIEW })
    } else {
      setFree((prev) => ({ ...prev, [side]: INITIAL_VIEW }))
    }
  }, [locked])

  // 锁定时两侧都读共享状态；解锁时读各自的分叉（进入解锁瞬间以当前共享值播种）。
  const left = locked ? shared : free.left
  const right = locked ? shared : free.right

  const unlockFromShared = useCallback(() => setFree({ left: shared, right: shared }), [shared])
  const lockFromLeft = useCallback(() => setShared(free.left), [free.left])
  return { left, right, commit, reset, unlockFromShared, lockFromLeft }
}

/** 把归一化视图状态换算为图片层的像素摆放（contain 适配 + 放大 + 视口窗口）。 */
function imagePlacement(state, box, baseSize) {
  const scaledW = baseSize.width * state.scale
  const scaledH = baseSize.height * state.scale
  const overflowX = Math.max(0, scaledW - box.width)
  const overflowY = Math.max(0, scaledH - box.height)
  // 视口中心对应的画面点 = focus；左缘据此反推（未放大时由 overflow=0 自动居中）。
  const left = box.width / 2 - state.focus.x * scaledW
  const top = box.height / 2 - state.focus.y * scaledH
  return {
    width: scaledW,
    height: scaledH,
    left: clamp(left, box.width - scaledW, 0),
    top: clamp(top, box.height - scaledH, 0),
    overflowX,
    overflowY
  }
}

function CompareImage({ artwork, failed, onFail }) {
  const remote = typeof artwork.image === 'string' ? artwork.image : null
  const local = resolveArtworkImage(artwork, { preferLocal: false })
  const src = [remote, local].filter(Boolean).filter((candidate) => !failed.includes(candidate))[0] ?? null
  if (!src) return <div className="cmp-missing">局部图像缺失 · 待补摄</div>
  return (
    <img
      src={src}
      alt={artwork.title + ' · 高清局部'}
      draggable={false}
      decoding="async"
      onError={() => onFail(src)}
    />
  )
}

/** 单侧画布：承载图片、热点、小地图与全部指针 / 滚轮 / 触控交互。 */
function ComparePane({ side, artwork, technique, state, commit, reset, activeHotspot, onHotspot }) {
  const viewportRef = useRef(null)
  const box = useElementSize(viewportRef)
  const [failed, setFailed] = useState([])
  const [dragging, setDragging] = useState(false)
  const pointers = useRef(new Map())
  const pinch = useRef(null)
  const drag = useRef(null)
  const movedRef = useRef(false)

  const natural = artworkNaturalSize(artwork)
  const baseSize = useMemo(() => containSize(natural, box), [natural, box.width, box.height])
  const place = useMemo(
    () => imagePlacement(state, box, baseSize),
    [state, box.width, box.height, baseSize]
  )
  const details = technique?.details ?? []

  const markFail = (src) => setFailed((prev) => (prev.includes(src) ? prev : [...prev, src]))

  const panByPixels = useCallback((dxPx, dyPx) => {
    if (place.overflowX <= 0 && place.overflowY <= 0) return
    commit(side, (prev) => {
      // 画面跟随指针：向右拖（dx>0）看到更靠左的点，故 focus 减小。
      const fx = place.overflowX > 0 ? clamp(prev.focus.x - dxPx / place.width, 0, 1) : prev.focus.x
      const fy = place.overflowY > 0 ? clamp(prev.focus.y - dyPx / place.height, 0, 1) : prev.focus.y
      return { ...prev, focus: { x: fx, y: fy } }
    })
  }, [commit, side, place.overflowX, place.overflowY, place.width, place.height])

  const zoomAtClient = useCallback((factor, clientX, clientY) => {
    const rect = viewportRef.current?.getBoundingClientRect()
    if (!rect) return
    const cx = clamp((clientX - rect.left) / rect.width, 0, 1)
    const cy = clamp((clientY - rect.top) / rect.height, 0, 1)
    commit(side, (prev) => zoomed(prev, factor, cx, cy))
  }, [commit, side])

  // —— Pointer Events：鼠标 / 触控 / 触控笔统一 ——
  const onPointerDown = (event) => {
    viewportRef.current.setPointerCapture?.(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    movedRef.current = false
    if (pointers.current.size === 1) {
      drag.current = { x: event.clientX, y: event.clientY }
      setDragging(true)
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }
      drag.current = null
    }
  }

  const onPointerMove = (event) => {
    if (!pointers.current.has(event.pointerId)) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pointers.current.size === 1 && drag.current) {
      const dx = event.clientX - drag.current.x
      const dy = event.clientY - drag.current.y
      if (Math.abs(dx) + Math.abs(dy) > 3) movedRef.current = true
      panByPixels(dx, dy)
      drag.current = { x: event.clientX, y: event.clientY }
    } else if (pointers.current.size >= 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const cx = (a.x + b.x) / 2
      const cy = (a.y + b.y) / 2
      if (pinch.current.dist > 0) zoomAtClient(dist / pinch.current.dist, cx, cy)
      panByPixels(cx - pinch.current.cx, cy - pinch.current.cy)
      pinch.current = { dist, cx, cy }
    }
  }

  const endPointer = (event) => {
    pointers.current.delete(event.pointerId)
    if (pointers.current.size === 0) {
      drag.current = null
      pinch.current = null
      setDragging(false)
    } else if (pointers.current.size === 1) {
      const [only] = [...pointers.current.values()]
      drag.current = { x: only.x, y: only.y }
      pinch.current = null
    }
  }

  // 滚轮以指针位置为焦点缩放（非被动监听以便 preventDefault）。
  useEffect(() => {
    const node = viewportRef.current
    if (!node) return undefined
    const handler = (event) => {
      event.preventDefault()
      zoomAtClient(Math.exp(-event.deltaY * 0.0016), event.clientX, event.clientY)
    }
    node.addEventListener('wheel', handler, { passive: false })
    return () => node.removeEventListener('wheel', handler)
  }, [zoomAtClient])

  const onDouble = (event) => {
    if (state.scale > 1.01) reset(side)
    else zoomAtClient(2.4, event.clientX, event.clientY)
  }

  const clickHotspot = (event, detail) => {
    if (movedRef.current) return
    event.stopPropagation()
    onHotspot?.(side, detail)
  }

  // 小地图：缩略框 = focus 对应的归一化视口窗口。
  const minimap = box.width > 0 && natural ? (() => {
    const miniW = 116
    const miniH = miniW * (natural.height / natural.width)
    const winW = miniW / state.scale
    const winH = miniH / state.scale
    const x = clamp(state.focus.x * miniW - winW / 2, 0, Math.max(0, miniW - winW))
    const y = clamp(state.focus.y * miniH - winH / 2, 0, Math.max(0, miniH - winH))
    return { miniW, miniH, winW, winH, x, y }
  })() : null

  const seekMinimap = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const nx = clamp((event.clientX - rect.left) / rect.width, 0, 1)
    const ny = clamp((event.clientY - rect.top) / rect.height, 0, 1)
    commit(side, (prev) => ({ ...prev, focus: { x: nx, y: ny } }))
  }

  const accent = technique?.accent ?? '#c99e74'
  const paneClassName = 'cmp-pane' + (dragging ? ' is-grabbing' : '')
  const layerClassName = 'cmp-img-layer' + (state.scale > 1.01 ? ' is-zoomed' : '')
  const layerStyle = {
    width: place.width,
    height: place.height,
    transform: 'translate(' + place.left + 'px, ' + place.top + 'px)'
  }
  const thumbSrc = resolveArtworkImage(artwork)

  return (
    <div className={paneClassName}>
      <div
        ref={viewportRef}
        className="cmp-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onPointerLeave={endPointer}
        onDoubleClick={onDouble}
        style={{ touchAction: 'none', cursor: dragging ? 'grabbing' : 'grab' }}
        role="application"
        aria-label={artwork.title + ' 高清局部浏览器，可拖动、双指捏合或滚轮缩放'}
      >
        {box.width > 0 ? (
          <div className={layerClassName} style={layerStyle}>
            <CompareImage artwork={artwork} failed={failed} onFail={markFail} />
            {/* 笔墨热点：坐标归一化，与缩放无关 */}
            {details.map((detail) => {
              const active = activeHotspot?.label === detail.label
              const dotStyle = { left: detail.x * 100 + '%', top: detail.y * 100 + '%' }
              return (
                <button
                  key={detail.label}
                  className={active ? 'cmp-hotspot active' : 'cmp-hotspot'}
                  style={dotStyle}
                  onClick={(event) => clickHotspot(event, detail)}
                  aria-label={'笔墨细节：' + detail.label}
                >
                  <span className="cmp-hotspot-dot" />
                  <span className="cmp-hotspot-label">{detail.label}</span>
                </button>
              )
            })}
          </div>
        ) : null}

        <div className="cmp-pane-head">
          <span className="cmp-tech-badge" style={{ '--tech-accent': accent }}>{technique?.name}</span>
          <span className="cmp-coords">{Math.round(state.focus.x * 100)}, {Math.round(state.focus.y * 100)}</span>
        </div>

        <div className="cmp-zoom-tools">
          <button onClick={(e) => { e.stopPropagation(); zoomAtClient(1 / 1.4, e.clientX, e.clientY) }} aria-label="缩小"><Minus size={14} /></button>
          <span className="cmp-zoom-value">{state.scale.toFixed(1)}×</span>
          <button onClick={(e) => { e.stopPropagation(); zoomAtClient(1.4, e.clientX, e.clientY) }} aria-label="放大"><Plus size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); reset(side) }} aria-label="复位"><RotateCcw size={13} /></button>
        </div>

        {minimap && thumbSrc ? (
          <div
            className="cmp-minimap"
            style={{ width: minimap.miniW, height: minimap.miniH }}
            onPointerDown={(e) => { e.stopPropagation(); seekMinimap(e) }}
            onPointerMove={(e) => { if (e.buttons === 1) seekMinimap(e) }}
            aria-hidden="true"
          >
            <img src={thumbSrc} alt="" draggable={false} />
            <span className="cmp-minimap-window" style={{ left: minimap.x, top: minimap.y, width: minimap.winW, height: minimap.winH }} />
          </div>
        ) : null}
      </div>

      <div className="cmp-caption">
        <h4>{artwork.title}</h4>
        <p>{artwork.artist ?? '佚名'} · {artwork.dynasty ?? '年代不详'}</p>
      </div>
    </div>
  )
}

/**
 * 双作品比较浏览器
 * left/right: { artwork, technique: { name, accent, details } }
 */
export default function CompareViewer({ left: leftSpec, right: rightSpec }) {
  const [locked, setLocked] = useState(true)
  const [activeLabel, setActiveLabel] = useState(null)

  // 配对热点：两侧 label 相同才可联动。
  const pairedLabels = useMemo(() => {
    const leftLabels = new Set((leftSpec.technique.details ?? []).map((d) => d.label))
    return new Set(
      (rightSpec.technique.details ?? []).filter((d) => leftLabels.has(d.label)).map((d) => d.label)
    )
  }, [leftSpec, rightSpec])

  const { left, right, commit, reset, unlockFromShared, lockFromLeft } = useCompareViews(locked)

  const toggleLock = () => {
    if (locked) unlockFromShared() // 解锁：以当前共享视图播种两侧
    else lockFromLeft()           // 重新锁定：以左侧视图为基准合并
    setLocked((value) => !value)
  }

  // 换作品时回到初始视图并收起局部说明。
  useEffect(() => {
    reset()
    setActiveLabel(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftSpec.artwork.id, rightSpec.artwork.id])

  const focusAt = (side, detail, scale = 3.2) => {
    commit(side, () => ({ scale, focus: { x: detail.x, y: detail.y } }))
  }

  const onHotspot = (side, detail) => {
    setActiveLabel(detail.label)
    if (!locked) {
      focusAt(side, detail)
      return
    }
    // 联动：左右都跳到各自同名热点（同名热点坐标可以不同，各自归一化）。
    const leftDetail = leftSpec.technique.details.find((d) => d.label === detail.label)
    const rightDetail = rightSpec.technique.details.find((d) => d.label === detail.label)
    if (leftDetail) focusAt('left', leftDetail)
    if (rightDetail) focusAt('right', rightDetail)
  }

  const activeHotspot = activeLabel ? { label: activeLabel } : null
  const leftActiveText = leftSpec.technique.details.find((d) => d.label === activeLabel)?.text
  const rightActiveText = rightSpec.technique.details.find((d) => d.label === activeLabel)?.text

  return (
    <div className="cmp-viewer">
      <div className="cmp-toolbar">
        <button
          className={locked ? 'cmp-lock active' : 'cmp-lock'}
          onClick={toggleLock}
          aria-pressed={locked}
        >
          {locked ? <Link2 size={14} /> : <Link2Off size={14} />}
          {locked ? '双画同步浏览' : '两侧独立浏览'}
        </button>
        <span className="cmp-toolbar-hint">
          {locked ? '拖动 / 缩放任一侧，两幅画一起移动 · 点热点对照同一笔意' : '已解开同步：两画各自缩放拖动'}
        </span>
        <button className="cmp-reset-all" onClick={() => reset()}><Maximize2 size={13} /> 双画复位</button>
      </div>

      <div className={locked ? 'cmp-stage is-locked' : 'cmp-stage'}>
        <ComparePane
          side="left"
          artwork={leftSpec.artwork}
          technique={leftSpec.technique}
          state={left}
          commit={commit}
          reset={reset}
          activeHotspot={activeHotspot}
          onHotspot={onHotspot}
        />
        <div className="cmp-vs" aria-hidden="true"><span>较</span></div>
        <ComparePane
          side="right"
          artwork={rightSpec.artwork}
          technique={rightSpec.technique}
          state={right}
          commit={commit}
          reset={reset}
          activeHotspot={activeHotspot}
          onHotspot={onHotspot}
        />
      </div>

      {/* 当前笔墨细节的文字解释：随热点切换，而不是随作品切换 */}
      <div className={activeLabel ? 'cmp-detail-readout active' : 'cmp-detail-readout'} aria-live="polite">
        {activeLabel ? (
          <>
            <span className="cmp-readout-label">笔墨局部 · {activeLabel}</span>
            <div className="cmp-readout-cols">
              <p>{leftActiveText}</p>
              <p>{rightActiveText}</p>
            </div>
            <button className="cmp-readout-close" onClick={() => setActiveLabel(null)}>关闭局部说明</button>
          </>
        ) : (
          <p className="cmp-readout-empty">
            点画面中的 <b>笔墨热点</b>，双画会同步放大到对应局部；这里并排显示两种技法在这一笔上的做法差异。
            {pairedLabels.size ? ' 可联动的局部：' + [...pairedLabels].join('、') + '。' : ''}
          </p>
        )}
      </div>
    </div>
  )
}
