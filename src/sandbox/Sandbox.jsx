import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, X } from 'lucide-react'
import { WORKS, workById, defaultComp, sanitizeComp } from '../data/works'
import { layoutComposition, analyzeComposition } from '../lib/layout'
import {
  createHistory, live, commit, undo, redo, gotoFrame,
  canUndo, canRedo, serializeState, serializeReplay, parseSerialized
} from '../lib/compositionHistory'
import { useFontStatuses } from '../lib/fonts'
import { loadSandboxState, saveSandboxState } from '../lib/storage'
import PaperCanvas from './PaperCanvas'
import ControlPanel from './ControlPanel'

const DEFAULT_LAYERS = {
  centroid: true,
  trajectory: true,
  heatmap: false,
  boundary: true,
  margin: true,
  jiugong: false
}

function downloadJSON(name, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function Sandbox() {
  const saved = useMemo(loadSandboxState, [])
  const [workId, setWorkId] = useState(workById[saved.workId] ? saved.workId : WORKS[0].id)
  const work = workById[workId]

  const [hist, setHist] = useState(() => {
    const initial = sanitizeComp(work, saved.comps?.[work.id])
    return createHistory(initial)
  })
  const [transient, setTransient] = useState(null)
  const comp = transient ?? hist.entries[hist.cursor]

  const [locks, setLocks] = useState({ body: false, inscription: false, seals: {} })
  const [selected, setSelected] = useState(null)
  const [layers, setLayers] = useState({ ...DEFAULT_LAYERS, ...(saved.layers || {}) })
  const [trajectory, setTrajectory] = useState([])
  const [snapshots, setSnapshots] = useState(saved.snapshots || [])
  const [arbitration, setArbitration] = useState('')
  const [replay, setReplay] = useState(null) // { index, playing, savedCursor }
  const fontStatuses = useFontStatuses()

  const layout = useMemo(() => layoutComposition(work, comp), [work, comp])
  const metrics = useMemo(() => analyzeComposition(work, comp, layout), [work, comp, layout])

  const replaying = Boolean(replay)
  const fontStatus = fontStatuses[work.fontId]
  const fontReady = fontStatus === 'ready'

  /* ---------- 历史操作 ---------- */

  const applyLive = useCallback((next) => setTransient(next), [])
  const applyCommit = useCallback((next, label, mergeKey) => {
    setTransient(null)
    setHist((h) => commit(h, next, label, mergeKey))
  }, [])

  const updateParam = useCallback((path, value, label, mergeKey) => {
    setHist((h) => {
      const next = JSON.parse(JSON.stringify(h.entries[h.cursor]))
      const keys = path.split('.')
      let node = next
      for (let i = 0; i < keys.length - 1; i += 1) node = node[keys[i]]
      node[keys[keys.length - 1]] = value
      return commit(h, next, label, mergeKey)
    })
  }, [])

  const updateSealParam = useCallback((sealId, key, value, label, mergeKey) => {
    setHist((h) => {
      const next = JSON.parse(JSON.stringify(h.entries[h.cursor]))
      const seal = next.seals.find((item) => item.id === sealId)
      if (seal) seal[key] = value
      return commit(h, next, label, mergeKey)
    })
  }, [])

  const doUndo = useCallback(() => {
    if (replaying) return
    setTransient(null)
    setHist((h) => undo(h))
  }, [replaying])
  const doRedo = useCallback(() => {
    if (replaying) return
    setTransient(null)
    setHist((h) => redo(h))
  }, [replaying])

  const resetWork = useCallback(() => {
    if (replaying) return
    setTransient(null)
    setHist((h) => commit(h, defaultComp(work), '复原原帖'))
    setArbitration(`已复原「${work.title}」的原帖章法`)
  }, [work, replaying])

  // 各作品的章法状态缓存：持久化以最新编辑为准，不依赖初次载入的快照。
  const compsRef = useRef({ ...(saved.comps || {}) })
  const switchWork = useCallback((id, initialComp) => {
    const nextWork = workById[id]
    if (!nextWork) return
    setWorkId(id)
    const cached = initialComp ?? compsRef.current[id] ?? sanitizeComp(nextWork, null)
    setHist(createHistory(sanitizeComp(nextWork, cached)))
    setTransient(null)
    setTrajectory([])
    setSelected(null)
    setReplay(null)
    setLocks({ body: false, inscription: false, seals: {} })
  }, [])

  /* ---------- 重心轨迹 ---------- */

  const lastTraj = useRef({ x: 0, y: 0 })
  useEffect(() => {
    if (replaying) return
    const { x, y } = metrics.centroid
    if (Math.hypot(x - lastTraj.current.x, y - lastTraj.current.y) > 4) {
      lastTraj.current = { x, y }
      setTrajectory((trail) => [...trail.slice(-89), { x, y }])
    }
  }, [metrics, replaying])

  /* ---------- 持久化 ---------- */

  useEffect(() => {
    compsRef.current[workId] = hist.entries[hist.cursor]
    saveSandboxState({
      workId,
      comps: compsRef.current,
      layers,
      snapshots
    })
  }, [workId, hist, layers, snapshots])

  /* ---------- 回放 ---------- */

  // 定时推进回放帧号；帧的应用由下面的 effect 统一执行。
  useEffect(() => {
    if (!replay?.playing) return undefined
    const timer = setInterval(() => {
      setReplay((r) => {
        if (!r) return null
        if (r.index + 1 >= hist.entries.length) return { ...r, playing: false }
        return { ...r, index: r.index + 1 }
      })
    }, 650)
    return () => clearInterval(timer)
  }, [replay?.playing, hist.entries.length])

  useEffect(() => {
    if (replay) setHist((h) => gotoFrame(h, replay.index))
  }, [replay])

  const startReplay = useCallback(() => {
    setTransient(null)
    setHist((h) => gotoFrame(h, 0))
    setReplay({ index: 0, playing: true, savedCursor: hist.cursor })
  }, [hist.cursor])

  const exitReplay = useCallback(() => {
    if (replay) setHist((h) => gotoFrame(h, replay.savedCursor))
    setReplay(null)
  }, [replay])

  /* ---------- 快照 / 导入导出 ---------- */

  const snapshotCount = useRef(snapshots.length)
  const saveSnapshot = useCallback(() => {
    snapshotCount.current += 1
    const time = new Date()
    const stamp = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`
    setSnapshots((list) => [
      ...list,
      {
        id: `snap-${Date.now()}`,
        workId,
        name: `快照 ${snapshotCount.current} · ${stamp}`,
        state: JSON.parse(JSON.stringify(comp))
      }
    ])
  }, [comp, workId])

  const applySnapshot = useCallback((snap) => {
    const clean = sanitizeComp(workById[snap.workId] || work, snap.state)
    if (snap.workId !== workId && workById[snap.workId]) {
      switchWork(snap.workId, clean)
    } else {
      setTransient(null)
      setHist((h) => commit(h, clean, `应用${snap.name}`))
    }
  }, [work, workId, switchWork])

  const deleteSnapshot = useCallback((id) => {
    setSnapshots((list) => list.filter((snap) => snap.id !== id))
  }, [])

  const exportState = useCallback(() => {
    downloadJSON(`${workId}-章法快照.json`, serializeState(workId, comp))
  }, [workId, comp])

  const exportReplay = useCallback(() => {
    downloadJSON(`${workId}-章法回放.json`, serializeReplay(workId, hist))
  }, [workId, hist])

  const importFile = useCallback((event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    file.text().then((text) => {
      const data = parseSerialized(text)
      const targetWork = workById[data.workId] || work
      if (data.kind === 'snapshot') {
        const clean = sanitizeComp(targetWork, data.state)
        if (targetWork.id !== workId) switchWork(targetWork.id, clean)
        else applyCommit(clean, '导入快照')
        setArbitration(`已导入「${targetWork.title}」的快照`)
      } else {
        const frames = data.frames.map((frame) => sanitizeComp(targetWork, frame))
        const labels = data.labels.length === frames.length ? data.labels : frames.map((_, i) => `帧 ${i + 1}`)
        if (targetWork.id !== workId) setWorkId(targetWork.id)
        setTransient(null)
        setTrajectory([])
        setReplay(null)
        setHist({ entries: frames, labels, cursor: frames.length - 1, lastTime: 0, mergeKey: null })
        setArbitration(`已载入回放：${frames.length} 帧，按「回放」观看`)
      }
    }).catch((error) => {
      setArbitration(`导入失败：${error.message}`)
    })
  }, [work, workId, switchWork, applyCommit])

  /* ---------- 键盘 ---------- */

  useEffect(() => {
    const onKey = (event) => {
      const tag = event.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const mod = event.metaKey || event.ctrlKey
      if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) doRedo()
        else doUndo()
        return
      }
      if (mod && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        doRedo()
        return
      }
      if (event.key === 'Escape') setSelected(null)
      if (event.key.startsWith('Arrow') && selected && !replaying) {
        const step = (event.shiftKey ? 8 : 1) / work.paper.w
        const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0
        const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0
        if (!dx && !dy) return
        event.preventDefault()
        if (selected.kind === 'seal' && !locks.seals[selected.id]) {
          const seal = comp.seals.find((item) => item.id === selected.id)
          if (seal) {
            updateSealParam(selected.id, 'x', seal.x + dx, '微移印章', `nudge-${selected.id}`)
            updateSealParam(selected.id, 'y', seal.y + dy, '微移印章', `nudge-${selected.id}`)
          }
        } else if (selected.kind === 'inscription' && !locks.inscription) {
          updateParam('inscription.x', comp.inscription.x + dx, '微移落款', 'nudge-ins')
          updateParam('inscription.y', comp.inscription.y + dy, '微移落款', 'nudge-ins')
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, replaying, comp, locks, work, doUndo, doRedo, updateParam, updateSealParam])

  /* ---------- 渲染 ---------- */

  const historyInfo = {
    canUndo: canUndo(hist),
    canRedo: canRedo(hist),
    cursor: hist.cursor,
    total: hist.entries.length
  }

  return (
    <section className="sandbox" aria-label="章法沙盘">
      <div className="sandbox-head">
        <div className="sandbox-works" role="tablist" aria-label="选择作品">
          {WORKS.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={item.id === workId}
              className={`work-chip ${item.id === workId ? 'active' : ''}`}
              onClick={() => switchWork(item.id)}
            >
              <b>{item.title}</b>
              <i>{item.author} · {item.scriptName}</i>
            </button>
          ))}
        </div>
        <p className="sandbox-brief">
          {work.note}
          <span className="sandbox-era">{work.era}</span>
          {!fontReady && (
            <span className="sandbox-fontnote">
              {fontStatus === 'error' ? '字库加载失败，暂以系统字代替' : '字库载入中…'}
            </span>
          )}
        </p>
      </div>

      <div className="sandbox-main">
        <div className="sandbox-left">
          <PaperCanvas
            work={work}
            comp={comp}
            layout={layout}
            metrics={metrics}
            locks={locks}
            selected={selected}
            trajectory={trajectory}
            layers={layers}
            fontReady={fontReady}
            replaying={replaying}
            onSelect={setSelected}
            onLiveComp={applyLive}
            onCommitComp={applyCommit}
            onArbitrate={setArbitration}
          />

          {replay ? (
            <div className="replay-bar">
              <button
                className="tool-btn"
                onClick={() => setReplay((r) => ({ ...r, playing: !r.playing }))}
                aria-label={replay.playing ? '暂停回放' : '继续回放'}
              >
                {replay.playing ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <input
                type="range"
                min={0}
                max={hist.entries.length - 1}
                step={1}
                value={replay.index}
                onChange={(event) => {
                  const index = Number(event.target.value)
                  setReplay((r) => ({ ...r, index, playing: false }))
                }}
                aria-label="回放进度"
              />
              <span className="replay-label">
                {replay.index + 1}/{hist.entries.length} · {hist.labels[replay.index] || ''}
              </span>
              <button className="tool-btn" onClick={exitReplay} aria-label="退出回放">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="replay-entry">
              <button className="tool-btn" onClick={startReplay} disabled={hist.entries.length < 2}>
                <Play size={14} /> 回放编辑过程（{hist.entries.length} 帧）
              </button>
            </div>
          )}
        </div>

        <div className={replaying ? 'panel-wrap is-replaying' : 'panel-wrap'}>
          <ControlPanel
            work={work}
            comp={comp}
            locks={locks}
            metrics={metrics}
            layers={layers}
            selected={selected}
            historyInfo={historyInfo}
            snapshots={snapshots}
            arbitration={arbitration}
            replaying={replaying}
            onParam={updateParam}
            onInscriptionParam={(key, v, label, mk) => updateParam(`inscription.${key}`, v, label, mk)}
            onSealParam={updateSealParam}
            onToggleLock={(kind, id) => {
              if (replaying) return
              setLocks((l) => {
                if (kind === 'seal') return { ...l, seals: { ...l.seals, [id]: !l.seals[id] } }
                return { ...l, [kind]: !l[kind] }
              })
            }}
            onToggleLayer={(key) => setLayers((l) => ({ ...l, [key]: !l[key] }))}
            onUndo={doUndo}
            onRedo={doRedo}
            onReset={resetWork}
            onSaveSnapshot={saveSnapshot}
            onApplySnapshot={applySnapshot}
            onDeleteSnapshot={deleteSnapshot}
            onExport={exportState}
            onImport={importFile}
            onExportReplay={exportReplay}
            onClearTrajectory={() => setTrajectory([])}
          />
        </div>
      </div>
    </section>
  )
}
