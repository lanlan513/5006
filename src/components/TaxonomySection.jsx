import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, BookOpenText, Boxes, Database, GitFork, SearchX } from 'lucide-react'
import { subjects, getSubject, selectArtworksBySubject } from '../data/taxonomy'
import { LazyPainting, EmptyState, MissingText, MultiSubjectBadge } from './common'
import FigureHandscroll from './FigureHandscroll'
import LandscapeHanging from './LandscapeHanging'
import FlowerbirdAlbum from './FlowerbirdAlbum'
import JiehuaRuler from './JiehuaRuler'

/**
 * 画科馆（核心区块）
 * - 一级入口为画科 tab；每种画科渲染不同布局组件，而不是复用同一个作品列表；
 * - 分类结果由 taxonomy 索引按 ID 实时解析，组件内不硬编码任何作品；
 * - 切换画科时记住 window 纵向位置与布局内部横向滚动，重新进入即还原；
 * - 搜索时覆盖为中性的“全库结果”网格，清空搜索回到原画科与原位置；
 * - 空画科、作品缺字段、坏的分类引用都在此被显式处理。
 */
export default function TaxonomySection({
  activeSubjectId,
  onSubjectChange,
  artworkRows,
  taxonomy,
  query,
  results,
  onOpen,
  statusMessage,
  favorites,
  onToggleFavorite
}) {
  const activeSubject = getSubject(activeSubjectId) ?? subjects[0]
  const sectionRef = useRef(null)
  const scrollerRef = useRef(null)
  const innerMemoryRef = useRef({})
  const scrollMemoryRef = useRef(loadInitialScrollMemory())
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const isSearching = query.trim().length > 0

  const artworkById = useMemo(() => new Map(artworkRows.map((row) => [row.id, row])), [artworkRows])

  // —— 当前画科结果：由 ID 关系动态解析，组件不持有作品副本 ——
  const subjectArtworks = useMemo(
    () => selectArtworksBySubject(artworkRows, taxonomy, activeSubject.id, artworkById),
    [artworkRows, taxonomy, activeSubject.id, artworkById]
  )

  // 离开某个画科前，保存它的内部滚动位置。
  const captureInner = useCallback((subjectId) => {
    if (scrollerRef.current) innerMemoryRef.current[subjectId] = scrollerRef.current.scrollLeft
  }, [])

  // 画科切换：先记忆旧画科，再在布局挂载后还原新画科的两个滚动位置。
  useLayoutEffect(() => {
    const remembered = scrollMemoryRef.current[activeSubject.id]
    const frame = requestAnimationFrame(() => {
      window.scrollTo({ top: remembered?.windowY ?? 0, behavior: 'auto' })
      if (scrollerRef.current) scrollerRef.current.scrollLeft = innerMemoryRef.current[activeSubject.id] ?? 0
    })
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubject.id])

  // 实时记录当前画科 windowY（节流写入 localStorage）。
  // 注意：切换画科时 cleanup 不做“收尾保存”——那时 window.scrollY 已是新画科恢复前的
  // 瞬时位置，写入反而会污染记忆；保存动作统一交给 changeSubject 与滚动监听。
  useEffect(() => {
    let frame = 0
    const persist = () => {
      const next = { ...scrollMemoryRef.current, [activeSubject.id]: { windowY: window.scrollY, at: Date.now() } }
      scrollMemoryRef.current = next
      try { localStorage.setItem('cam-scroll-memory', JSON.stringify(next)) } catch { /* private mode */ }
    }
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(persist)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [activeSubject.id])

  const changeSubject = (subjectId) => {
    if (subjectId === activeSubject.id) return
    // 切换瞬间：把旧画科的两个浏览位置（window 纵向 + 布局内部横向）固化。
    captureInner(activeSubject.id)
    scrollMemoryRef.current = {
      ...scrollMemoryRef.current,
      [activeSubject.id]: { windowY: window.scrollY, at: Date.now() }
    }
    try { localStorage.setItem('cam-scroll-memory', JSON.stringify(scrollMemoryRef.current)) } catch { /* private mode */ }
    onSubjectChange(subjectId)
  }

  const warnings = taxonomy?.warnings ?? []
  const missingWarns = warnings.filter((w) => w.type === 'missing-field')
  const relationWarns = warnings.filter((w) => w.type === 'unknown-subject')

  return (
    <section className="taxonomy-section" id="taxonomy" ref={sectionRef}>
      <div className="taxonomy-head">
        <div className="section-kicker"><span className="eyebrow-line" />画科分类 / TAXONOMY</div>
        <h2>先分科，<i>再观看。</i></h2>
        <p className="taxonomy-lead">
          人物、山水、花鸟、界画各自拥有独立的观看方式：人物宜展卷、山水立轴远观、花鸟册页细读、界画沿尺读数。
          分类只是作品之间的关系——一件作品可兼属数科，数据始终只有一份。
        </p>
      </div>

      {/* 一级入口：画科 tabs */}
      <div className="subject-tabs" role="tablist" aria-label="中国画科">
        {subjects.map((subject) => {
          const count = taxonomy?.counts?.[subject.id] ?? 0
          return (
            <button
              key={subject.id}
              role="tab"
              aria-selected={!isSearching && activeSubject.id === subject.id}
              className={!isSearching && activeSubject.id === subject.id ? 'subject-tab active' : 'subject-tab'}
              onClick={() => changeSubject(subject.id)}
              data-layout={subject.layout}
            >
              <span className="tab-char">{subject.name.slice(0, 1)}</span>
              <span className="tab-copy">
                <b>{subject.name}</b>
                <small>{subject.pinyin}</small>
              </span>
              <span className={`tab-count ${count === 0 ? 'is-zero' : ''}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {statusMessage ? <p className="data-banner" role="status"><Database size={13} />{statusMessage}</p> : null}
      {missingWarns.length ? (
        <p className="data-banner warn" role="status">
          <AlertTriangle size={13} />
          {missingWarns.length} 件作品存在著录缺项（作者 / 年代 / 图像），界面中以“待考”“图像缺失”如实标注，而不是隐藏数据。
        </p>
      ) : null}

      {isSearching ? (
        <SearchGrid query={query} results={results} onOpen={onOpen} subjectsList={subjects} onJumpSubject={changeSubject} />
      ) : (
        <>
          <SubjectHeader subject={activeSubject} count={subjectArtworks.length} onInspector={() => setInspectorOpen((v) => !v)} inspectorOpen={inspectorOpen} />
          {inspectorOpen ? <TaxonomyInspector taxonomy={taxonomy} artworkById={artworkById} onJumpSubject={changeSubject} relationWarns={relationWarns} /> : null}
          <SubjectLayout
            subject={activeSubject}
            artworks={subjectArtworks}
            onOpen={onOpen}
            scrollerRef={scrollerRef}
          />
        </>
      )}
    </section>
  )
}

function loadInitialScrollMemory() {
  try {
    const value = JSON.parse(localStorage.getItem('cam-scroll-memory') || '{}')
    return value && typeof value === 'object' ? value : {}
  } catch {
    return {}
  }
}

function SubjectHeader({ subject, count, onInspector, inspectorOpen }) {
  return (
    <div className="subject-header">
      <div className="subject-title-row">
        <div>
          <p className="subject-epithet">{subject.epithet}</p>
          <h3>{subject.name}<em>· {count} 件</em></h3>
        </div>
        <button className={inspectorOpen ? 'inspector-btn active' : 'inspector-btn'} onClick={onInspector}>
          <GitFork size={14} /> 分类关系
        </button>
      </div>
      <p className="subject-intro">{subject.intro}</p>
      <ul className="viewing-list">
        {subject.viewing.map((point) => (
          <li key={point.label}><b>{point.label}</b><span>{point.text}</span></li>
        ))}
      </ul>
      <p className="subject-guide"><BookOpenText size={13} />{subject.guide}</p>
    </div>
  )
}

function SubjectLayout({ subject, artworks, onOpen, scrollerRef }) {
  // 空分类：画科入口保留，给出编目中状态而不是渲染一个空列表。
  if (artworks.length === 0) {
    return (
      <EmptyState
        icon={Boxes}
        title={`「${subject.name}」暂无在展作品`}
        actions={<span className="empty-note">{subject.emptyNote ?? '藏品编目整理中。'}</span>}
      >
        <p>空分类不会被隐藏：它仍是完整分类法的一部分，数据回补后此页自动出现作品。</p>
      </EmptyState>
    )
  }
  switch (subject.layout) {
    case 'handscroll':
      return <FigureHandscroll artworks={artworks} onOpen={onOpen} scrollerRef={scrollerRef} />
    case 'hanging':
      return <LandscapeHanging artworks={artworks} onOpen={onOpen} />
    case 'album':
      return <FlowerbirdAlbum artworks={artworks} onOpen={onOpen} />
    case 'ruler':
      return <JiehuaRuler artworks={artworks} onOpen={onOpen} scrollerRef={scrollerRef} />
    default:
      return <FlowerbirdAlbum artworks={artworks} onOpen={onOpen} />
  }
}

/** 搜索结果：不属于任何一种分科观法，使用中性网格（不污染画科布局与滚动记忆）。 */
function SearchGrid({ query, results, onOpen, subjectsList, onJumpSubject }) {
  return (
    <div className="search-results">
      <p className="search-results-head">全库检索 <b>“{query}”</b> · {results.length} 条结果（检索命中题材、构图、表现对象等字段）</p>
      {results.length === 0 ? (
        <EmptyState icon={SearchX} title="没有找到匹配的作品" actions={null}>
          <p>试试更短的关键词，或清空搜索回到画科观法；之前的浏览位置会被保留。</p>
        </EmptyState>
      ) : (
        <div className="search-grid">
          {results.map((artwork) => (
            <article key={artwork.id} className="search-card">
              <button className="search-image-btn" onClick={() => onOpen(artwork)} aria-label={`查看${artwork.title}`}>
                <LazyPainting artwork={artwork} ratio="4 / 3" />
                <MultiSubjectBadge artwork={artwork} subjects={subjectsList} onJump={onJumpSubject} />
              </button>
              <div className="search-card-body">
                <div className="card-meta">
                  <span>{artwork.dynasty ?? <MissingText>年代不详</MissingText>}</span>
                  <span>{artwork.domain}</span>
                </div>
                <h3>{artwork.title}</h3>
                <p>{artwork.artist ?? <MissingText>佚名</MissingText>} · {artwork.medium}</p>
                {(artwork.subjectIds ?? []).length > 0 ? (
                  <div className="search-subject-line">
                    {artwork.subjectIds.map((id) => (
                      <button key={id} onClick={() => onJumpSubject(id)}>{getSubject(id)?.name ?? id}</button>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

/** 分类关系检查器：把“ID 关联、反向索引、多重归类、悬空引用”可视化出来。 */
function TaxonomyInspector({ taxonomy, artworkById, onJumpSubject, relationWarns }) {
  return (
    <div className="taxonomy-inspector">
      <div className="inspector-summary">
        <span><b>{taxonomy.totalArtworks}</b> 件作品（单一数据源）</span>
        <span><b>{taxonomy.multiClassified.length}</b> 件兼属多科（零复制，仅多 ID 关联）</span>
        <span><b>{taxonomy.warnings.length}</b> 条数据告警</span>
      </div>
      <div className="inspector-grid">
        {subjects.map((subject) => {
          const ids = taxonomy.idsBySubject.get(subject.id) ?? []
          return (
            <div key={subject.id} className="inspector-col">
              <button className="inspector-col-head" onClick={() => onJumpSubject(subject.id)}>
                {subject.name}<em>{ids.length}</em>
              </button>
              <ul>
                {ids.length === 0 ? <li className="inspector-empty">（空 · 无 ID 指向此分类）</li> : null}
                {ids.map((id) => {
                  const art = artworkById.get(id)
                  return (
                    <li key={id} className={art ? '' : 'broken-ref'}>
                      {art ? art.title : <><MissingText>悬空 ID：{id}</MissingText></>}
                      {art && art.subjectIds.length > 1 ? <i> ×{art.subjectIds.length}科</i> : null}
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
      {taxonomy.multiClassified.length ? (
        <div className="inspector-multi">
          <p><GitFork size={12} /> 多重归类（作品只存一份，分类各持 ID）：</p>
          {taxonomy.multiClassified.map((item) => (
            <span key={item.artworkId} className="multi-chain">
              {artworkById.get(item.artworkId)?.title ?? item.artworkId}
              {item.subjectIds.map((id, i) => (
                <React.Fragment key={id}>{i === 0 ? ' — ' : ' + '}<button onClick={() => onJumpSubject(id)}>{getSubject(id)?.name ?? id}</button></React.Fragment>
              ))}
            </span>
          ))}
        </div>
      ) : null}
      {relationWarns.length ? (
        <p className="inspector-warn"><AlertTriangle size={12} /> 检测到 {relationWarns.length} 条指向未知分类的引用，已在构建索引时跳过。</p>
      ) : null}
    </div>
  )
}
