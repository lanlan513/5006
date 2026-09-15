import React, { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, ScrollText } from 'lucide-react'
import { LazyPainting, MissingText, ViewPoints } from './common'
import { getSubjectView } from '../data/taxonomy'

/**
 * 人物画 · 手卷观法
 * 横向长卷：作品像卷轴一样在横轴上徐徐展开，卡片为不等宽横幅，
 * 底部有可拖动的卷杆进度条，内部 scrollLeft 参与画科浏览位置记忆。
 */
export default function FigureHandscroll({ artworks, onOpen, scrollerRef }) {
  const railRef = useRef(null)

  useEffect(() => {
    const scroller = scrollerRef?.current
    const rail = railRef.current
    if (!scroller || !rail) return undefined

    const syncRail = () => {
      const max = scroller.scrollWidth - scroller.clientWidth
      const ratio = max > 0 ? scroller.scrollLeft / max : 0
      rail.style.setProperty('--progress', `${ratio * 100}%`)
    }
    const onWheel = (event) => {
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        scroller.scrollBy({ left: event.deltaY, behavior: 'auto' })
        event.preventDefault()
      }
    }
    syncRail()
    scroller.addEventListener('scroll', syncRail, { passive: true })
    scroller.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      scroller.removeEventListener('scroll', syncRail)
      scroller.removeEventListener('wheel', onWheel)
    }
  }, [scrollerRef])

  const nudge = (delta) => scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' })

  const dragRail = (event) => {
    const scroller = scrollerRef.current
    const rail = railRef.current
    if (!scroller || !rail || event.button !== 0) return
    event.preventDefault()
    const jump = (clientX) => {
      const rect = rail.getBoundingClientRect()
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      const max = scroller.scrollWidth - scroller.clientWidth
      scroller.scrollTo({ left: ratio * max })
    }
    jump(event.clientX)
    const move = (e) => jump(e.clientX)
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }

  return (
    <div className="handscroll-layout">
      <div className="scroll-controls">
        <button className="scroll-arrow" onClick={() => nudge(-460)} aria-label="向左展开画卷"><ChevronLeft size={18} /></button>
        <div className="scroll-rail" ref={railRef} onMouseDown={dragRail} role="scrollbar" aria-label="长卷进度" aria-controls="handscroll-track" tabIndex={0}>
          <div className="rail-progress" />
          <ScrollText size={15} className="rail-thumb" />
        </div>
        <button className="scroll-arrow" onClick={() => nudge(460)} aria-label="向右展开画卷"><ChevronRight size={18} /></button>
      </div>

      <div className="handscroll-track" id="handscroll-track" ref={scrollerRef}>
        <div className="handscroll-inner">
          {artworks.map((artwork, index) => {
            const view = getSubjectView(artwork, 'figure')
            return (
              <article key={artwork.id} className="scroll-card" style={{ width: index === 0 ? 520 : 430 + (index % 3) * 40 }}>
                <span className="scroll-seal">{String(index + 1).padStart(2, '0')}</span>
                <button className="scroll-image-btn" onClick={() => onOpen(artwork)} aria-label={`查看${artwork.title}`}>
                  <LazyPainting artwork={artwork} ratio="900 / 470" />
                  <span className="scroll-hint">展开细读</span>
                </button>
                <div className="scroll-card-body">
                  <div className="card-meta">
                    <span>{artwork.dynasty ?? <MissingText>年代不详</MissingText>}</span>
                    <span>{artwork.medium}</span>
                  </div>
                  <h3>{artwork.title}</h3>
                  <p>{artwork.artist ?? <MissingText>佚名</MissingText>}</p>
                  <p className="scroll-focus">
                    <b>表现对象</b>{view.focus ?? <MissingText>未著录</MissingText>}
                  </p>
                  <ViewPoints artwork={artwork} subjectId="figure" dense />
                </div>
              </article>
            )
          })}
          <div className="handscroll-end"><span>卷终</span></div>
        </div>
      </div>
    </div>
  )
}
