import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowUpRight, Bookmark, ChevronDown, Menu, Search, X } from 'lucide-react'
import { artworks as localArtworks, eras as localEras, getFeatured, getArtworks as queryLocal } from './data/museumData'
import { buildTaxonomy, subjects } from './data/taxonomy'
import { getArtworks, getEras, getFeaturedArtwork, getFavorites, getTaxonomy, updateFavorites } from './services/museumApi'
import { getVisitorId, loadFavorites, saveFavorites } from './lib/storage'
import TaxonomySection from './components/TaxonomySection'
import ArtworkDrawer from './components/ArtworkDrawer'
import { LazyPainting, MissingText } from './components/common'
import './styles.css'

function Header({ query, setQuery }) {
  const [open, setOpen] = useState(false)
  return <header className="site-header taxonomy-header">
    <div className="header-inner">
      <a className="brand" href="#top" aria-label="回到首页">
        <span className="brand-mark">科</span>
        <span><b>中国画科馆</b><small>TAXONOMY OF PAINTING</small></span>
      </a>
      <nav className={open ? 'main-nav is-open' : 'main-nav'}>
        {subjects.map((subject) => (
          <a key={subject.id} href={`#${subject.id}`} onClick={() => setOpen(false)}>{subject.name}</a>
        ))}
      </nav>
      <div className="header-actions">
        <label className="header-search">
          <Search size={15} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="检索题材、构图、对象…" aria-label="检索作品" />
          {query ? <button className="search-clear" onClick={() => setQuery('')} aria-label="清空检索"><X size={13} /></button> : null}
        </label>
        <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="打开导航">{open ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
    </div>
  </header>
}

function Hero({ featured, onExplore, isFavorite, onFavorite }) {
  return <section className="hero taxonomy-hero" id="top">
    <div className="hero-copy">
      <p className="eyebrow"><span className="eyebrow-line" />画有分科 · 观有各法</p>
      <h1>人物、山水、花鸟、界画，<br /><em>各自一种进入方式。</em></h1>
      <p className="hero-desc">
        分科不是给作品贴死标签：《清明上河图》同时是人物画与界画，《瑞鹤图》既是花鸟也是山水构境。
        这里以独立的分类法通过 ID 关联作品，同一作品只存一份，却能在不同画科中以不同布局被观看。
      </p>
      <button className="primary-btn" onClick={onExplore}>进入画科馆 <ArrowUpRight size={17} /></button>
      <div className="hero-note">
        <span>切换画科会保留浏览位置</span><span>图像懒加载 · 缺项如实标注</span>
      </div>
    </div>
    <div className="hero-visual">
      <div className="hero-image-wrap hero-scroll-frame">
        <LazyPainting artwork={featured} eager ratio="620 / 880" />
        <div className="image-label"><span>本期领读</span><b>{featured.title}</b></div>
        <button className={isFavorite ? 'bookmark-btn active' : 'bookmark-btn'} onClick={onFavorite} aria-label={isFavorite ? '取消收藏' : '收藏作品'}><Bookmark size={18} fill={isFavorite ? 'currentColor' : 'none'} /></button>
      </div>
      <div className="hero-caption">
        <span>{featured.artist ?? <MissingText>佚名</MissingText>} · {featured.title}</span>
        <span>{featured.dynasty ?? <MissingText />}</span>
      </div>
      <div className="hero-aside"><span className="vertical-text">山水 / 青绿 / 可行可望可游可居</span><span className="scroll-mark">向下进入分科 <ChevronDown size={14} /></span></div>
    </div>
  </section>
}

function Timeline({ eras }) {
  return <section className="timeline-section" id="timeline">
    <div className="section-kicker">/ 时代坐标</div>
    <div className="timeline-head">
      <h2>分科之间，<i>还有时间的线索。</i></h2>
      <p>同一画科在不同朝代各有面貌：北宋全景、南宋边角，黄家富贵、崔白野逸。横向移动，比较观看方式的迁移。</p>
    </div>
    <div className="era-list">
      {eras.map((era, index) => <div className="era-item" key={era.label}>
        <div className="era-dot" style={{ backgroundColor: era.color }} />
        <div className="era-index">0{index + 1}</div>
        <h3>{era.label}</h3>
        <span>{era.range}</span>
        <b>{era.count} <small>件藏品</small></b>
      </div>)}
    </div>
  </section>
}

function Footer() {
  return <footer className="site-footer">
    <div className="footer-brand"><span className="brand-mark">科</span><span><b>中国画科馆</b><small>TAXONOMY OF PAINTING</small></span></div>
    <p>分类是关系，不是复制。</p>
    <div className="footer-meta"><span>分类法以 ID 反向索引作品</span><span>© 2026 CAM Digital Archive · 图像为风格化示意</span></div>
  </footer>
}

function subjectFromHash() {
  const id = window.location.hash.replace('#', '')
  return subjects.some((s) => s.id === id) ? id : null
}

function App() {
  const [artworkRows, setArtworkRows] = useState(localArtworks)
  const [eras, setEras] = useState(localEras)
  const [featured, setFeatured] = useState(() => getFeatured())
  const [activeSubjectId, setActiveSubjectId] = useState(() => subjectFromHash() ?? subjects[1].id)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(() => queryLocal({ query: '' }))
  const [selected, setSelected] = useState(null)
  const [favorites, setFavorites] = useState(() => loadFavorites())
  const [statusMessage, setStatusMessage] = useState('')
  const visitorId = useMemo(getVisitorId, [])
  const favoritesReady = useRef(false)

  // 分类索引在任何数据源下都由作品集合动态构建（服务端优先，失败回落本地）。
  const taxonomy = useMemo(() => buildTaxonomy(artworkRows), [artworkRows])

  // 服务端分类法可达性探测：索引完全由本地作品集合构建（单一数据源），
  // 服务不可用时同样工作，仅给出提示。
  useEffect(() => {
    let alive = true
    getTaxonomy()
      .then(() => { if (alive) setStatusMessage('') })
      .catch(() => alive && setStatusMessage('数据服务暂不可用，正在展示本地分类目录。'))
    getFeaturedArtwork().then((item) => alive && setFeatured(item)).catch(() => {})
    getEras().then((list) => alive && setEras(list)).catch(() => {})
    return () => { alive = false }
  }, [])

  // 检索（含服务端兜底），检索态覆盖画科视图但不改动分科状态，清空即回到原处。
  useEffect(() => {
    let alive = true
    getArtworks({ query })
      .then((rows) => { if (alive) setResults(rows) })
      .catch(() => { if (alive) setResults(queryLocal({ query })) })
    return () => { alive = false }
  }, [query])

  useEffect(() => {
    let alive = true
    getFavorites(visitorId)
      .then((remote) => {
        if (!alive || !Array.isArray(remote)) return
        setFavorites((current) => [...new Set([...current, ...remote])])
      })
      .catch(() => setStatusMessage((m) => m || '收藏暂时只保存在本设备。'))
      .finally(() => { favoritesReady.current = true })
    return () => { alive = false }
  }, [visitorId])

  useEffect(() => saveFavorites(favorites), [favorites])
  useEffect(() => {
    if (favoritesReady.current) {
      updateFavorites(visitorId, favorites).catch(() => { /* 已本地保存 */ })
    }
  }, [favorites, visitorId])

  // hash 同步：导航/详情跳科/前进后退。
  useEffect(() => {
    const onHash = () => {
      const id = subjectFromHash()
      if (id) setActiveSubjectId(id)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const changeSubject = (id) => {
    setActiveSubjectId(id)
    if (window.location.hash !== `#${id}`) window.history.pushState(null, '', `#${id}`)
  }

  const toggleFavorite = (id) => setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const scrollToTaxonomy = () => document.getElementById('taxonomy')?.scrollIntoView({ behavior: 'smooth' })

  return <>
    <Header query={query} setQuery={setQuery} />
    <main>
      <Hero
        featured={featured}
        onExplore={scrollToTaxonomy}
        isFavorite={favorites.includes(featured.id)}
        onFavorite={() => toggleFavorite(featured.id)}
      />
      <TaxonomySection
        activeSubjectId={activeSubjectId}
        onSubjectChange={changeSubject}
        artworkRows={artworkRows}
        taxonomy={taxonomy}
        query={query}
        results={results}
        onOpen={setSelected}
        statusMessage={statusMessage}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />
      <Timeline eras={eras} />
    </main>
    <Footer />
    <ArtworkDrawer
      artwork={selected}
      onClose={() => setSelected(null)}
      onJumpSubject={(id) => { setSelected(null); setQuery(''); changeSubject(id) }}
      isFavorite={selected ? favorites.includes(selected.id) : false}
      onToggleFavorite={toggleFavorite}
    />
  </>
}

createRoot(document.getElementById('root')).render(<App />)
