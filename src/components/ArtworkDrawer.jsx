import React, { useEffect } from 'react'
import { Bookmark, GitBranch, Layers3, X } from 'lucide-react'
import { LazyPainting, MissingText, ViewPoints } from './common'
import { getArtworkSubjects, getSubjectView } from '../data/taxonomy'

/**
 * 作品详情抽屉
 * 多重归类的作品在此可见全部归属画科；切换画科观察点随之改变（数据仍只有一份）。
 */
export default function ArtworkDrawer({ artwork, onClose, onJumpSubject, isFavorite, onToggleFavorite, artworkById }) {
  useEffect(() => {
    if (!artwork) return undefined
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [artwork, onClose])

  if (!artwork) return null
  const subjectList = getArtworkSubjects(artwork)
  const primary = subjectList[0]

  return (
    <div className="detail-backdrop" onClick={onClose}>
      <aside className="detail-panel" onClick={(e) => e.stopPropagation()} aria-label={`${artwork.title}详情`}>
        <button className="close-panel" onClick={onClose} aria-label="关闭详情"><X size={19} /></button>
        <div className="detail-image">
          <LazyPainting artwork={artwork} eager className="detail-art-wrap" />
        </div>
        <div className="detail-content">
          <div className="card-meta">
            <span>{artwork.dynasty ?? <MissingText>年代不详</MissingText>} · {artwork.year ?? <MissingText />}</span>
            <span>{artwork.domain}</span>
          </div>
          <h2>{artwork.title}</h2>
          <p className="detail-artist">
            {artwork.artist ?? <MissingText>作者待考</MissingText>} · {artwork.medium}
            {artwork.location ? <> · 藏于 {artwork.location}</> : null}
          </p>

          {subjectList.length ? (
            <div className="subject-tags" aria-label="所属画科">
              <Layers3 size={13} />
              {subjectList.map((subject) => (
                <button key={subject.id} className="subject-tag" onClick={() => onJumpSubject(subject.id)}>
                  {subject.name}
                  {subjectList.length > 1 ? <em>同一作品 · 不同观法</em> : null}
                </button>
              ))}
            </div>
          ) : (
            <p className="missing-note">该作品不属于绘画分科（书法 / 陶瓷等总库门类）。</p>
          )}

          {primary ? (
            <div className="detail-viewpoints">
              {subjectList.map((subject) => {
                const view = getSubjectView(artwork, subject.id)
                return (
                  <div key={subject.id} className="detail-view-block">
                    <button className="view-block-head" onClick={() => onJumpSubject(subject.id)}>
                      在「{subject.name}」中观看 <GitBranch size={12} />
                    </button>
                    <ViewPoints artwork={{ ...artwork, matter: view.matter, composition: view.composition, focus: view.focus, subjectViews: undefined }} />
                  </div>
                )
              })}
            </div>
          ) : null}

          <p className="detail-summary">{artwork.summary}</p>
          <div className="detail-copy"><p>{artwork.detail}</p></div>

          {artwork.tags?.length ? (
            <div className="detail-tags">{artwork.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          ) : null}

          <div className="detail-actions">
            <button className="primary-btn" onClick={() => onToggleFavorite(artwork.id)}>
              <Bookmark size={15} fill={isFavorite ? 'currentColor' : 'none'} />
              {isFavorite ? '已收藏' : '收藏作品'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}
