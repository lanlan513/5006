import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowDown, ArrowLeft, ArrowUpRight, ChevronRight, Clock3, Compass, Hammer, History, Layers, Library, Menu, Package, ScrollText, X } from 'lucide-react'
import {
  NODE_TYPES,
  NODE_TYPE_LABELS,
  graphStats,
  listMaterials,
  getMaterial,
  getCraft,
  getWork,
  getEra,
  getCraftsOfMaterial,
  getWorksOfMaterial,
  getErasOfMaterial,
  getMaterialsOfCraft,
  getWorksOfCraft,
  getMaterialsOfWork,
  getCraftsOfWork,
  getEraOfWork,
  getWorksOfEra,
  getCraftsOfEra,
  getWorkAccent,
  resolveNode
} from './data/materialGraph'
import { loadMaterialTrail, saveMaterialTrail, loadMaterialHistory, saveMaterialHistory } from './lib/storage'
import './styles.css'
import './materials.css'

// ---- 路径（trail）与地址栏哈希的同步 -----------------------------------------
// 路径格式：#/material/clay/craft/blue-white/work/blue-white-vase
// 前进时 pushState，回退时监听 popstate 还原，刷新与分享链接都不会丢失位置。

function nodeKey(node) {
  return `${node.type}:${node.id}`
}

function trailToHash(trail) {
  return `#/${trail.map((node) => `${node.type}/${encodeURIComponent(node.id)}`).join('/')}`
}

function parseTrailHash(hash) {
  const clean = (hash || '').replace(/^#\/?/, '')
  if (!clean) return []
  const parts = clean.split('/')
  const trail = []
  for (let index = 0; index + 1 < parts.length; index += 2) {
    const node = { type: parts[index], id: decodeURIComponent(parts[index + 1] || '') }
    if (!NODE_TYPES.includes(node.type) || !resolveNode(node)) break
    trail.push(node)
  }
  return trail
}

function sanitizeTrail(trail) {
  return Array.isArray(trail) ? trail.filter((node) => node && resolveNode(node)) : []
}

// ---- 探索器状态：当前路径 + 浏览历史 ------------------------------------------

const HISTORY_LIMIT = 40

function useExplorer() {
  const [trail, setTrail] = useState(() => {
    const fromHash = parseTrailHash(window.location.hash)
    return fromHash.length ? fromHash : sanitizeTrail(loadMaterialTrail())
  })
  const [historyLog, setHistoryLog] = useState(() =>
    loadMaterialHistory().filter((entry) => entry && typeof entry.key === 'string' && sanitizeTrail(entry.trail).length)
  )
  const trailRef = useRef(trail)

  // 所有路径变更的唯一入口：更新状态、持久化、记录历史、同步浏览器历史
  const commit = useCallback((nextTrail, { syncBrowser = true } = {}) => {
    const cleanTrail = sanitizeTrail(nextTrail)
    trailRef.current = cleanTrail
    setTrail(cleanTrail)
    saveMaterialTrail(cleanTrail)
    const top = cleanTrail[cleanTrail.length - 1]
    if (top) {
      const resolved = resolveNode(top)
      const key = nodeKey(top)
      setHistoryLog((previous) => {
        if (previous[0]?.key === key) return previous
        const entry = { key, type: top.type, id: top.id, label: resolved.label, trail: cleanTrail, time: Date.now() }
        const next = [entry, ...previous].slice(0, HISTORY_LIMIT)
        saveMaterialHistory(next)
        return next
      })
    }
    if (syncBrowser) {
      const url = cleanTrail.length ? trailToHash(cleanTrail) : window.location.pathname
      window.history.pushState({ trail: cleanTrail }, '', url)
    }
  }, [])

  useEffect(() => {
    // 让地址栏与初始路径（可能来自本地存储）保持一致
    window.history.replaceState(
      { trail: trailRef.current },
      '',
      trailRef.current.length ? trailToHash(trailRef.current) : window.location.pathname
    )
    const handlePopState = (event) => {
      const stateTrail = Array.isArray(event.state?.trail) ? event.state.trail : parseTrailHash(window.location.hash)
      commit(stateTrail, { syncBrowser: false })
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [commit])

  const openNode = useCallback((node) => {
    if (!resolveNode(node)) return
    commit([...trailRef.current, { type: node.type, id: node.id }])
  }, [commit])
  const jumpTo = useCallback((index) => commit(trailRef.current.slice(0, index + 1)), [commit])
  const goBack = useCallback(() => commit(trailRef.current.slice(0, -1)), [commit])
  const resetTrail = useCallback(() => commit([]), [commit])
  const restoreTrail = useCallback((savedTrail) => commit(savedTrail), [commit])
  const clearHistory = useCallback(() => {
    setHistoryLog([])
    saveMaterialHistory([])
  }, [])

  return { trail, historyLog, openNode, jumpTo, goBack, resetTrail, restoreTrail, clearHistory }
}

// ---- 页头 / 页尾 ---------------------------------------------------------------

function Header() {
  const [open, setOpen] = useState(false)
  return <header className="site-header">
    <div className="header-inner">
      <a className="brand" href="/" aria-label="返回研究馆首页">
        <span className="brand-mark">研</span>
        <span><b>中国美术</b><small>数字研究馆</small></span>
      </a>
      <nav className={open ? 'main-nav is-open' : 'main-nav'}>
        <a href="/#collection">藏品研究</a>
        <a href="/#timeline">时间与风格</a>
        <a href="/materials.html" className="is-here" aria-current="page">材料探索</a>
      </nav>
      <div className="header-actions">
        <a className="collection-link" href="/"><Library size={17} />返回研究馆</a>
        <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="打开导航">{open ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
    </div>
  </header>
}

function Footer() {
  return <footer className="site-footer">
    <div className="footer-brand"><span className="brand-mark">研</span><span><b>中国美术</b><small>数字研究馆</small></span></div>
    <p>把观看变成一条可以回来的路。</p>
    <div className="footer-meta"><span>© 2024 CAM Digital Archive</span><span>材料研究 / 从材料到器物</span></div>
  </footer>
}

// ---- Hero + 示例路径 -------------------------------------------------------------

const SAMPLE_CHAIN = [
  { type: 'material', id: 'clay' },
  { type: 'craft', id: 'blue-white' },
  { type: 'work', id: 'blue-white-vase' },
  { type: 'era', id: 'ming' }
]

function Hero({ onStart, onPreview }) {
  return <section className="mx-hero">
    <div>
      <p className="eyebrow"><span className="eyebrow-line" />工艺美术 / 材料研究</p>
      <h1>从材料，<br /><em>到器物。</em></h1>
      <p className="mx-hero-desc">陶土、玉石、木材、漆、金属、丝织物——每一种材料都通向一组工艺、一批器物和一段历史。沿着「材料 → 工艺 → 器物 → 历史时期」不断深入，也可以随时折返。</p>
      <button className="primary-btn" onClick={onStart}>选择一种材料 <ArrowUpRight size={17} /></button>
      <div className="mx-hero-stats">
        <span><b>{graphStats.materials}</b>种材料</span>
        <span><b>{graphStats.crafts}</b>项工艺</span>
        <span><b>{graphStats.works}</b>件器物</span>
        <span><b>{graphStats.eras}</b>个时期</span>
        <span><b>{graphStats.relations}</b>条关联</span>
      </div>
    </div>
    <div className="mx-chain" aria-label="示例路径">
      <div className="mx-chain-title"><span>一条可能的路径</span><span>点击任意节点直接进入</span></div>
      {SAMPLE_CHAIN.map((node, index) => {
        const resolved = resolveNode(node)
        return <Fragment key={nodeKey(node)}>
          {index > 0 && <span className="mx-chain-arrow" aria-hidden="true"><ArrowDown size={13} /></span>}
          <button className="mx-chain-step" onClick={() => onPreview(SAMPLE_CHAIN.slice(0, index + 1))}>
            <span className="mx-chain-num">{String(index + 1).padStart(2, '0')}</span>
            <span className="mx-chain-body">
              <small>{NODE_TYPE_LABELS[node.type]}</small>
              <b>{resolved.label}</b>
            </span>
            <ArrowUpRight size={14} className="mx-chain-go" />
          </button>
        </Fragment>
      })}
    </div>
  </section>
}

// ---- 面包屑工具条 ------------------------------------------------------------------

function ExplorerToolbar({ trail, onBack, onJump, onReset }) {
  return <div className="mx-toolbar">
    <button className="mx-back" onClick={onBack} disabled={!trail.length}>
      <ArrowLeft size={14} />返回上一级
    </button>
    <nav className="mx-crumbs" aria-label="浏览路径">
      <button className={trail.length ? 'mx-crumb' : 'mx-crumb current'} onClick={onReset}>材料索引</button>
      {trail.map((node, index) => {
        const resolved = resolveNode(node)
        if (!resolved) return null
        const isLast = index === trail.length - 1
        return <Fragment key={`${nodeKey(node)}:${index}`}>
          <ChevronRight size={13} className="mx-crumb-sep" aria-hidden="true" />
          <button className={isLast ? 'mx-crumb current' : 'mx-crumb'} onClick={() => onJump(index)} aria-current={isLast ? 'page' : undefined}>
            <span className="mx-crumb-type">{NODE_TYPE_LABELS[node.type]}</span>
            {resolved.label}
          </button>
        </Fragment>
      })}
    </nav>
  </div>
}

// ---- 侧栏：探索模型 + 浏览历史 --------------------------------------------------------

const MODEL_STEPS = [
  { type: 'material', label: '材料', desc: '从物质属性出发' },
  { type: 'craft', label: '工艺', desc: '看手如何改变材料' },
  { type: 'work', label: '器物', desc: '落到一件具体作品' },
  { type: 'era', label: '历史时期', desc: '放回时间的坐标' }
]

function PathModel({ currentType }) {
  return <section className="mx-model" aria-label="探索模型">
    <h3><Compass size={14} />探索模型</h3>
    {MODEL_STEPS.map((step, index) => (
      <div key={step.type} className={currentType === step.type ? 'mx-model-step active' : 'mx-model-step'}>
        <span className="mx-model-dot">{index + 1}</span>
        <div><b>{step.label}</b><small>{step.desc}</small></div>
      </div>
    ))}
    <p className="mx-model-note">{currentType ? `当前位于「${NODE_TYPE_LABELS[currentType]}」节点` : '当前位于材料索引'}</p>
  </section>
}

function formatTime(time) {
  try {
    return new Date(time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function HistoryPanel({ entries, onRestore, onClear }) {
  return <section className="mx-history" aria-label="浏览历史">
    <div className="mx-history-head">
      <h3><History size={14} />浏览历史</h3>
      {entries.length > 0 && <button className="mx-history-clear" onClick={onClear}>清空</button>}
    </div>
    {entries.length ? <ol>
      {entries.map((entry) => (
        <li key={`${entry.key}-${entry.time}`}>
          <button className="mx-history-item" onClick={() => onRestore(entry.trail)} title="回到当时的位置与路径">
            <span className={`mx-tag mx-tag-${entry.type}`}>{NODE_TYPE_LABELS[entry.type]}</span>
            <b>{entry.label}</b>
            <time>{formatTime(entry.time)}</time>
          </button>
        </li>
      ))}
    </ol> : <p className="mx-history-empty">尚未留下足迹。从一种材料开始，你走过的路径会记录在这里，随时可以原路返回。</p>}
  </section>
}

// ---- 共享小组件 -----------------------------------------------------------------------

function Section({ title, icon: Icon, hint, children }) {
  return <section className="mx-section">
    <div className="mx-section-head">
      <h3>{Icon ? <Icon size={16} /> : null}{title}</h3>
      {hint ? <span>{hint}</span> : null}
    </div>
    {children}
  </section>
}

function MaterialChip({ material, role, onOpen }) {
  return <button className="mx-chip" onClick={() => onOpen({ type: 'material', id: material.id })}>
    <i className="mx-chip-dot" style={{ background: material.accent }} aria-hidden="true" />
    {material.name}
    {role ? <small>{role}</small> : null}
  </button>
}

function EraChip({ era, onOpen }) {
  return <button className="mx-chip" onClick={() => onOpen({ type: 'era', id: era.id })}>
    {era.label}<small>{era.range}</small>
  </button>
}

function CraftCard({ craft, note, onOpen }) {
  const worksCount = getWorksOfCraft(craft.id).length
  return <button className="mx-craft-card" onClick={() => onOpen({ type: 'craft', id: craft.id })}>
    <b>{craft.name}<ArrowUpRight size={14} /></b>
    <p>{craft.summary}</p>
    {note ? <p className="mx-craft-note">{note}</p> : null}
    <span className="mx-craft-meta">{worksCount} 件代表器物</span>
  </button>
}

function WorkCard({ work, role, onOpen }) {
  const era = getEraOfWork(work.id)
  const workMaterials = getMaterialsOfWork(work.id)
  return <button className="mx-work-card" onClick={() => onOpen({ type: 'work', id: work.id })}>
    <span className="mx-mono" style={{ '--accent': getWorkAccent(work.id) }} aria-hidden="true">{work.title.charAt(0)}</span>
    <span className="mx-work-body">
      <span className="mx-work-meta">{era ? `${era.label} · ` : ''}{work.maker}{role ? ` · ${role}` : ''}</span>
      <b>{work.title}</b>
      <span className="mx-work-mats">{workMaterials.map(({ material }) => material.name).join(' × ')}</span>
    </span>
    <ArrowUpRight size={15} className="mx-work-go" />
  </button>
}

// ---- 视图：材料索引 ---------------------------------------------------------------------

function MaterialIndex({ onOpen }) {
  return <div className="mx-view">
    <div className="mx-view-head">
      <span className="mx-kicker">/ 材料索引</span>
      <h2>从一种材料，<br /><i>开始这次探索。</i></h2>
      <p>六种基础材料构成中国工艺美术的物质起点。选择其一，沿着工艺与器物不断深入；一件器物可能同时属于多种材料，路径因此彼此交织。</p>
    </div>
    <div className="mx-material-grid">
      {listMaterials().map((material) => {
        const craftCount = getCraftsOfMaterial(material.id).length
        const workCount = getWorksOfMaterial(material.id).length
        return <button key={material.id} className="mx-material-card" onClick={() => onOpen({ type: 'material', id: material.id })}>
          <span className="mx-char" style={{ '--accent': material.accent }} aria-hidden="true">{material.char}</span>
          <span className="mx-material-card-body">
            <b>{material.name}</b>
            <span className="mx-material-summary">{material.summary}</span>
            <span className="mx-material-meta">{craftCount} 项工艺 · {workCount} 件器物<ArrowUpRight size={13} /></span>
          </span>
        </button>
      })}
    </div>
  </div>
}

// ---- 视图：材料详情 ---------------------------------------------------------------------

function MaterialView({ material, onOpen }) {
  const craftEntries = getCraftsOfMaterial(material.id)
  const workEntries = getWorksOfMaterial(material.id)
  const materialEras = getErasOfMaterial(material.id)
  return <div className="mx-view">
    <header className="mx-detail-head">
      <span className="mx-char mx-char-large" style={{ '--accent': material.accent }} aria-hidden="true">{material.char}</span>
      <div className="mx-detail-head-body">
        <span className="mx-kicker">/ 材料 · Material</span>
        <h2>{material.name}</h2>
        <p>{material.summary}</p>
        <div className="mx-stat-chips">
          <span>{craftEntries.length} 项典型工艺</span>
          <span>{workEntries.length} 件代表器物</span>
          <span>跨越 {materialEras.length} 个时期</span>
        </div>
      </div>
    </header>
    <Section title="材料特性" icon={Layers}>
      <div className="mx-props">
        {material.properties.map((prop) => <div className="mx-prop" key={prop.name}><b>{prop.name}</b><p>{prop.text}</p></div>)}
      </div>
    </Section>
    <Section title="加工方式" icon={Hammer} hint="从原料到可加工的半成品">
      <div className="mx-steps">
        {material.processing.map((step) => <div className="mx-step" key={step.name}><b>{step.name}</b><p>{step.text}</p></div>)}
      </div>
    </Section>
    <Section title="典型工艺" icon={Compass} hint="选择一项工艺继续深入">
      <div className="mx-craft-list">
        {craftEntries.map(({ craft, note }) => <CraftCard key={craft.id} craft={craft} note={note} onOpen={onOpen} />)}
      </div>
    </Section>
    <Section title="代表作品" icon={Package} hint="点击进入器物详情">
      <div className="mx-work-list">
        {workEntries.map(({ work, role }) => <WorkCard key={work.id} work={work} role={role} onOpen={onOpen} />)}
      </div>
    </Section>
    <Section title="相关时期" icon={Clock3}>
      <div className="mx-chips">
        {materialEras.map((era) => <EraChip key={era.id} era={era} onOpen={onOpen} />)}
      </div>
    </Section>
  </div>
}

// ---- 视图：工艺详情 ---------------------------------------------------------------------

function CraftView({ craft, onOpen }) {
  const materialEntries = getMaterialsOfCraft(craft.id)
  const craftWorks = getWorksOfCraft(craft.id)
  return <div className="mx-view">
    <header className="mx-detail-head">
      <div className="mx-detail-head-body">
        <span className="mx-kicker">/ 工艺 · Craft</span>
        <h2>{craft.name}</h2>
        <p>{craft.summary}</p>
        <div className="mx-stat-chips">
          <span>{materialEntries.length} 种关联材料</span>
          <span>{craftWorks.length} 件代表器物</span>
        </div>
      </div>
    </header>
    <Section title="涉及材料" icon={Layers} hint="一种工艺可处理多种材料">
      <div className="mx-chips">
        {materialEntries.map(({ material }) => <MaterialChip key={material.id} material={material} onOpen={onOpen} />)}
      </div>
    </Section>
    <Section title="工艺流程" icon={Hammer}>
      <div className="mx-steps">
        {craft.process.map((step) => <div className="mx-step" key={step}><b>{step}</b></div>)}
      </div>
    </Section>
    <Section title="代表器物" icon={Package} hint="继续深入，看看工艺落在何处">
      <div className="mx-work-list">
        {craftWorks.map((work) => <WorkCard key={work.id} work={work} onOpen={onOpen} />)}
      </div>
    </Section>
  </div>
}

// ---- 视图：器物详情 ---------------------------------------------------------------------

function WorkView({ work, onOpen }) {
  const era = getEraOfWork(work.id)
  const materialEntries = getMaterialsOfWork(work.id)
  const workCrafts = getCraftsOfWork(work.id)
  const siblings = era ? getWorksOfEra(era.id).filter((item) => item.id !== work.id) : []
  return <div className="mx-view">
    <header className="mx-detail-head">
      <span className="mx-char mx-char-large" style={{ '--accent': getWorkAccent(work.id) }} aria-hidden="true">{work.title.charAt(0)}</span>
      <div className="mx-detail-head-body">
        <span className="mx-kicker">/ 器物 · Object</span>
        <h2>{work.title}</h2>
        <p className="mx-work-sub">{work.maker}{era ? ` · ${era.label}（${era.range}）` : ''} · {work.location}</p>
        <p>{work.summary}</p>
      </div>
    </header>
    <Section title="器物档案" icon={ScrollText}>
      <p className="mx-detail-text">{work.detail}</p>
    </Section>
    <Section title="材料构成" icon={Layers} hint="一件器物可以包含多种材料">
      <div className="mx-chips">
        {materialEntries.map(({ material, role }) => <MaterialChip key={material.id} material={material} role={role} onOpen={onOpen} />)}
      </div>
    </Section>
    <Section title="涉及工艺" icon={Hammer}>
      <div className="mx-craft-list">
        {workCrafts.map((craft) => <CraftCard key={craft.id} craft={craft} onOpen={onOpen} />)}
      </div>
    </Section>
    {era ? <Section title="所属时期" icon={Clock3} hint="把器物放回时间坐标">
      <button className="mx-era-card" onClick={() => onOpen({ type: 'era', id: era.id })}>
        <span>
          <b>{era.label}</b>
          <small>{era.range}</small>
          <p>{era.summary}</p>
        </span>
        <ArrowUpRight size={16} />
      </button>
    </Section> : null}
    {siblings.length ? <Section title="同时期器物" hint="横向看看同一时代的其他作品">
      <div className="mx-work-list">
        {siblings.map((item) => <WorkCard key={item.id} work={item} onOpen={onOpen} />)}
      </div>
    </Section> : null}
  </div>
}

// ---- 视图：历史时期详情 -------------------------------------------------------------------

function EraView({ era, onOpen }) {
  const eraWorks = getWorksOfEra(era.id)
  const eraCrafts = getCraftsOfEra(era.id)
  return <div className="mx-view">
    <header className="mx-detail-head">
      <div className="mx-detail-head-body">
        <span className="mx-kicker">/ 历史时期 · Era</span>
        <h2>{era.label}</h2>
        <p className="mx-work-sub">{era.range}</p>
        <p>{era.summary}</p>
        <div className="mx-stat-chips">
          <span>{eraWorks.length} 件器物</span>
          <span>{eraCrafts.length} 项活跃工艺</span>
        </div>
      </div>
    </header>
    <Section title="本期器物" icon={Package}>
      <div className="mx-work-list">
        {eraWorks.map((work) => <WorkCard key={work.id} work={work} onOpen={onOpen} />)}
      </div>
    </Section>
    <Section title="活跃工艺" icon={Hammer} hint="经由本期器物推导">
      <div className="mx-craft-list">
        {eraCrafts.map((craft) => <CraftCard key={craft.id} craft={craft} onOpen={onOpen} />)}
      </div>
    </Section>
  </div>
}

// ---- 应用 ---------------------------------------------------------------------------------

function App() {
  const { trail, historyLog, openNode, jumpTo, goBack, resetTrail, restoreTrail, clearHistory } = useExplorer()
  const explorerRef = useRef(null)
  const isFirstTrail = useRef(true)

  // 路径变化后把工具条滚回视野，帮助用户重新定位
  useEffect(() => {
    if (isFirstTrail.current) {
      isFirstTrail.current = false
      return
    }
    explorerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [trail])

  const top = trail[trail.length - 1]
  const topNode = top ? resolveNode(top) : null

  let currentView
  if (!topNode) currentView = <MaterialIndex onOpen={openNode} />
  else if (topNode.type === 'material') currentView = <MaterialView material={getMaterial(topNode.id)} onOpen={openNode} />
  else if (topNode.type === 'craft') currentView = <CraftView craft={getCraft(topNode.id)} onOpen={openNode} />
  else if (topNode.type === 'work') currentView = <WorkView work={getWork(topNode.id)} onOpen={openNode} />
  else currentView = <EraView era={getEra(topNode.id)} onOpen={openNode} />

  return <>
    <Header />
    <main>
      <Hero onStart={() => explorerRef.current?.scrollIntoView({ behavior: 'smooth' })} onPreview={restoreTrail} />
      <section className="mx-explorer" ref={explorerRef}>
        <div className="mx-explorer-main">
          <ExplorerToolbar trail={trail} onBack={goBack} onJump={jumpTo} onReset={resetTrail} />
          {currentView}
        </div>
        <aside className="mx-rail">
          <PathModel currentType={topNode?.type} />
          <HistoryPanel entries={historyLog} onRestore={restoreTrail} onClear={clearHistory} />
        </aside>
      </section>
    </main>
    <Footer />
  </>
}

createRoot(document.getElementById('root')).render(<App />)
