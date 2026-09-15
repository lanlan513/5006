import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Crosshair, Image as ImageIcon, Minus, Plus, RotateCcw, ScanLine } from 'lucide-react'
import { resolveArtworkImage, artworkNaturalSize, containSize } from '../lib/painting'
import { annotationAnchor, annotationBounds, annotationKindLabel } from '../data/compositions'

/**
 * 构图标本浏览器（构图层的技术核心）
 * ================================
 * 坐标系分离设计：
 *  - 标注数据全部以 **图片自身坐标系的归一化值（0~1）** 存储（见 data/compositions.js）；
 *  - 图片层：contain 适配 + scale 放大 + focus 平移，与 CompareViewer 同一套换算；
 *  - SVG 标注层：与 <img> 同处一个随缩放/平移变换的 wrapper 内，
 *    其 viewBox 固定为图片「自然像素」尺寸（preserveAspectRatio="none"），
 *    因此画 SVG 只需把归一化坐标乘以自然尺寸，绝不接触屏幕像素；
 *  - HTML 热点编号按钮同样在 wrapper 内，以百分比定位（left: x*100%）；
 *  - 容器尺寸由 ResizeObserver 监听，窗口变化 → box 变 → baseSize/place 重算，
 *    SVG 与热点跟着 wrapper 自动重排，标注在任何缩放下都贴合画面。
 *
 * 两种模式（原图 / 分析）只切换覆盖层的显隐，图片层与视图状态不变，
 * 因此可以瞬时来回切换而不丢失缩放位置。
 */

const MIN_SCALE = 1
const MAX_SCALE = 5
const KIND_ORDER = { guide: 1, mask: 2, focus: 3 }

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

const INITIAL_VIEW = { scale: 1, focus: { x: 0.5, y: 0.5 } }

function useElementSize(ref) {
  // 首帧给非零尺寸（SSR 也能布局），挂载后 ResizeObserver 以真实尺寸校正。
  const [size, setSize] = useState({ width: 720, height: 480 })
  useLayoutEffect(() => {
    if (!ref.current || typeof ResizeObserver === 'undefined') return undefined
    const update = () => {
      const rect = ref.current.getBoundingClientRect()
      setSize({ width: rect.width || 720, height: rect.height || 480 })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])
  return size
}

function zoomed(state, factor, cx = 0.5, cy = 0.5) {
  const scale = clamp(state.scale * factor, MIN_SCALE, MAX_SCALE)
  const fx = clamp(state.focus.x + (cx - 0.5) * (1 / state.scale - 1 / scale), 0, 1)
  const fy = clamp(state.focus.y + (cy - 0.5) * (1 / state.scale - 1 / scale), 0, 1)
  return { scale, focus: { x: fx, y: fy } }
}

/** 归一化视图 → wrapper 的屏幕摆放（contain 适配 + 放大 + 视口窗口）。 */
function imagePlacement(state, box, baseSize) {
  const scaledW = baseSize.width * state.scale
  const scaledH = baseSize.height * state.scale
  const left = box.width / 2 - state.focus.x * scaledW
  const top = box.height / 2 - state.focus.y * scaledH
  return {
    width: scaledW,
    height: scaledH,
    left: clamp(left, box.width - scaledW, 0),
    top: clamp(top, box.height - scaledH, 0),
    overflowX: Math.max(0, scaledW - box.width),
    overflowY: Math.max(0, scaledH - box.height)
  }
}

/** 由标注包围盒计算「放大到该区域」的目标视图（仍是归一化状态，与图片像素解耦）。 */
function viewForBounds(bounds, box, baseSize) {
  const fitX = (baseSize.width * Math.max(bounds.w, 0.001)) / box.width
  const fitY = (baseSize.height * Math.max(bounds.h, 0.001)) / box.height
  const scale = clamp(0.62 / Math.max(fitX, fitY), 1.05, MAX_SCALE)
  return {
    scale,
    focus: {
      x: clamp(bounds.x + bounds.w / 2, 0, 1),
      y: clamp(bounds.y + bounds.h / 2, 0, 1)
    }
  }
}

/* ---------------- SVG 几何（用户单位 = 图片自然像素） ---------------- */

function GuideShape({ annotation, natural, selected, onSelect }) {
  const X = (p) => p.x * natural.width
  const Y = (p) => p.y * natural.height
  const common = {
    className: selected ? 'sp-shape is-active' : 'sp-shape',
    onClick: onSelect,
    vectorEffect: 'non-scaling-stroke'
  }
  if (annotation.shape === 'polyline') {
    const points = annotation.points.map((p) => `${X(p)},${Y(p)}`).join(' ')
    return <polyline points={points} fill="none" {...common} />
  }
  const { from, to } = annotation
  return (
    <>
      <line
        x1={X(from)} y1={Y(from)} x2={X(to)} y2={Y(to)}
        fill="none"
        strokeDasharray={annotation.dashed ? '10 8' : undefined}
        markerEnd={annotation.shape === 'arrow' ? 'url(#sp-arrowhead)' : undefined}
        {...common}
      />
      {/* 不可见加粗命中带，让细线在缩放后仍易点 */}
      <line x1={X(from)} y1={Y(from)} x2={X(to)} y2={Y(to)} className="sp-shape-hit" onClick={onSelect} />
    </>
  )
}

function MaskShape({ annotation, natural, selected, onSelect }) {
  if (annotation.shape === 'rect') {
    return <rect x={annotation.x * natural.width} y={annotation.y * natural.height} width={annotation.w * natural.width} height={annotation.h * natural.height} className={selected ? 'sp-shape is-active' : 'sp-shape'} onClick={onSelect} />
  }
  if (annotation.shape === 'ellipse') {
    return <ellipse cx={annotation.cx * natural.width} cy={annotation.cy * natural.height} rx={annotation.rx * natural.width} ry={annotation.ry * natural.height} className={selected ? 'sp-shape is-active' : 'sp-shape'} onClick={onSelect} />
  }
  const points = annotation.points.map((p) => `${p.x * natural.width},${p.y * natural.height}`).join(' ')
  return <polygon points={points} className={selected ? 'sp-shape is-active' : 'sp-shape'} onClick={onSelect} />
}

export default function SpecimenViewer({ specimen, artwork, mode, onModeChange, selectedId, onSelect }) {
  const viewportRef = useRef(null)
  const box = useElementSize(viewportRef)
  const [dragging, setDragging] = useState(false)
  const pointers = useRef(new Map())
  const pinch = useRef(null)
  const drag = useRef(null)
  const movedRef = useRef(false)
  const [view, setView] = useState(INITIAL_VIEW)
  const viewRef = useRef(view)
  const tweenRef = useRef(0)
  viewRef.current = view

  const natural = artworkNaturalSize(artwork)
  const baseSize = useMemo(() => containSize(natural, box), [natural, box.width, box.height])
  const place = useMemo(() => imagePlacement(view, box, baseSize), [view, box.width, box.height, baseSize])

  const annotations = useMemo(
    () => [...(specimen?.annotations ?? [])].sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]),
    [specimen]
  )
  const selected = annotations.find((item) => item.id === selectedId) ?? null

  // 换标本：复位视图、清除选中。
  useEffect(() => {
    cancelAnimationFrame(tweenRef.current)
    setView(INITIAL_VIEW)
    onSelect(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specimen?.id])

  const animateTo = useCallback((target) => {
    cancelAnimationFrame(tweenRef.current)
    const start = viewRef.current
    const startedAt = performance.now()
    const duration = 460
    const step = (now) => {
      const t = Math.min(1, (now - startedAt) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setView({
        scale: start.scale + (target.scale - start.scale) * eased,
        focus: {
          x: start.focus.x + (target.focus.x - start.focus.x) * eased,
          y: start.focus.y + (target.focus.y - start.focus.y) * eased
        }
      })
      if (t < 1) tweenRef.current = requestAnimationFrame(step)
    }
    tweenRef.current = requestAnimationFrame(step)
  }, [])

  const panByPixels = useCallback((dxPx, dyPx) => {
    cancelAnimationFrame(tweenRef.current)
    setView((prev) => {
      const fx = place.overflowX > 0 ? clamp(prev.focus.x - dxPx / place.width, 0, 1) : prev.focus.x
      const fy = place.overflowY > 0 ? clamp(prev.focus.y - dyPx / place.height, 0, 1) : prev.focus.y
      return { ...prev, focus: { x: fx, y: fy } }
    })
  }, [place.overflowX, place.overflowY, place.width, place.height])

  const zoomAtClient = useCallback((factor, clientX, clientY) => {
    cancelAnimationFrame(tweenRef.current)
    const rect = viewportRef.current?.getBoundingClientRect()
    if (!rect) return
    const cx = clamp((clientX - rect.left) / rect.width, 0, 1)
    const cy = clamp((clientY - rect.top) / rect.height, 0, 1)
    setView((prev) => zoomed(prev, factor, cx, cy))
  }, [])

  /* —— Pointer Events：单指拖动 / 双指捏合 —— */
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

  const onDoubleClick = (event) => {
    if (view.scale > 1.01) {
      animateTo(INITIAL_VIEW)
    } else {
      const rect = viewportRef.current.getBoundingClientRect()
      animateTo(zoomed(view, 2.4, (event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height))
    }
  }

  // A 键快速切换原图 / 分析；Esc 取消选中。
  useEffect(() => {
    const onKey = (event) => {
      const tag = event.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (event.key.toLowerCase() === 'a') onModeChange(mode === 'analysis' ? 'original' : 'analysis')
      if (event.key === 'Escape') onSelect(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, onModeChange, onSelect])

  const chooseAnnotation = (annotation) => {
    onSelect(annotation.id)
    if (mode !== 'analysis') onModeChange('analysis')
    // 视觉中心/细线：以其包围盒放大；遮罩：直接飞到其区域。
    const target = viewForBounds(annotationBounds(annotation), box, baseSize)
    animateTo(target)
  }

  const resetView = () => animateTo(INITIAL_VIEW)

  const minimap = box.width > 0 && natural ? (() => {
    const miniW = 124
    const miniH = miniW * (natural.height / natural.width)
    const winW = miniW / view.scale
    const winH = miniH / view.scale
    const x = clamp(view.focus.x * miniW - winW / 2, 0, Math.max(0, miniW - winW))
    const y = clamp(view.focus.y * miniH - winH / 2, 0, Math.max(0, miniH - winH))
    return { miniW, miniH, winW, winH, x, y }
  })() : null

  const seekMinimap = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setView((prev) => ({
      ...prev,
      focus: {
        x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
        y: clamp((event.clientY - rect.top) / rect.height, 0, 1)
      }
    }))
  }

  const thumbSrc = resolveArtworkImage(artwork)
  const analysis = mode === 'analysis'
  const layerStyle = { width: place.width, height: place.height, transform: `translate(${place.left}px, ${place.top}px)` }

  return (
    <div className="sp-viewer">
      {/* 快速切换：原图 ↔ 分析模式 */}
      <div className="sp-modebar">
        <div className="sp-mode-switch" role="tablist" aria-label="查看模式">
          <button role="tab" aria-selected={!analysis} className={!analysis ? 'is-active' : ''} onClick={() => onModeChange('original')}>
            <ImageIcon size={13} /> 原图模式
          </button>
          <button role="tab" aria-selected={analysis} className={analysis ? 'is-active' : ''} onClick={() => onModeChange('analysis')}>
            <ScanLine size={13} /> 分析模式
          </button>
        </div>
        <span className="sp-mode-hint">
          {analysis
            ? '点击辅助线 / 遮罩 / 视觉中心，查看该处的构图关系'
            : '原图模式：不显示任何标注，可照常缩放拖动'}
          <kbd>A</kbd> 快速切换
        </span>
      </div>

      <div
        ref={viewportRef}
        className={dragging ? 'sp-viewport is-grabbing' : 'sp-viewport'}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onPointerLeave={endPointer}
        onDoubleClick={onDoubleClick}
        onClick={() => { if (!movedRef.current) onSelect(null) }}
        style={{ touchAction: 'none', cursor: dragging ? 'grabbing' : 'grab' }}
        role="application"
        aria-label={`${artwork.title}构图分析画布，可拖动、滚轮或双指缩放`}
      >
        {box.width > 0 ? (
          <div className="sp-layer" style={layerStyle}>
            <img src={resolveArtworkImage(artwork)} alt={`${artwork.title}（风格化示意）`} draggable={false} decoding="async" />

            {/* SVG 标注层：viewBox 即图片自然坐标系，归一化值乘自然尺寸后直接绘制 */}
            {analysis && natural ? (
              <svg
                className="sp-svg"
                viewBox={`0 0 ${natural.width} ${natural.height}`}
                preserveAspectRatio="none"
                onClick={(event) => event.stopPropagation()}
              >
                <defs>
                  <marker id="sp-arrowhead" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                  </marker>
                </defs>
                {annotations.map((annotation) => {
                  const isSelected = selected?.id === annotation.id
                  if (annotation.kind === 'mask') {
                    return <MaskShape key={annotation.id} annotation={annotation} natural={natural} selected={isSelected} onSelect={(event) => { event.stopPropagation(); if (!movedRef.current) chooseAnnotation(annotation) }} />
                  }
                  if (annotation.kind === 'guide') {
                    return <GuideShape key={annotation.id} annotation={annotation} natural={natural} selected={isSelected} onSelect={(event) => { event.stopPropagation(); if (!movedRef.current) chooseAnnotation(annotation) }} />
                  }
                  return null
                })}
                {/* focus：十字视觉中心标记（SVG 几何）+ 编号按钮（HTML 常量尺寸） */}
                {annotations.filter((a) => a.kind === 'focus').map((annotation) => (
                  <g key={annotation.id} className={selected?.id === annotation.id ? 'sp-focus-g is-active' : 'sp-focus-g'} onClick={(event) => { event.stopPropagation(); if (!movedRef.current) chooseAnnotation(annotation) }}>
                    <line x1={(annotation.x - 0.05) * natural.width} y1={annotation.y * natural.height} x2={(annotation.x + 0.05) * natural.width} y2={annotation.y * natural.height} vectorEffect="non-scaling-stroke" />
                    <line x1={annotation.x * natural.width} y1={(annotation.y - 0.05) * natural.height} x2={annotation.x * natural.width} y2={(annotation.y + 0.05) * natural.height} vectorEffect="non-scaling-stroke" />
                    <circle cx={annotation.x * natural.width} cy={annotation.y * natural.height} r={0.018 * Math.min(natural.width, natural.height)} fill="none" vectorEffect="non-scaling-stroke" />
                    {annotation.arrow ? (
                      <line x1={annotation.arrow.from.x * natural.width} y1={annotation.arrow.from.y * natural.height} x2={annotation.arrow.to.x * natural.width} y2={annotation.arrow.to.y * natural.height} vectorEffect="non-scaling-stroke" markerEnd="url(#sp-arrowhead)" className="sp-focus-arrow" />
                    ) : null}
                  </g>
                ))}
              </svg>
            ) : null}

            {/* HTML 热点编号：百分比定位，大小不随缩放变化，保证可点 */}
            {analysis ? annotations.map((annotation, index) => {
              const anchor = annotationAnchor(annotation)
              const isSelected = selected?.id === annotation.id
              return (
                <button
                  key={annotation.id}
                  className={isSelected ? 'sp-pin is-active' : 'sp-pin'}
                  style={{ left: `${anchor.x * 100}%`, top: `${anchor.y * 100}%` }}
                  onClick={(event) => { event.stopPropagation(); if (!movedRef.current) chooseAnnotation(annotation) }}
                  aria-label={`${annotationKindLabel(annotation.kind)}：${annotation.label}`}
                  aria-pressed={isSelected}
                >
                  <span className="sp-pin-num">{String(index + 1).padStart(2, '0')}</span>
                  <span className="sp-pin-tag">{annotation.label}</span>
                </button>
              )
            }) : null}
          </div>
        ) : null}

        {/* 标本信息角标 */}
        <div className="sp-pane-head">
          <span className="sp-artist">{artwork.artist ?? '佚名'} · {artwork.dynasty ?? '年代不详'}</span>
          <span className="sp-coords">{Math.round(view.focus.x * 100)}, {Math.round(view.focus.y * 100)}</span>
        </div>

        <div className="sp-zoom-tools" onClick={(event) => event.stopPropagation()}>
          <button onClick={(e) => zoomAtClient(1 / 1.4, e.clientX, e.clientY)} aria-label="缩小"><Minus size={14} /></button>
          <span className="sp-zoom-value">{view.scale.toFixed(1)}×</span>
          <button onClick={(e) => zoomAtClient(1.4, e.clientX, e.clientY)} aria-label="放大"><Plus size={14} /></button>
          <button onClick={resetView} aria-label="复位"><RotateCcw size={13} /></button>
        </div>

        {minimap && thumbSrc ? (
          <div
            className="sp-minimap"
            style={{ width: minimap.miniW, height: minimap.miniH }}
            onPointerDown={(e) => { e.stopPropagation(); seekMinimap(e) }}
            onPointerMove={(e) => { if (e.buttons === 1) seekMinimap(e) }}
            aria-hidden="true"
          >
            <img src={thumbSrc} alt="" draggable={false} />
            <span className="sp-minimap-window" style={{ left: minimap.x, top: minimap.y, width: minimap.winW, height: minimap.winH }} />
          </div>
        ) : null}

        {analysis ? <span className="sp-badge-count"><Crosshair size={11} /> {annotations.length} 处标注</span> : null}
      </div>

      {/* 当前标注读出 */}
      <div className={selected ? 'sp-readout is-active' : 'sp-readout'} aria-live="polite">
        {selected ? (
          <>
            <div className="sp-readout-head">
              <span className={`sp-kind-tag kind-${selected.kind}`}>{annotationKindLabel(selected.kind)}</span>
              <b>{selected.label}</b>
            </div>
            <p>{selected.text}</p>
            <button className="sp-readout-close" onClick={() => onSelect(null)}>取消选中</button>
          </>
        ) : (
          <p className="sp-readout-empty">
            {analysis
              ? <>点击画面中的编号热点，或在右侧标注清单中选择——视图会自动放大到该区域，并用 <b>辅助线 · 区域遮罩 · 视觉中心</b> 解释构图关系。</>
              : <>当前为原图模式。点击 <b>分析模式</b> 或按 <kbd>A</kbd> 显示构图标注。</>}
          </p>
        )}
      </div>
    </div>
  )
}
