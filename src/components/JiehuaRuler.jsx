import React from 'react'
import { Ruler } from 'lucide-react'
import { LazyPainting, MissingText, ViewPoints } from './common'
import { getSubjectView } from '../data/taxonomy'

/**
 * 界画 · 界尺观法
 * 强调建筑秩序：每张图带编号标尺与结构标签，横向层叠成“营造档”，
 * 与人物手卷的阅读节奏完全不同——先读尺度，再读人事。
 */
export default function JiehuaRuler({ artworks, onOpen, scrollerRef }) {
  return (
    <div className="ruler-layout">
      <div className="ruler-scale" aria-hidden="true">
        {Array.from({ length: 41 }, (_, i) => (
          <span key={i} className={i % 5 === 0 ? 'tick major' : 'tick'}>{i % 5 === 0 ? i : ''}</span>
        ))}
      </div>
      <div className="ruler-track" ref={scrollerRef}>
        {artworks.map((artwork, index) => {
          const view = getSubjectView(artwork, 'jiehua')
          return (
            <article key={artwork.id} className="ruler-card">
              <div className="ruler-index"><Ruler size={13} /><span>营造 {String(index + 1).padStart(2, '0')}</span></div>
              <button className="ruler-image-btn" onClick={() => onOpen(artwork)} aria-label={`查看${artwork.title}`}>
                <LazyPainting artwork={artwork} ratio="980 / 560" />
                <span className="ruler-tag">{artwork.art?.structure === 'bridge' ? '虹桥 · 舟船结构' : artwork.art?.structure === 'tower' ? '楼阁 · 江天尺度' : '宫苑 · 连廊折算'}</span>
              </button>
              <div className="ruler-body">
                <div className="card-meta">
                  <span>{artwork.dynasty ?? <MissingText>年代不详</MissingText>} · {artwork.artist ?? <MissingText>佚名</MissingText>}</span>
                </div>
                <h3>{artwork.title}</h3>
                <p className="ruler-focus"><b>表现对象</b>{view.focus ?? <MissingText>未著录</MissingText>}</p>
                <ViewPoints artwork={artwork} subjectId="jiehua" dense />
              </div>
            </article>
          )
        })}
      </div>
      <p className="ruler-footnote">界画以界尺引线、折算无差；横向滚动可逐组读取建筑与人群尺度。</p>
    </div>
  )
}
