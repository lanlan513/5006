import React, { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Eye, ImageOff, Layers, Loader2, Scan } from 'lucide-react'
import { resolveArtworkImage } from '../lib/painting'

/**
 * 懒加载作品图：
 * - IntersectionObserver 在接近视口时才解析并挂载 <img>，外层固定 aspect-ratio 预留版面，
 *   因此手卷/ masonry 在图片解码前后高度一致，切换画科恢复滚动位置不会跳动；
 * - 图像数据整体缺失（无外链也无本地示意画）时显示“图像缺失”占位；
 * - 外链加载失败时自动回落到本地示意画，再失败才进入错误占位。
 */
export function LazyPainting({ artwork, ratio, className = '', eager = false, altSuffix = '（示意）' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(eager)
  const [failedSources, setFailedSources] = useState([])

  useEffect(() => {
    if (visible || !ref.current) return undefined
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return undefined
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '320px 0px', threshold: 0.01 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [visible])

  const remote = typeof artwork.image === 'string' ? artwork.image : null
  const local = resolveArtworkImage(artwork, { preferLocal: false })
  const candidates = [remote, local].filter(Boolean).filter((src) => !failedSources.includes(src))
  const hasAnySource = Boolean(remote ?? local)
  const src = candidates[0] ?? null

  const aspect = ratio ?? (artwork.art?.kind === 'landscape' ? '620 / 880' : artwork.art?.kind === 'flowerbird' ? '1 / 1' : artwork.art?.kind === 'jiehua' ? '980 / 560' : '900 / 470')

  return (
    <div ref={ref} className={`lazy-frame ${className}`} style={{ aspectRatio: aspect }}>
      {!hasAnySource ? (
        <MissingImage label="图像缺失 · 待补摄" />
      ) : visible && src ? (
        <>
          <div className="lazy-veil" aria-hidden="true" />
          <img
            src={src}
            alt={`${artwork.title}${altSuffix}`}
            loading="lazy"
            decoding="async"
            draggable="false"
            onLoad={(event) => event.currentTarget.classList.add('is-loaded')}
            onError={() => setFailedSources((prev) => (prev.includes(src) ? prev : [...prev, src]))}
          />
        </>
      ) : (
        <div className="lazy-pending" role="status" aria-label="图像等待加载">
          <Loader2 size={18} className="spin" />
        </div>
      )}
    </div>
  )
}

export function MissingImage({ label = '图像缺失' }) {
  return (
    <div className="missing-image" role="img" aria-label={label}>
      <ImageOff size={22} />
      <span>{label}</span>
    </div>
  )
}

/** 观察点：题材 / 构图 / 表现对象。字段可能缺失（数据未著录）。 */
export function ViewPoints({ artwork, subjectId, dense = false }) {
  const views = subjectId
    ? {
        matter: artwork.subjectViews?.[subjectId]?.matter ?? artwork.matter,
        composition: artwork.subjectViews?.[subjectId]?.composition ?? artwork.composition,
        focus: artwork.subjectViews?.[subjectId]?.focus ?? artwork.focus
      }
    : { matter: artwork.matter, composition: artwork.composition, focus: artwork.focus }

  const items = [
    { icon: Eye, label: '题材', value: views.matter },
    { icon: Layers, label: '构图', value: views.composition },
    { icon: Scan, label: '表现对象', value: views.focus }
  ].filter((item) => item.value)

  if (!items.length) {
    return (
      <p className={`missing-note ${dense ? 'dense' : ''}`}>
        <AlertTriangle size={12} /> 观察点尚待著录
      </p>
    )
  }
  return (
    <dl className={`view-points ${dense ? 'dense' : ''}`}>
      {items.map((item) => (
        <div key={item.label} className="view-point">
          <dt><item.icon size={12} />{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function EmptyState({ icon: Icon, title, children, actions }) {
  return (
    <div className="empty-state" role="status">
      {Icon ? <Icon size={26} /> : null}
      <h3>{title}</h3>
      {children}
      {actions ? <div className="empty-actions">{actions}</div> : null}
    </div>
  )
}

export function MissingText({ children = '待考' }) {
  return <span className="missing-text" title="数据缺失">{children}</span>
}

/** 兼属多科的作品标记：提示读者此件数据只有一份、从不同画科都能进入。 */
export function MultiSubjectBadge({ artwork, subjects, onJump, currentSubjectId }) {
  const others = (artwork.subjectIds ?? []).filter((id) => id !== currentSubjectId)
  if (!others.length) return null
  return (
    <span className="multi-badge" title={`此作品同时属于：${artwork.subjectIds.join('、')}（单一数据，多处引用）`}>
      兼属
      {onJump
        ? others.map((id) => (
            <button key={id} onClick={(e) => { e.stopPropagation(); onJump(id) }}>
              {subjects?.find?.((s) => s.id === id)?.name ?? id}
            </button>
          ))
        : null}
    </span>
  )
}
