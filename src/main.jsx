import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowUpRight, Bookmark, ChevronDown, Compass, Eye, Library, Menu, Mountain, Search, Sparkles, X } from 'lucide-react'
import { domains as fallbackDomains, eras as fallbackEras, getArtworks as getLocalArtworks, getFeatured as getLocalFeatured } from './data/museumData'
import { getDomains, getEras, getArtworks, getFeaturedArtwork, getFavorites, updateFavorites } from './services/museumApi'
import { getVisitorId, loadFavorites, loadViewState, saveFavorites, saveViewState } from './lib/storage'
import './styles.css'

// 三维山水模块体积较大（含 Three.js），滚动到该区块时才加载
const LandscapeStudio = lazy(() => import('./features/landscape/LandscapeStudio'))

function ImageWithFallback({ src, alt, className, ...props }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <div className={`${className} image-fallback`} role="img" aria-label={alt}><span>图像暂时不可用</span></div>
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} {...props} />
}

function Header({ onSearch, searchValue, setSearchValue }) {
  const [open, setOpen] = useState(false)
  return <header className="site-header">
    <div className="header-inner">
      <a className="brand" href="#top" aria-label="回到首页">
        <span className="brand-mark">研</span>
        <span><b>中国美术</b><small>数字研究馆</small></span>
      </a>
      <nav className={open ? 'main-nav is-open' : 'main-nav'}>
        <a href="#collection">藏品研究</a>
        <a href="#space">山水空间</a>
        <a href="#timeline">时间与风格</a>
        <a href="#method">观看方法</a>
      </nav>
      <div className="header-actions">
        <label className="header-search">
          <Search size={16} />
          <input value={searchValue} onChange={(e) => { setSearchValue(e.target.value); onSearch(e.target.value) }} placeholder="搜索作品、艺术家" aria-label="搜索作品、艺术家" />
        </label>
        <a className="collection-link" href="#collection"><Library size={17} />我的研究</a>
        <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="打开导航">{open ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
    </div>
  </header>
}

function Hero({ onExplore, featured, isFavorite, onFavorite }) {
  return <section className="hero" id="top">
    <div className="hero-copy">
      <p className="eyebrow"><span className="eyebrow-line" />数字研究馆 / 2024—</p>
      <h1>让中国艺术，<br /><em>成为可被研究的现场。</em></h1>
      <p className="hero-desc">从一件作品出发，进入它的时代、材料与观看方式。我们把分散的艺术经验，整理成可以反复抵达的研究路径。</p>
      <button className="primary-btn" onClick={onExplore}>开始探索 <ArrowUpRight size={17} /></button>
      <div className="hero-note"><span>01</span><span>从作品开始，而不是从结论开始</span></div>
    </div>
    <div className="hero-visual">
      <div className="hero-image-wrap">
        <ImageWithFallback src={featured.image} alt={featured.title} className="hero-image" />
        <div className="image-label"><span>正在观看</span><b>01 / 06</b></div>
        <button className={isFavorite ? 'bookmark-btn active' : 'bookmark-btn'} onClick={onFavorite} aria-label={isFavorite ? '取消收藏' : '收藏作品'}><Bookmark size={18} fill={isFavorite ? 'currentColor' : 'none'} /></button>
      </div>
      <div className="hero-caption"><span>{featured.artist} · {featured.title}</span><span>{featured.year}</span></div>
      <div className="hero-aside"><span className="vertical-text">山水 / 文人 / 时间的留白</span><span className="scroll-mark">向下探索 <ChevronDown size={14} /></span></div>
    </div>
  </section>
}

function ResearchIntro() {
  return <section className="research-intro" id="method">
    <div className="section-kicker">/ 研究方式</div>
    <div className="intro-content">
      <h2>一件作品，<br /><span>不止一种进入方式。</span></h2>
      <div className="intro-side"><p>我们不急着为作品盖棺定论。沿着时间、技法与审美的线索，建立属于你的观看顺序。</p><a href="#collection">查看研究路径 <ArrowUpRight size={15} /></a></div>
    </div>
    <div className="method-strip">
      <div><span className="method-num">01</span><Compass size={22} /><b>看见</b><p>从细节、尺度和材料开始观察</p></div>
      <div><span className="method-num">02</span><Sparkles size={22} /><b>连结</b><p>发现作品与时代之间的暗线</p></div>
      <div><span className="method-num">03</span><Eye size={22} /><b>重访</b><p>保存你的观看，随时再次抵达</p></div>
    </div>
  </section>
}

function DomainFilter({ active, domains, onChange }) {
  return <div className="domain-filter" role="tablist" aria-label="艺术门类">
    {domains.map((domain) => <button key={domain} className={active === domain ? 'filter-pill active' : 'filter-pill'} onClick={() => onChange(domain)} role="tab" aria-selected={active === domain}>{domain}</button>)}
  </div>
}

function ArtworkCard({ artwork, onOpen, isFavorite, onFavorite }) {
  return <article className="art-card">
    <button className="card-image-btn" onClick={() => onOpen(artwork)} aria-label={`查看${artwork.title}`}>
      <ImageWithFallback src={artwork.image} alt={artwork.title} className="card-image" />
      <span className="card-overlay"><ArrowUpRight size={19} /></span>
    </button>
    <div className="card-body">
      <div className="card-meta"><span>{artwork.domain}</span><span>{artwork.year}</span></div>
      <h3>{artwork.title}</h3><p>{artwork.artist} · {artwork.medium}</p>
      <div className="card-foot"><button onClick={() => onOpen(artwork)}>进入作品 <ArrowUpRight size={14} /></button><button className={isFavorite ? 'mini-bookmark active' : 'mini-bookmark'} onClick={() => onFavorite(artwork.id)} aria-label={isFavorite ? '取消收藏' : '收藏作品'}><Bookmark size={16} fill={isFavorite ? 'currentColor' : 'none'} /></button></div>
    </div>
  </article>
}

function Collection({ activeDomain, setActiveDomain, domains, results, searchValue, onOpen, favorites, onFavorite, isLoading, statusMessage }) {
  return <section className="collection-section" id="collection">
    <div className="section-heading"><div><div className="section-kicker">/ 作品索引</div><h2>从一件作品，<br /><i>展开整个语境。</i></h2></div><div className="section-count"><b>{String(results.length).padStart(2, '0')}</b><span>件精选作品<br />正在展出</span></div></div>
    <div className="collection-toolbar"><DomainFilter active={activeDomain} domains={domains} onChange={setActiveDomain} /><span className="toolbar-note">{isLoading ? '正在更新作品索引…' : statusMessage || (searchValue ? `正在检索 “${searchValue}”` : '按门类进入')}</span></div>
    {results.length ? <div className="art-grid">{results.map((artwork) => <ArtworkCard key={artwork.id} artwork={artwork} onOpen={onOpen} isFavorite={favorites.includes(artwork.id)} onFavorite={onFavorite} />)}</div> : <div className="empty-state"><Search size={22} /><h3>{isLoading ? '正在打开作品索引' : '没有找到匹配的作品'}</h3><p>{isLoading ? '正在从研究馆数据服务读取内容。' : '试试搜索艺术家、材料，或切换一个门类。'}</p></div>}
  </section>
}

function Timeline({ eras }) {
  return <section className="timeline-section" id="timeline"><div className="section-kicker">/ 时间轴</div><div className="timeline-head"><h2>风格从时间里<br /><i>慢慢长出来。</i></h2><p>把朝代当作坐标，而不是答案。横向移动，看看材料、观看与信仰如何彼此影响。</p></div><div className="era-list">{eras.map((era, index) => <div className="era-item" key={era.label}><div className="era-dot" style={{ backgroundColor: era.color }} /><div className="era-index">0{index + 1}</div><h3>{era.label}</h3><span>{era.range}</span><b>{era.count} <small>件藏品</small></b></div>)}</div></section>
}

function DetailPanel({ artwork, onClose, isFavorite, onFavorite }) {
  useEffect(() => {
    if (!artwork) return undefined
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [artwork, onClose])
  if (!artwork) return null
  return <div className="detail-backdrop" onClick={onClose}><aside className="detail-panel" onClick={(e) => e.stopPropagation()}><button className="close-panel" onClick={onClose} aria-label="关闭详情"><X size={19} /></button><div className="detail-image"><ImageWithFallback src={artwork.image} alt={artwork.title} className="detail-art-image" /></div><div className="detail-content"><div className="card-meta"><span>{artwork.domain}</span><span>{artwork.year}</span></div><h2>{artwork.title}</h2><p className="detail-artist">{artwork.artist} · {artwork.medium}</p><p className="detail-summary">{artwork.summary}</p><div className="relation-box"><span>研究线索</span><b>{artwork.relation}</b></div><div className="detail-copy"><p>{artwork.detail}</p></div><div className="detail-actions"><button className="primary-btn" onClick={() => onFavorite(artwork.id)}><Bookmark size={16} fill={isFavorite ? 'currentColor' : 'none'} />{isFavorite ? '已收藏' : '收藏作品'}</button><button className="text-btn">查看相似作品 <ArrowUpRight size={15} /></button></div></div></aside></div>
}

function Footer() { return <footer className="site-footer"><div className="footer-brand"><span className="brand-mark">研</span><span><b>中国美术</b><small>数字研究馆</small></span></div><p>把观看变成一条可以回来的路。</p><div className="footer-meta"><span>© 2024 CAM Digital Archive</span><span>开放研究计划 / 第一期</span></div></footer> }

function App() {
  const savedView = loadViewState()
  const initialFavorites = useMemo(loadFavorites, [])
  const visitorId = useMemo(getVisitorId, [])
  const [domains, setDomains] = useState(fallbackDomains)
  const [eras, setEras] = useState(fallbackEras)
  const [featured, setFeatured] = useState(getLocalFeatured)
  const [activeDomain, setActiveDomain] = useState(fallbackDomains.includes(savedView.domain) ? savedView.domain : '全部')
  const [searchValue, setSearchValue] = useState(typeof savedView.query === 'string' ? savedView.query : '')
  const [selected, setSelected] = useState(null)
  const [favorites, setFavorites] = useState(initialFavorites)
  const [results, setResults] = useState(() => getLocalArtworks({ domain: activeDomain, query: searchValue }))
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [favoritesReady, setFavoritesReady] = useState(false)
  const pendingFavoriteChanges = useRef(new Map())

  useEffect(() => {
    let isCurrent = true
    Promise.all([getDomains(), getEras(), getFeaturedArtwork()])
      .then(([apiDomains, apiEras, apiFeatured]) => {
        if (!isCurrent) return
        setDomains(apiDomains)
        setEras(apiEras)
        setFeatured(apiFeatured)
      })
      .catch(() => isCurrent && setStatusMessage('数据服务暂不可用，正在展示本地研究目录。'))
    return () => { isCurrent = false }
  }, [])

  useEffect(() => {
    let isCurrent = true
    setIsLoading(true)
    setStatusMessage('')
    getArtworks({ domain: activeDomain, query: searchValue })
      .then((apiArtworks) => isCurrent && setResults(apiArtworks))
      .catch(() => {
        if (!isCurrent) return
        setResults(getLocalArtworks({ domain: activeDomain, query: searchValue }))
        setStatusMessage('数据服务暂不可用，正在展示本地研究目录。')
      })
      .finally(() => isCurrent && setIsLoading(false))
    return () => { isCurrent = false }
  }, [activeDomain, searchValue])

  useEffect(() => {
    let isCurrent = true
    getFavorites(visitorId)
      .then((remoteFavorites) => {
        if (!isCurrent) return
        if (!Array.isArray(remoteFavorites)) throw new Error('收藏数据格式无效。')
        setFavorites((currentFavorites) => {
          const mergedFavorites = new Set([...currentFavorites, ...remoteFavorites])
          pendingFavoriteChanges.current.forEach((isFavorite, artworkId) => {
            if (isFavorite) mergedFavorites.add(artworkId)
            else mergedFavorites.delete(artworkId)
          })
          pendingFavoriteChanges.current.clear()
          return [...mergedFavorites]
        })
      })
      .catch(() => isCurrent && setStatusMessage('收藏暂时只保存在本设备。'))
      .finally(() => isCurrent && setFavoritesReady(true))
    return () => { isCurrent = false }
  }, [initialFavorites, visitorId])

  useEffect(() => saveFavorites(favorites), [favorites])
  useEffect(() => saveViewState({ domain: activeDomain, query: searchValue }), [activeDomain, searchValue])
  useEffect(() => {
    if (favoritesReady) updateFavorites(visitorId, favorites).catch(() => setStatusMessage('收藏暂时只保存在本设备。'))
  }, [favorites, favoritesReady, visitorId])
  const toggleFavorite = (id) => setFavorites((prev) => {
    const nextFavorites = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    if (!favoritesReady) pendingFavoriteChanges.current.set(id, nextFavorites.includes(id))
    return nextFavorites
  })
  const scrollToCollection = () => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })
  return <><Header onSearch={setSearchValue} searchValue={searchValue} setSearchValue={setSearchValue} /><main><Hero featured={featured} onExplore={scrollToCollection} isFavorite={favorites.includes(featured.id)} onFavorite={() => toggleFavorite(featured.id)} /><ResearchIntro /><Suspense fallback={<section className="space-studio" id="space"><div className="studio-stage"><div className="canvas-frame"><div className="canvas-loading"><Mountain size={22} /><span>正在调入三维山水模块…</span></div></div></div></section>}><LandscapeStudio /></Suspense><Collection activeDomain={activeDomain} setActiveDomain={setActiveDomain} domains={domains} results={results} searchValue={searchValue} onOpen={setSelected} favorites={favorites} onFavorite={toggleFavorite} isLoading={isLoading} statusMessage={statusMessage} /><Timeline eras={eras} /></main><Footer /><DetailPanel artwork={selected} onClose={() => setSelected(null)} isFavorite={selected ? favorites.includes(selected.id) : false} onFavorite={toggleFavorite} /></>
}

createRoot(document.getElementById('root')).render(<App />)
