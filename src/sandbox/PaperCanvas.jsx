import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Lock, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { FONT_DEFS } from '../lib/fonts'
import { GestureArbiter } from '../lib/gestures'
import { GRID_SIZE } from '../lib/layout'

const FALLBACK_STACK = `'Songti SC','STSong','SimSun','Noto Serif SC',serif`
const PAD = 72 // 纸面四周留给仪器（边界密度条等）的视窗边距

const MODE_TEXT = {
  idle: '待命',
  pending: '触探',
  drag: '拖动',
  viewpan: '平移视野',
  transform: '捏合 · 旋转'
}

function fontStack(fontId, degraded) {
  return degraded ? FALLBACK_STACK : `'${FONT_DEFS[fontId].family}',${FALLBACK_STACK}`
}

/**
 * 章法纸面：正文、落款、印章的渲染与全部手势交互。
 * 可视化图层：九宫格 / 留白边界 / 密度热力 / 视觉重心 / 重心轨迹 / 四边密度条。
 */
export default function PaperCanvas({
  work,
  comp,
  layout,
  metrics,
  locks,
  selected,
  trajectory,
  layers,
  fontReady,
  replaying,
  onSelect,
  onLiveComp,
  onCommitComp,
  onArbitrate
}) {
  const { w, h } = layout.paper
  const svgRef = useRef(null)
  const groupRef = useRef(null)
  const arbiterRef = useRef(null)
  const [view, setView] = useState({ s: 1, tx: 0, ty: 0 })
  const [mode, setMode] = useState('idle')
  const [flashLock, setFlashLock] = useState(null)

  // 切换作品时复位视野。
  useEffect(() => {
    setView({ s: 1, tx: 0, ty: 0 })
  }, [work.id])

  const compRef = useRef(comp)
  compRef.current = comp
  const viewRef = useRef(view)
  viewRef.current = view
  const gestureBase = useRef(null)

  const vbWidth = w + PAD * 2
  const vbHeight = h + PAD * 2

  /** 客户区位移 → 纸面位移。 */
  const clientDeltaToPaper = (dx, dy) => {
    const svg = svgRef.current
    if (!svg) return { dx: 0, dy: 0 }
    const vbPerClient = vbWidth / svg.clientWidth
    const s = viewRef.current.s
    return { dx: (dx * vbPerClient) / s, dy: (dy * vbPerClient) / s }
  }

  const emitArbitrate = (message) => onArbitrate?.(message)

  // ---- 手势仲裁器：挂载一次，经 ref 转发最新回调 ----
  const hooksRef = useRef(null)
  hooksRef.current = {
    hitTest(event) {
      const node = event.target.closest?.('[data-hit]')
      const kind = node?.dataset.hit || 'paper'
      const id = node?.dataset.id || null
      if (kind === 'seal') return { kind, id, locked: Boolean(locks.seals[id]) }
      if (kind === 'inscription') return { kind, id: 'inscription', locked: locks.inscription }
      if (kind === 'body') return { kind, id: 'body', locked: false }
      return { kind: 'paper' }
    },
    onMode(nextMode, reason) {
      setMode(nextMode)
      if (reason === 'pinch-preempts-drag') emitArbitrate('双指介入：拖动让位于捏合')
      if (reason === 'pinch-lifted') emitArbitrate('一指抬起：捏合收尾，回归单指')
    },
    onReject(reason, hit) {
      if (reason === 'locked') {
        setFlashLock(hit.id || hit.kind)
        setTimeout(() => setFlashLock(null), 700)
        emitArbitrate('元素已锁定：手势被驳回')
      } else if (reason === 'extra-pointer') {
        emitArbitrate('第三指被忽略：前两指已接管')
      }
    },
    onTap(hit) {
      if (!hit || hit.kind === 'paper' || hit.kind === 'body') onSelect(null)
      else onSelect({ kind: hit.kind, id: hit.id })
    },
    onDragStart(hit) {
      gestureBase.current = { kind: 'drag', hit, comp: JSON.parse(JSON.stringify(compRef.current)) }
    },
    onDrag({ dx, dy }) {
      const base = gestureBase.current
      if (!base || base.kind !== 'drag') return
      const delta = clientDeltaToPaper(dx, dy)
      const next = JSON.parse(JSON.stringify(base.comp))
      if (base.hit.kind === 'seal') {
        const seal = next.seals.find((item) => item.id === base.hit.id)
        if (!seal) return
        seal.x = base.comp.seals.find((item) => item.id === base.hit.id).x + delta.dx / w
        seal.y = base.comp.seals.find((item) => item.id === base.hit.id).y + delta.dy / h
      } else if (base.hit.kind === 'inscription') {
        next.inscription.x = base.comp.inscription.x + delta.dx / w
        next.inscription.y = base.comp.inscription.y + delta.dy / h
      } else {
        return
      }
      onLiveComp(next)
    },
    onDragEnd() {
      const base = gestureBase.current
      gestureBase.current = null
      if (!base) return
      const label = base.hit.kind === 'seal' ? '拖动印章' : '拖动落款'
      onCommitComp(compRef.current, label, `drag-${base.hit.kind}-${base.hit.id}`)
    },
    onDragCancel() {
      // 仲裁结果：捏合抢占拖动 → 回滚到拖动前状态。
      const base = gestureBase.current
      if (base?.kind === 'drag') onLiveComp(base.comp)
      gestureBase.current = null
    },
    onTransformStart(target) {
      if (target.kind === 'view') {
        gestureBase.current = { kind: 'view', view: { ...viewRef.current } }
      } else {
        gestureBase.current = { kind: 'element', target, comp: JSON.parse(JSON.stringify(compRef.current)) }
      }
    },
    onTransform({ scale, rotation }) {
      const base = gestureBase.current
      if (!base) return
      if (base.kind === 'view') {
        setView((v) => ({ ...v, s: Math.min(5, Math.max(0.45, base.view.s * scale)) }))
        return
      }
      const next = JSON.parse(JSON.stringify(base.comp))
      if (base.target.kind === 'seal') {
        const seal = next.seals.find((item) => item.id === base.target.id)
        const baseSeal = base.comp.seals.find((item) => item.id === base.target.id)
        if (!seal || !baseSeal) return
        seal.size = Math.min(220, Math.max(20, baseSeal.size * scale))
        seal.rotation = baseSeal.rotation + rotation
      } else if (base.target.kind === 'inscription') {
        next.inscription.scale = Math.min(1.2, Math.max(0.24, base.comp.inscription.scale * scale))
        next.inscription.rotation = Math.min(45, Math.max(-45, base.comp.inscription.rotation + rotation))
      }
      onLiveComp(next)
    },
    onTransformEnd() {
      const base = gestureBase.current
      gestureBase.current = null
      if (!base || base.kind !== 'element') return
      const label = base.target.kind === 'seal' ? '捏合印章' : '捏合落款'
      onCommitComp(compRef.current, label, `transform-${base.target.kind}-${base.target.id}`)
    },
    onViewPan({ dx, dy }) {
      const svg = svgRef.current
      if (!svg) return
      const vbPerClient = vbWidth / svg.clientWidth
      setView((v) => ({ ...v, tx: v.tx + dx * vbPerClient, ty: v.ty + dy * vbPerClient }))
    },
    onViewZoom({ delta, x, y }) {
      const svg = svgRef.current
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const vbX = ((x - rect.left) / rect.width) * vbWidth - PAD
      const vbY = ((y - rect.top) / rect.height) * vbHeight - PAD
      setView((v) => {
        const s2 = Math.min(5, Math.max(0.45, v.s * Math.exp(-delta * 0.0012)))
        const px = (vbX - v.tx) / v.s
        const py = (vbY - v.ty) / v.s
        return { s: s2, tx: vbX - px * s2, ty: vbY - py * s2 }
      })
    }
  }

  // 仲裁器挂在 <svg> 上：视野按钮等 HTML 控件在 svg 之外，不会被指针捕获波及。
  useEffect(() => {
    const arbiter = new GestureArbiter(svgRef.current, {
      hitTest: (event) => hooksRef.current.hitTest(event),
      onMode: (m, reason) => hooksRef.current.onMode(m, reason),
      onReject: (reason, hit) => hooksRef.current.onReject(reason, hit),
      onTap: (hit) => hooksRef.current.onTap(hit),
      onDragStart: (hit) => hooksRef.current.onDragStart(hit),
      onDrag: (delta) => hooksRef.current.onDrag(delta),
      onDragEnd: () => hooksRef.current.onDragEnd(),
      onDragCancel: () => hooksRef.current.onDragCancel(),
      onTransformStart: (target) => hooksRef.current.onTransformStart(target),
      onTransform: (t) => hooksRef.current.onTransform(t),
      onTransformEnd: () => hooksRef.current.onTransformEnd(),
      onViewPan: (delta) => hooksRef.current.onViewPan(delta),
      onViewZoom: (payload) => hooksRef.current.onViewZoom(payload)
    })
    arbiterRef.current = arbiter
    return () => arbiter.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 回放期间冻结手势。
  useEffect(() => {
    if (arbiterRef.current) arbiterRef.current.enabled = !replaying
  }, [replaying])

  const zoomBy = (factor) => {
    setView((v) => ({ ...v, s: Math.min(5, Math.max(0.45, v.s * factor)) }))
  }

  const bodyFamily = fontStack(work.fontId, !fontReady)
  const sealFamily = fontStack('seal', !fontReady)

  const heatCells = useMemo(() => {
    if (!layers.heatmap || !metrics) return []
    const cells = []
    const cw = w / GRID_SIZE
    const ch = h / GRID_SIZE
    for (let gy = 0; gy < GRID_SIZE; gy += 1) {
      for (let gx = 0; gx < GRID_SIZE; gx += 1) {
        const value = metrics.grid[gy * GRID_SIZE + gx]
        if (value > 0.02) cells.push({ x: gx * cw, y: gy * ch, value })
      }
    }
    return cells
  }, [layers.heatmap, metrics, w, h])

  const cw = w / GRID_SIZE
  const ch = h / GRID_SIZE

  return (
    <div className="sandbox-stage" style={{ aspectRatio: `${vbWidth} / ${vbHeight}` }}>
      <svg
        ref={svgRef}
        viewBox={`${-PAD} ${-PAD} ${vbWidth} ${vbHeight}`}
        role="img"
        aria-label={`${work.title} 章法纸面`}
      >
        <g ref={groupRef} transform={`translate(${view.tx} ${view.ty}) scale(${view.s})`}>
          {/* 纸 */}
          <rect x={0} y={0} width={w} height={h} className="paper-rect" data-hit="paper" />
          <rect x={0} y={0} width={w} height={h} className="paper-edge" pointerEvents="none" />

          {/* 九宫格 */}
          {layers.jiugong && (
            <g className="jiugong" pointerEvents="none">
              {[1, 2].map((i) => (
                <line key={`v${i}`} x1={(w / 3) * i} y1={0} x2={(w / 3) * i} y2={h} />
              ))}
              {[1, 2].map((i) => (
                <line key={`h${i}`} x1={0} y1={(h / 3) * i} x2={w} y2={(h / 3) * i} />
              ))}
            </g>
          )}

          {/* 留白边界（随边距滑杆实时变化） */}
          {layers.margin && (
            <rect
              className="margin-guide"
              x={layout.margin.l}
              y={layout.margin.t}
              width={w - layout.margin.l - layout.margin.r}
              height={h - layout.margin.t - layout.margin.b}
              pointerEvents="none"
            />
          )}

          {/* 密度热力 */}
          {layers.heatmap && (
            <g pointerEvents="none">
              {heatCells.map((cell, i) => (
                <rect
                  key={i}
                  x={cell.x}
                  y={cell.y}
                  width={cw + 0.5}
                  height={ch + 0.5}
                  fill={`rgba(176,58,38,${Math.min(0.5, cell.value * 1.15)})`}
                />
              ))}
            </g>
          )}

          {/* 正文 */}
          <g data-hit="body" className={locks.body ? 'is-locked' : ''}>
            {layout.bodyChars.map((c) => (
              <text
                key={c.index}
                x={c.x}
                y={c.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={layout.fontSize}
                fontFamily={bodyFamily}
                className="body-char"
              >
                {c.char}
              </text>
            ))}
          </g>

          {/* 落款 */}
          <g
            data-hit="inscription"
            className={`inscription ${selected?.kind === 'inscription' ? 'is-selected' : ''}`}
            transform={
              comp.inscription.rotation
                ? `rotate(${comp.inscription.rotation} ${layout.insChars[0]?.x ?? 0} ${layout.insChars[0]?.y ?? 0})`
                : undefined
            }
          >
            {layout.insChars.map((c, i) => (
              <text
                key={i}
                x={c.x}
                y={c.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={layout.insFont}
                fontFamily={bodyFamily}
                className="ins-char"
              >
                {c.char}
              </text>
            ))}
            {locks.inscription && (
              <LockBadge x={layout.insChars[0]?.x ?? 0} y={(layout.insBBox?.y0 ?? 0) - 16} />
            )}
          </g>

          {/* 印章 */}
          {layout.seals.map((seal) => {
            const chars = [...seal.chars]
            const locked = Boolean(locks.seals[seal.id])
            const isSelected = selected?.kind === 'seal' && selected.id === seal.id
            return (
              <g
                key={seal.id}
                data-hit="seal"
                data-id={seal.id}
                className={`seal ${isSelected ? 'is-selected' : ''}`}
                transform={`translate(${seal.px} ${seal.py}) rotate(${seal.rotation})`}
              >
                <rect
                  x={-seal.size / 2}
                  y={-seal.size / 2}
                  width={seal.size}
                  height={seal.size}
                  rx={seal.size * 0.09}
                  className="seal-bg"
                />
                <rect
                  x={-seal.size / 2 + seal.size * 0.07}
                  y={-seal.size / 2 + seal.size * 0.07}
                  width={seal.size * 0.86}
                  height={seal.size * 0.86}
                  rx={seal.size * 0.05}
                  className="seal-inner"
                />
                {chars.length === 1 ? (
                  <text
                    x={0}
                    y={0}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={seal.size * 0.6}
                    fontFamily={sealFamily}
                    className="seal-char"
                  >
                    {chars[0]}
                  </text>
                ) : (
                  chars.map((char, i) => (
                    <text
                      key={i}
                      x={0}
                      y={(i - (chars.length - 1) / 2) * seal.size * 0.42}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={seal.size * 0.38}
                      fontFamily={sealFamily}
                      className="seal-char"
                    >
                      {char}
                    </text>
                  ))
                )}
                {locked && <LockBadge x={0} y={-seal.size / 2 - 12} />}
              </g>
            )
          })}

          {/* 重心轨迹 */}
          {layers.trajectory && trajectory.length > 1 && (
            <g pointerEvents="none">
              <polyline
                className="trajectory"
                points={trajectory.map((p) => `${p.x},${p.y}`).join(' ')}
              />
              {trajectory.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={2.4}
                  className="trajectory-dot"
                  opacity={0.15 + (0.85 * (i + 1)) / trajectory.length}
                />
              ))}
            </g>
          )}

          {/* 视觉重心 */}
          {layers.centroid && metrics && (
            <g pointerEvents="none" className="centroid-layer">
              <line x1={metrics.centroid.x} y1={0} x2={metrics.centroid.x} y2={h} className="centroid-line" />
              <line x1={0} y1={metrics.centroid.y} x2={w} y2={metrics.centroid.y} className="centroid-line" />
              <line
                x1={metrics.ideal.x}
                y1={metrics.ideal.y}
                x2={metrics.centroid.x}
                y2={metrics.centroid.y}
                className="centroid-dev"
              />
              <path
                className="ideal-marker"
                d={`M ${metrics.ideal.x} ${metrics.ideal.y - 9} L ${metrics.ideal.x + 9} ${metrics.ideal.y} L ${metrics.ideal.x} ${metrics.ideal.y + 9} L ${metrics.ideal.x - 9} ${metrics.ideal.y} Z`}
              />
              <circle cx={metrics.centroid.x} cy={metrics.centroid.y} r={11} className="centroid-ring" />
              <circle cx={metrics.centroid.x} cy={metrics.centroid.y} r={3.2} className="centroid-dot" />
            </g>
          )}

          {/* 四边密度条（纸外仪器区） */}
          {layers.boundary && metrics && (
            <g pointerEvents="none" className="boundary-layer">
              <BoundaryBar orientation="top" value={metrics.boundary.top} w={w} h={h} />
              <BoundaryBar orientation="right" value={metrics.boundary.right} w={w} h={h} />
              <BoundaryBar orientation="bottom" value={metrics.boundary.bottom} w={w} h={h} />
              <BoundaryBar orientation="left" value={metrics.boundary.left} w={w} h={h} />
            </g>
          )}
        </g>
      </svg>

      {/* 视野控制 */}
      <div className="view-controls">
        <button onClick={() => zoomBy(1.25)} aria-label="放大视野" title="放大">
          <ZoomIn size={15} />
        </button>
        <button onClick={() => zoomBy(0.8)} aria-label="缩小视野" title="缩小">
          <ZoomOut size={15} />
        </button>
        <button onClick={() => setView({ s: 1, tx: 0, ty: 0 })} aria-label="复位视野" title="复位视野">
          <Maximize2 size={15} />
        </button>
      </div>

      {/* 手势模式指示 */}
      <div className={`gesture-mode ${mode !== 'idle' ? 'is-active' : ''}`} aria-live="polite">
        {MODE_TEXT[mode]}
      </div>

      {/* 锁定驳回闪烁 */}
      {flashLock && (
        <div className="lock-flash">
          <Lock size={13} /> 已锁定
        </div>
      )}

      {/* 失衡角标 */}
      {metrics && metrics.maxLevel > 0 && (
        <div className={`balance-flag level-${metrics.maxLevel}`}>
          {metrics.maxLevel === 2 ? '章法失衡' : '行气微倾'}
        </div>
      )}
    </div>
  )
}

function LockBadge({ x, y }) {
  return (
    <g className="lock-badge" transform={`translate(${x} ${y})`} pointerEvents="none">
      <circle r={9} />
      <text y={0.5} textAnchor="middle" dominantBaseline="central">
        锁
      </text>
    </g>
  )
}

function BoundaryBar({ orientation, value, w, h }) {
  const pct = Math.round(value * 100)
  const common = { className: `boundary-bar ${value > 0.5 ? 'is-hot' : ''}` }
  if (orientation === 'top') {
    return (
      <g>
        <rect x={0} y={-34} width={w} height={10} className="boundary-track" />
        <rect x={0} y={-34} width={w * value} height={10} {...common} />
        <text x={0} y={-42} className="boundary-label">上 {pct}%</text>
      </g>
    )
  }
  if (orientation === 'bottom') {
    return (
      <g>
        <rect x={0} y={h + 24} width={w} height={10} className="boundary-track" />
        <rect x={0} y={h + 24} width={w * value} height={10} {...common} />
        <text x={0} y={h + 52} className="boundary-label">下 {pct}%</text>
      </g>
    )
  }
  if (orientation === 'left') {
    return (
      <g>
        <rect x={-34} y={0} width={10} height={h} className="boundary-track" />
        <rect x={-34} y={0} width={10} height={h * value} {...common} />
        <text x={-42} y={0} className="boundary-label vertical" transform={`rotate(-90 -42 0)`}>
          左 {pct}%
        </text>
      </g>
    )
  }
  return (
    <g>
      <rect x={w + 24} y={0} width={10} height={h} className="boundary-track" />
      <rect x={w + 24} y={0} width={10} height={h * value} {...common} />
      <text x={w + 32} y={0} className="boundary-label vertical" transform={`rotate(-90 ${w + 32} 0)`}>
        右 {pct}%
      </text>
    </g>
  )
}
