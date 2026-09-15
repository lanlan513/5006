import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { eraIndexAtTime, formatYear, timelineEras, timelineSegments, yearAtTime } from '../data/timelineData'
import './artTimeline.css'

const TRANSITION_SECONDS = 0.85
const TOUR_SECONDS = 78

const clamp01 = (value) => Math.min(1, Math.max(0, value))
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2)

function hexToRgb(hex) {
  const value = parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function mixColor(from, to, t) {
  const a = hexToRgb(from)
  const b = hexToRgb(to)
  return `rgb(${a.map((channel, i) => Math.round(channel + (b[i] - channel) * t)).join(', ')})`
}

function EraPanel({ era, index }) {
  return (
    <div className="artl-era" style={{ '--accent': era.palette.accent }}>
      <span className="artl-glyph" aria-hidden="true">{era.glyph}</span>
      <div className="artl-era-main">
        <div className="artl-era-index">{String(index + 1).padStart(2, '0')} / {String(timelineEras.length).padStart(2, '0')}</div>
        <h3>{era.name}</h3>
        <div className="artl-years">{era.years}</div>
        <p className="artl-summary">{era.summary}</p>
        <div className="artl-tags-label">审美倾向</div>
        <div className="artl-tags">{era.aesthetics.map((tag) => <span key={tag}>{tag}</span>)}</div>
      </div>
      <div className="artl-panels">
        <div className="artl-panel artl-panel-forms">
          <h4>主流艺术形式</h4>
          <ul>{era.forms.map((form) => <li key={form}>{form}</li>)}</ul>
        </div>
        <div className="artl-panel artl-panel-materials">
          <h4>材料与工艺</h4>
          <ul>{era.materials.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div className="artl-panel artl-panel-works">
          <h4>代表作品</h4>
          <ul>{era.works.map((work) => <li key={work.title}><b>{work.title}</b><span>{work.artist}</span></li>)}</ul>
        </div>
      </div>
    </div>
  )
}

export default function ArtTimeline() {
  // —— 状态分离 ——
  // 1) 时间位置（engine.time / engine.target）：连续值，只存在于 ref，由 rAF 逐帧推进
  // 2) 当前时期（stage）：已提交的 era 内容，React state，只在过渡开始/结算时变更
  // 3) 过渡动画（engine.trans）：进行中的 {to, progress}，独立于前两者
  // 快速拖动时，过渡按「视觉主导方」结算（progress ≥ 0.5 归新，否则归旧），
  // 旧时期内容永远不会在结算后覆盖新时期。
  const [stage, setStage] = useState({ slots: [0, 0], front: 0 })
  const [playing, setPlaying] = useState(false)

  const engine = useRef(null)
  if (!engine.current) {
    engine.current = {
      target: 0,          // 目标时间位置 0..1（拖动 / 播放 / 跳转写入）
      time: 0,            // 渲染用时间位置，向 target 平滑逼近
      playing: false,
      dragging: false,
      committed: 0,       // 已提交的时期 index（前台层内容）
      front: 0,           // 前台层槽位（0 / 1）
      displayed: -1,      // 读数与节点高亮当前展示的时期
      trans: { active: false, to: 0, progress: 0 },
      lastTs: 0
    }
  }

  const sectionRef = useRef(null)
  const bgRef = useRef(null)
  const layerRefs = useRef([])
  const handleRef = useRef(null)
  const fillRef = useRef(null)
  const yearRef = useRef(null)
  const eraNameRef = useRef(null)
  const nodesRef = useRef(null)
  const trackRef = useRef(null)

  // 过渡开始：把目标时期渲染进后台层，进度归零
  const startTransition = (to) => {
    const eng = engine.current
    eng.trans = { active: true, to, progress: 0 }
    setStage((current) => {
      const back = 1 - current.front
      if (current.slots[back] === to) return current
      const slots = [...current.slots]
      slots[back] = to
      return { ...current, slots }
    })
  }

  // 过渡结算：后台层转正，committed 一次性切换，此后旧内容不再参与渲染
  const settleTo = (eraIndex) => {
    const eng = engine.current
    eng.trans = { active: false, to: eraIndex, progress: 0 }
    if (eraIndex !== eng.committed) {
      eng.committed = eraIndex
      eng.front = 1 - eng.front
      setStage((current) => ({ slots: current.slots, front: 1 - current.front }))
    }
  }

  // 每帧视觉写入：全部通过 ref 直接操作 DOM，不触发 React 重渲染
  const applyVisuals = () => {
    const eng = engine.current
    const trans = eng.trans
    const progress = trans.active ? easeInOut(Math.min(1, trans.progress)) : 0
    const frontEl = layerRefs.current[eng.front]
    const backEl = layerRefs.current[1 - eng.front]

    if (frontEl && backEl) {
      if (trans.active) {
        backEl.style.opacity = String(progress)
        backEl.style.transform = `translateY(${(1 - progress) * 26}px) scale(${0.985 + 0.015 * progress})`
        frontEl.style.opacity = String(1 - progress)
        frontEl.style.transform = `translateY(${-progress * 18}px)`
      } else {
        frontEl.style.opacity = '1'
        frontEl.style.transform = 'none'
        backEl.style.opacity = '0'
        backEl.style.transform = 'none'
      }
    }

    // 背景与强调色随过渡进度连续插值
    const fromPalette = timelineEras[eng.committed].palette
    const toPalette = timelineEras[trans.active ? trans.to : eng.committed].palette
    if (bgRef.current) {
      bgRef.current.style.background = `linear-gradient(160deg, ${mixColor(fromPalette.from, toPalette.from, progress)} 0%, ${mixColor(fromPalette.to, toPalette.to, progress)} 100%)`
    }
    if (sectionRef.current) {
      sectionRef.current.style.setProperty('--era-accent', mixColor(fromPalette.accent, toPalette.accent, progress))
    }

    const percent = eng.time * 100
    if (handleRef.current) handleRef.current.style.left = `${percent}%`
    if (fillRef.current) fillRef.current.style.width = `${percent}%`
    if (yearRef.current) yearRef.current.textContent = formatYear(yearAtTime(eng.time))

    // 读数与节点高亮：过渡过半即认定新时期为「当前时期」
    const displayed = trans.active && trans.progress > 0.5 ? trans.to : eng.committed
    if (displayed !== eng.displayed) {
      eng.displayed = displayed
      if (eraNameRef.current) eraNameRef.current.textContent = timelineEras[displayed].name
      const nodes = nodesRef.current?.children
      if (nodes) {
        for (let i = 0; i < nodes.length; i += 1) {
          nodes[i].classList.toggle('is-active', i === displayed)
        }
      }
    }
  }

  // 主循环：推进时间 → 驱动过渡状态机 → 写入视觉
  useEffect(() => {
    let raf = 0
    const loop = (timestamp) => {
      const eng = engine.current
      const dt = eng.lastTs ? Math.min(0.05, (timestamp - eng.lastTs) / 1000) : 0
      eng.lastTs = timestamp

      if (eng.playing) {
        eng.target = Math.min(1, eng.target + dt / TOUR_SECONDS)
        if (eng.target >= 1) {
          eng.playing = false
          setPlaying(false)
        }
      }

      const stiffness = eng.dragging ? 16 : 6.5
      eng.time += (eng.target - eng.time) * Math.min(1, dt * stiffness)
      if (Math.abs(eng.target - eng.time) < 0.0005) eng.time = eng.target

      const desired = eraIndexAtTime(eng.time)
      const trans = eng.trans
      if (trans.active) {
        trans.progress = Math.min(1, trans.progress + dt / TRANSITION_SECONDS)
        if (desired !== trans.to) {
          // 拖动在过渡中途改向：按视觉主导方结算，再朝新目标重新过渡
          settleTo(trans.progress >= 0.5 ? trans.to : eng.committed)
          if (desired !== engine.current.committed) startTransition(desired)
        } else if (trans.progress >= 1) {
          settleTo(trans.to)
        }
      } else if (desired !== eng.committed) {
        startTransition(desired)
      }

      applyVisuals()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const jumpToEra = (index) => {
    const eng = engine.current
    eng.playing = false
    setPlaying(false)
    eng.target = timelineSegments[index].center
  }

  const stepEra = (direction) => {
    const eng = engine.current
    const current = eng.displayed >= 0 ? eng.displayed : eng.committed
    jumpToEra(Math.min(timelineEras.length - 1, Math.max(0, current + direction)))
  }

  const togglePlay = () => {
    const eng = engine.current
    if (!eng.playing && eng.target >= 1) eng.target = 0 // 播到结尾后再次播放：回到起点
    eng.playing = !eng.playing
    setPlaying(eng.playing)
  }

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.key === 'ArrowLeft') stepEra(-1)
      else if (event.key === 'ArrowRight') stepEra(1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const timeFromPointer = (event) => {
    const rect = trackRef.current.getBoundingClientRect()
    return clamp01((event.clientX - rect.left) / rect.width)
  }

  const onTrackPointerDown = (event) => {
    const eng = engine.current
    eng.playing = false
    setPlaying(false)
    eng.dragging = true
    eng.target = timeFromPointer(event)
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onTrackPointerMove = (event) => {
    if (engine.current.dragging) engine.current.target = timeFromPointer(event)
  }
  const onTrackPointerUp = () => {
    engine.current.dragging = false
  }

  return (
    <section className="artl" id="timeline" ref={sectionRef}>
      <div className="artl-bg" ref={bgRef} aria-hidden="true" />
      <div className="artl-inner">
        <header className="artl-head">
          <div>
            <div className="section-kicker">/ 视觉时间轴</div>
            <h2>拖动时间，<i>看美术史连续发生。</i></h2>
          </div>
          <div className="artl-controls">
            <button className="artl-step" onClick={() => stepEra(-1)} aria-label="上一个时期"><ChevronLeft size={16} /></button>
            <button className="artl-play" onClick={togglePlay}>
              {playing ? <Pause size={15} /> : <Play size={15} />}
              {playing ? '暂停' : '自动播放'}
            </button>
            <button className="artl-step" onClick={() => stepEra(1)} aria-label="下一个时期"><ChevronRight size={16} /></button>
          </div>
        </header>

        <div className="artl-readout">
          <span className="artl-year" ref={yearRef}>公元前 2100 年</span>
          <span className="artl-readout-divider" />
          <span className="artl-era-name" ref={eraNameRef}>先秦</span>
        </div>

        <div className="artl-stage">
          {stage.slots.map((eraIndex, slot) => (
            <div
              key={slot}
              ref={(el) => { layerRefs.current[slot] = el }}
              className="artl-layer"
              style={{ opacity: slot === stage.front ? 1 : 0 }}
            >
              <EraPanel era={timelineEras[eraIndex]} index={eraIndex} />
            </div>
          ))}
        </div>

        <div className="artl-track-wrap">
          <div
            className="artl-track"
            ref={trackRef}
            role="slider"
            aria-label="美术史时间轴"
            aria-valuemin={0}
            aria-valuemax={timelineEras.length - 1}
            aria-valuenow={stage.slots[stage.front]}
            aria-valuetext={timelineEras[stage.slots[stage.front]].name}
            tabIndex={0}
            onPointerDown={onTrackPointerDown}
            onPointerMove={onTrackPointerMove}
            onPointerUp={onTrackPointerUp}
            onPointerCancel={onTrackPointerUp}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') { event.preventDefault(); stepEra(-1) }
              if (event.key === 'ArrowRight') { event.preventDefault(); stepEra(1) }
            }}
          >
            <div className="artl-fill" ref={fillRef} />
            <div className="artl-nodes" ref={nodesRef}>
              {timelineSegments.map((segment, index) => (
                <button
                  key={segment.era.id}
                  className="artl-node"
                  style={{ left: `${segment.center * 100}%`, '--node-scale': segment.nodeScale }}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => jumpToEra(index)}
                  aria-label={`跳转到${segment.era.name}`}
                >
                  <span className="artl-node-dot" />
                  <span className="artl-node-label">{segment.era.name}</span>
                </button>
              ))}
            </div>
            <div className="artl-handle" ref={handleRef} />
          </div>
          <div className="artl-track-meta">
            <span>节点大小与区间长度随各时期内容密度自适应</span>
            <span>拖动滑杆 · 点击节点跳转 · ← → 切换时期</span>
          </div>
        </div>
      </div>
    </section>
  )
}
