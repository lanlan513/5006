import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Info,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  X
} from 'lucide-react'
import { SCRIPTS, TRANSITIONS, scriptById, transitionBetween } from './data/scripts'
import { ENTRIES } from './data/glyphData'
import manifest from './data/fontManifest.json'
import { FONT_DEFS, FONT_IDS, preloadAllFonts, retryFont, useFontStatuses } from './lib/fonts'
import { buildGlyphModel, extractChar, isCJKChar } from './lib/resolve'
import { loadViewState, saveViewState } from './lib/storage'
import './styles.css'

const FALLBACK_STACK = `'Songti SC','STSong','SimSun','Noto Serif SC',serif`
const LAST_SCRIPT_INDEX = SCRIPTS.length - 1
// manifest 在构建期由真实子集字体生成，值为字符串；长度为收字数（均为 BMP 字符）。
const manifestCounts = Object.fromEntries(Object.entries(manifest).map(([id, chars]) => [id, chars.length]))

/* ---------- 字形渲染 ---------- */

function Glyph({ fontId, char, degraded, style, className = '' }) {
  const fontFamily = degraded ? FALLBACK_STACK : `'${FONT_DEFS[fontId].family}',${FALLBACK_STACK}`
  return (
    <span className={`glyph ${className}`} style={{ fontFamily, ...style }} aria-hidden="true">
      {char}
    </span>
  )
}

/** 格子内容：按「数据状态 × 字体状态」渲染 —— 就绪 / 加载中 / 降级 / 缺样 */
function CellContent({ cell, fontStatus, large }) {
  if (cell.state === 'missing') {
    return (
      <span className="cell-missing" role="img" aria-label="缺样">
        <i>缺</i>
        {!large && <em>缺样</em>}
      </span>
    )
  }
  if (fontStatus === 'error') {
    return (
      <span className="cell-degraded">
        <Glyph fontId={scriptById[cell.scriptId].fontId} char={cell.display} degraded />
        <small title="书体字体加载失败，暂以系统字体代替">系统字代替</small>
      </span>
    )
  }
  if (fontStatus !== 'ready') {
    return (
      <span className="cell-pending">
        <Glyph fontId={scriptById[cell.scriptId].fontId} char={cell.display} degraded />
        <small>字体载入中…</small>
      </span>
    )
  }
  return <Glyph fontId={scriptById[cell.scriptId].fontId} char={cell.display} />
}

/* ---------- 页头 ---------- */

function Header({ fontStatuses, onOpenAbout }) {
  const readyCount = FONT_IDS.filter((id) => fontStatuses[id] === 'ready').length
  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="#top" aria-label="字形演变观察器">
          <span className="brand-seal">字</span>
          <span className="brand-text">
            <b>字形演变观察器</b>
            <small>篆 · 隶 · 楷 · 行 · 草</small>
          </span>
        </a>
        <div className="header-side">
          <span className="font-progress" title="书体字体加载进度">
            <Layers size={14} />
            字库 {readyCount}/{FONT_IDS.length}
          </span>
          <button className="about-btn" onClick={onOpenAbout}>
            <Info size={15} />
            原则与字库
          </button>
        </div>
      </div>
    </header>
  )
}

/* ---------- 控制区：输入 + 预设字 + 字体状态 ---------- */

function ControlBar({ inputValue, onInput, onPick, activeChar, curated }) {
  const invalid = inputValue.trim().length > 0 && !extractChar(inputValue)
  return (
    <section className="control-section" id="top">
      <div className="control-head">
        <p className="eyebrow"><span className="eyebrow-line" />同一个字，五种书体</p>
        <h1>
          看一个字，
          <br />
          如何被<em>压缩、改写、重组</em>。
        </h1>
        <p className="control-desc">
          输入或选择一个汉字，沿篆、隶、楷、行、草逐阶段观察它的结构变化。
          没有可靠样本的阶段如实留缺，不作伪补。
        </p>
      </div>

      <div className="control-panel">
        <label className={`char-input ${invalid ? 'invalid' : ''}`}>
          <span className="char-input-label">输入一个汉字</span>
          <input
            value={inputValue}
            onChange={(event) => onInput(event.target.value)}
            placeholder="如：永"
            maxLength={4}
            aria-label="输入一个汉字"
            aria-invalid={invalid}
          />
          {invalid && <span className="input-hint">请输入汉字（CJK 统一表意文字）</span>}
        </label>
        <button className="shuffle-btn" onClick={() => onPick(randomEntryChar())} title="随机换一个字">
          <Shuffle size={15} />
          换一个字
        </button>
      </div>

      <PresetGroups activeChar={activeChar} onPick={onPick} />
      {!curated && (
        <p className="auto-notice">
          <AlertTriangle size={13} />
          「{activeChar}」不在考据库中：以下仅按字库字形渲染，不提供注记；字库未收的书体将显示缺样。
        </p>
      )}
    </section>
  )
}

function randomEntryChar() {
  return ENTRIES[Math.floor(Math.random() * ENTRIES.length)].char
}

function PresetGroups({ activeChar, onPick }) {
  const groups = useMemo(() => {
    const full = []
    const gapped = []
    const crossForm = []
    for (const entry of ENTRIES) {
      const hasMissing = SCRIPTS.some((script) => !entry.forms[script.id] || entry.forms[script.id].missing)
      if (hasMissing) gapped.push(entry)
      else if (entry.alias?.length) crossForm.push(entry)
      else full.push(entry)
    }
    return [
      { label: '五体俱全', entries: full },
      { label: '缺样示例', entries: gapped },
      { label: '繁简更替', entries: crossForm }
    ]
  }, [])
  return (
    <div className="preset-groups">
      {groups.map((group) => (
        <div className="preset-group" key={group.label}>
          <span className="preset-label">{group.label}</span>
          <div className="preset-chips">
            {group.entries.map((entry) => (
              <button
                key={entry.id}
                className={`preset-chip ${activeChar === entry.char ? 'active' : ''}`}
                onClick={() => onPick(entry.char)}
                title={entry.story}
              >
                {entry.char}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function FontStatusBar({ fontStatuses }) {
  return (
    <div className="font-status-bar" aria-live="polite">
      {FONT_IDS.map((id) => {
        const status = fontStatuses[id]
        const def = FONT_DEFS[id]
        return (
          <span className={`font-chip is-${status}`} key={id}>
            <i className="status-dot" />
            {def.label}
            {status === 'loading' && <em>载入中…</em>}
            {status === 'error' && (
              <button className="retry-btn" onClick={() => retryFont(id)}>
                <RotateCcw size={12} />
                重试
              </button>
            )}
          </span>
        )
      })}
    </div>
  )
}

/* ---------- 五阶段横条 ---------- */

function StageStrip({ cells, stageIndex, onSelect, fontStatuses }) {
  return (
    <div className="stage-strip" role="tablist" aria-label="五种书体阶段">
      {SCRIPTS.map((script, index) => {
        const cell = cells[index]
        const transition = index > 0 ? TRANSITIONS[index - 1] : null
        const prevMissing = index > 0 ? cells[index - 1].state === 'missing' : false
        const broken = prevMissing || cell.state === 'missing'
        return (
          <React.Fragment key={script.id}>
            {transition && (
              <span className={`strip-connector ${broken ? 'broken' : ''}`} aria-hidden="true">
                <i className="connector-line" />
                <em>{transition.name}</em>
              </span>
            )}
            <button
              className={`strip-cell ${index === stageIndex ? 'active' : ''} ${cell.state === 'missing' ? 'is-missing' : ''}`}
              onClick={() => onSelect(index)}
              role="tab"
              aria-selected={index === stageIndex}
              aria-label={`${script.name}${cell.state === 'missing' ? '（缺样）' : ''}`}
            >
              <span className="strip-glyph">
                <CellContent cell={cell} fontStatus={fontStatuses[script.fontId]} />
              </span>
              <span className="strip-meta">
                <b>{script.name}</b>
                <i>{script.era}</i>
              </span>
            </button>
          </React.Fragment>
        )
      })}
    </div>
  )
}

/* ---------- 聚焦面板 ---------- */

function FocusPanel({ model, stageIndex, onStep, onSeek, playing, onTogglePlay, fontStatuses }) {
  const script = SCRIPTS[stageIndex]
  const cell = model.cells[stageIndex]
  const entry = model.entry
  const transition = stageIndex > 0 ? transitionBetween(SCRIPTS[stageIndex - 1].id, script.id) : null
  const transitionNote = transition
    ? entry?.transitions?.[transition.key] || transition.detail
    : null

  return (
    <section className="focus-section" aria-label="当前书体">
      <div className={`focus-stage ${cell.state === 'missing' ? 'is-missing' : ''}`}>
        <span className="seal-badge">{script.seal}</span>
        <div className="focus-glyph mizige">
          <CellContent cell={cell} fontStatus={fontStatuses[script.fontId]} large />
        </div>
        <div className="focus-source">
          <span>{script.source}</span>
          <span>{script.era}</span>
        </div>
      </div>

      <div className="focus-info">
        <div className="focus-title">
          <span className="focus-index">{String(stageIndex + 1).padStart(2, '0')} / 05</span>
          <h2>{script.fullName}</h2>
          <p className="focus-gist">{script.gist}</p>
        </div>

        {cell.state === 'missing' ? (
          <div className="missing-note">
            <h3><AlertTriangle size={15} /> 此阶段缺样</h3>
            <p>{cell.reason}</p>
            <p className="missing-principle">观察原则：没有可靠样本的阶段如实留缺，不以推测补形、不伪造连续演变。</p>
          </div>
        ) : (
          <>
            {cell.note && <p className="focus-note">{cell.note}</p>}
            {cell.auto && <p className="focus-note muted">该字未做考据注记，仅按字库字形渲染。</p>}
            {cell.tags?.length > 0 && (
              <div className="tag-row">
                {cell.tags.map((tag) => (
                  <span className="tag" key={tag}>{tag}</span>
                ))}
              </div>
            )}
          </>
        )}

        <div className="insight-box">
          {transition ? (
            <>
              <span className="insight-kicker">{transition.name} · {transition.gist}</span>
              <p>{transitionNote}</p>
            </>
          ) : (
            <>
              <span className="insight-kicker">书体特征</span>
              <p>{script.intro}</p>
            </>
          )}
        </div>

        <div className="stage-stepper">
          <button className="step-btn" onClick={() => onStep(-1)} aria-label="上一阶段">
            <ArrowLeft size={17} />
          </button>
          <input
            className="stage-slider"
            type="range"
            min={0}
            max={LAST_SCRIPT_INDEX}
            step={1}
            value={stageIndex}
            onChange={(event) => onSeek(Number(event.target.value))}
            style={{ '--fill': (stageIndex / LAST_SCRIPT_INDEX) * 100 }}
            aria-label="书体阶段"
          />
          <button className="step-btn" onClick={() => onStep(1)} aria-label="下一阶段">
            <ArrowRight size={17} />
          </button>
          <button className="play-btn" onClick={onTogglePlay} aria-label={playing ? '暂停自动播放' : '自动播放演变'}>
            {playing ? <Pause size={15} /> : <Play size={15} />}
            {playing ? '暂停' : '播放'}
          </button>
        </div>
        <div className="stage-dots" aria-hidden="true">
          {SCRIPTS.map((item, index) => (
            <span
              key={item.id}
              className={`dot ${index === stageIndex ? 'active' : ''} ${model.cells[index].state === 'missing' ? 'hollow' : ''}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- 字信息条 ---------- */

function CharMeta({ model }) {
  const { entry, char } = model
  return (
    <div className="char-meta">
      <span className="char-meta-glyph">{char}</span>
      <div className="char-meta-text">
        {entry ? (
          <>
            <b>
              {entry.char}
              {entry.alias?.length > 0 && <i>（亦作 {entry.alias.join('、')}）</i>}
              <em>{entry.pinyin}</em>
            </b>
            <p>{entry.gloss}</p>
            <p className="char-story">{entry.story}</p>
          </>
        ) : (
          <>
            <b>{char}</b>
            <p>未考据字 · 仅按字库渲染</p>
          </>
        )}
      </div>
    </div>
  )
}

/* ---------- 关于 ---------- */

function AboutModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <aside className="modal-panel" onClick={(event) => event.stopPropagation()} role="dialog" aria-label="原则与字库">
        <button className="close-panel" onClick={onClose} aria-label="关闭">
          <X size={18} />
        </button>
        <h2>观察原则</h2>
        <ol className="principle-list">
          <li><b>同字对比</b> —— 每次只观察一个字在五种书体中的形体变化，不做作品赏析。</li>
          <li><b>宁缺毋假</b> —— 某书体没有可靠样本时如实留缺，不以推测补形、不伪造连续演变。</li>
          <li><b>字库为据</b> —— 字形来自下列开源字库（现代字体，非碑帖原迹），能否显示以字库真实收字为准。</li>
        </ol>
        <h2>字形资源</h2>
        <ul className="font-list">
          {SCRIPTS.map((script) => {
            const def = FONT_DEFS[script.fontId]
            return (
              <li key={script.id}>
                <span className="font-list-name">
                  <b>{script.name}</b>
                  {def.label}
                </span>
                <span className="font-list-meta">
                  收字 {manifestCounts[script.fontId] ?? '—'} · {def.license}
                </span>
              </li>
            )
          })}
        </ul>
        <p className="about-foot">
          篆书取《说文》小篆为据；隶书为金农隶意现代字体（千字文范围）；楷、行、草覆盖 GB2312 一级字 3755 字。
          考据库之外的字仅按字库渲染，不提供注记。字体许可全文见 <code>public/fonts/licenses/</code>。
        </p>
      </aside>
    </div>
  )
}

/* ---------- 页脚 ---------- */

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <span className="brand-seal">字</span>
        <span className="brand-text">
          <b>字形演变观察器</b>
          <small>结构压缩 · 笔画变化 · 形态重组</small>
        </span>
      </div>
      <p>缺样留缺，不作伪补。</p>
      <div className="footer-meta">
        <span>字形：霞鹜篆书 / 清骨隸 / Ma Shan Zheng / Zhi Mang Xing / Liu Jian Mao Cao</span>
        <span>许可：OFL-1.1 · Arphic Public License</span>
      </div>
    </footer>
  )
}

/* ---------- 应用 ---------- */

function App() {
  const saved = useMemo(loadViewState, [])
  const [char, setChar] = useState(isCJKChar(saved.char) ? saved.char : '永')
  const [inputValue, setInputValue] = useState(isCJKChar(saved.char) ? saved.char : '永')
  const [stageIndex, setStageIndex] = useState(
    Number.isInteger(saved.stage) && saved.stage >= 0 && saved.stage <= LAST_SCRIPT_INDEX ? saved.stage : 0
  )
  const [playing, setPlaying] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const fontStatuses = useFontStatuses()
  const playTimer = useRef(null)

  const model = useMemo(() => buildGlyphModel(char), [char])

  useEffect(() => {
    preloadAllFonts()
  }, [])

  useEffect(() => {
    saveViewState({ char, stage: stageIndex })
  }, [char, stageIndex])

  useEffect(() => {
    if (!playing) {
      clearInterval(playTimer.current)
      return undefined
    }
    playTimer.current = setInterval(() => {
      setStageIndex((index) => (index + 1) % SCRIPTS.length)
    }, 2000)
    return () => clearInterval(playTimer.current)
  }, [playing])

  const seek = useCallback((index) => {
    setStageIndex(Math.max(0, Math.min(LAST_SCRIPT_INDEX, index)))
  }, [])
  const step = useCallback((delta) => {
    setStageIndex((index) => (index + delta + SCRIPTS.length) % SCRIPTS.length)
  }, [])

  useEffect(() => {
    const onKey = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.key === 'ArrowLeft') step(-1)
      if (event.key === 'ArrowRight') step(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step])

  const handleInput = useCallback((value) => {
    setInputValue(value)
    const next = extractChar(value)
    if (next) setChar(next)
  }, [])

  const handlePick = useCallback((nextChar) => {
    setChar(nextChar)
    setInputValue(nextChar)
    setStageIndex(0)
  }, [])

  return (
    <>
      <Header fontStatuses={fontStatuses} onOpenAbout={() => setAboutOpen(true)} />
      <main>
        <ControlBar
          inputValue={inputValue}
          onInput={handleInput}
          onPick={handlePick}
          activeChar={char}
          curated={model.curated}
        />
        <FontStatusBar fontStatuses={fontStatuses} />
        <CharMeta model={model} />
        <StageStrip cells={model.cells} stageIndex={stageIndex} onSelect={seek} fontStatuses={fontStatuses} />
        <FocusPanel
          model={model}
          stageIndex={stageIndex}
          onStep={step}
          onSeek={seek}
          playing={playing}
          onTogglePlay={() => setPlaying((value) => !value)}
          fontStatuses={fontStatuses}
        />
      </main>
      <Footer />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  )
}

createRoot(document.getElementById('root')).render(<App />)
