import React, { useMemo, useState } from 'react'
import { Mountain } from 'lucide-react'
import { LazyPainting, MissingText, ViewPoints } from './common'
import { getSubjectView } from '../data/taxonomy'

const COMPOSITION_GROUPS = [
  { id: 'high', name: '高远', sub: '自山下仰山巅' },
  { id: 'deep', name: '深远', sub: '自山前窥山后' },
  { id: 'flat', name: '平远', sub: '自近山望远山' },
  { id: 'corner', name: '边角', sub: '马一角 · 夏半边' }
]

function compositionOf(artwork) {
  return artwork.art?.composition ?? (artwork.composition?.includes('边角') ? 'corner' : null)
}

/**
 * 山水画 · 立轴观法
 * 按“高远 / 深远 / 平远 / 边角”分组立轴悬挂，每组高度错落（masonry 三列），
 * 以竖向卡片还原立轴比例；可开关构图标记，帮助观者识别取景法。
 */
export default function LandscapeHanging({ artworks, onOpen }) {
  const [showMarks, setShowMarks] = useState(true)

  const groups = useMemo(() => {
    const map = new Map(COMPOSITION_GROUPS.map((group) => [group.id, { ...group, items: [] }]))
    const ungrouped = []
    artworks.forEach((artwork) => {
      const key = compositionOf(artwork)
      if (key && map.has(key)) map.get(key).items.push(artwork)
      else ungrouped.push(artwork)
    })
    return [...map.values()].filter((group) => group.items.length > 0)
      .concat(ungrouped.length ? [{ id: 'other', name: '取景待考', sub: '构图著录缺失', items: ungrouped }] : [])
  }, [artworks])

  return (
    <div className="hanging-layout">
      <div className="hanging-toolbar">
        <span className="hanging-note">依郭熙“三远”与南宋边角法分组悬挂</span>
        <label className="mark-toggle">
          <input type="checkbox" checked={showMarks} onChange={(e) => setShowMarks(e.target.checked)} />
          显示构图标记
        </label>
      </div>

      {groups.map((group) => (
        <section key={group.id} className="hanging-group" aria-label={`${group.name}构图`}>
          <header className="hanging-group-head">
            <Mountain size={15} />
            <h4>{group.name}</h4>
            <span>{group.sub}</span>
            <em>{group.items.length} 轴</em>
          </header>
          <div className="hanging-columns">
            {group.items.map((artwork, index) => {
              const view = getSubjectView(artwork, 'landscape')
              const tall = index % 3 === 0
              return (
                <article key={artwork.id} className={`hanging-card ${tall ? 'is-tall' : ''}`}>
                  <button className="hanging-image-btn" onClick={() => onOpen(artwork)} aria-label={`查看${artwork.title}`}>
                    <LazyPainting artwork={artwork} ratio={tall ? '620 / 900' : '620 / 820'} />
                    {showMarks && (
                      <>
                        <span className={`comp-mark comp-${compositionOf(artwork) ?? 'other'}`} aria-hidden="true">
                          {group.name}
                        </span>
                        <span className="axis-line" aria-hidden="true" />
                      </>
                    )}
                  </button>
                  <div className="hanging-body">
                    <div className="card-meta">
                      <span>{artwork.dynasty ?? <MissingText>年代不详</MissingText>} · {artwork.artist ?? <MissingText>佚名</MissingText>}</span>
                    </div>
                    <h3>{artwork.title}</h3>
                    <p className="hanging-comp"><b>构图</b>{view.composition ?? <MissingText>未著录</MissingText>}</p>
                    <ViewPoints artwork={artwork} subjectId="landscape" dense />
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
