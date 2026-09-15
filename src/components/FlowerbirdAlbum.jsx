import React, { useMemo, useState } from 'react'
import { Bird, Bug, Flower2 } from 'lucide-react'
import { EmptyState, LazyPainting, MissingText, ViewPoints } from './common'

const MOTIF_FILTERS = [
  { id: 'all', name: '全部', icon: null },
  { id: 'bird', name: '禽鸟', icon: Bird, match: (art) => ['birds', 'pheasant', 'magpie', 'crane'].includes(art.art?.motif) },
  { id: 'flower', name: '花卉', icon: Flower2, match: (art) => ['plum', 'lotus'].includes(art.art?.motif) },
  { id: 'insect', name: '草虫鳞介', icon: Bug, match: (art) => art.art?.motif === 'insect' }
]

/**
 * 花鸟画 · 册页观法
 * 斗方册页逐开铺陈：方形裁切、密集网格；悬停翻转显示表现对象。
 * 题材筛选是本布局独有的观看工具；未命中时走册页专属的空态。
 */
export default function FlowerbirdAlbum({ artworks, onOpen }) {
  const [motif, setMotif] = useState('all')

  const filtered = useMemo(() => {
    const filter = MOTIF_FILTERS.find((item) => item.id === motif)
    return filter && filter.match ? artworks.filter(filter.match) : artworks
  }, [artworks, motif])

  return (
    <div className="album-layout">
      <div className="album-toolbar" role="tablist" aria-label="花鸟题材筛选">
        {MOTIF_FILTERS.map((filter) => (
          <button
            key={filter.id}
            role="tab"
            aria-selected={motif === filter.id}
            className={motif === filter.id ? 'album-filter active' : 'album-filter'}
            onClick={() => setMotif(filter.id)}
          >
            {filter.icon ? <filter.icon size={13} /> : null}
            {filter.name}
            <em>{filter.match ? artworks.filter(filter.match).length : artworks.length}</em>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Flower2} title="此题材册页暂缺" actions={null}>
          <p>当前画科中没有「{MOTIF_FILTERS.find((f) => f.id === motif)?.name}」题材的著录，可切换其他题材继续观看。</p>
          <button className="ghost-btn" onClick={() => setMotif('all')}>回到全部册页</button>
        </EmptyState>
      ) : (
        <div className="album-grid">
          {filtered.map((artwork) => (
            <article key={artwork.id} className="album-card">
              <button className="album-image-btn" onClick={() => onOpen(artwork)} aria-label={`查看${artwork.title}`}>
                <LazyPainting artwork={artwork} ratio="1 / 1" />
                <div className="album-flip">
                  <b>主要表现对象</b>
                  <span>{artwork.focus ?? <MissingText>未著录</MissingText>}</span>
                </div>
              </button>
              <div className="album-body">
                <h3>{artwork.title}</h3>
                <p>
                  {artwork.dynasty ?? <MissingText>年代不详</MissingText>} · {artwork.artist ?? <MissingText>佚名</MissingText>}
                </p>
                <ViewPoints artwork={artwork} subjectId="flower-bird" dense />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
