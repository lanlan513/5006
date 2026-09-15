import { useEffect, useRef, useState } from 'react'
import { Aperture, Compass, Eye, Gauge, Layers, Mountain, RotateCcw, Sun, Wind } from 'lucide-react'
import { detectCapability, TIER_HIGH, TIER_MEDIUM, TIER_LOW } from './capabilities'
import { LandscapeSpace } from './scene'
import { ARTIST_VIEW, VIEW_PRESETS } from './views'
import LandscapeFallback from './LandscapeFallback'

const TIER_LABEL = { [TIER_HIGH]: '高画质', [TIER_MEDIUM]: '均衡画质', [TIER_LOW]: '流畅模式' }

function Slider({ icon: Icon, label, value, onChange, disabled, disabledHint }) {
  return (
    <div className={disabled ? 'control-slider is-disabled' : 'control-slider'}>
      <div className="slider-head">
        <span>{Icon && <Icon size={14} />}{label}</span>
        <i>{disabled ? '—' : `${Math.round(value * 100)}%`}</i>
      </div>
      <input
        type="range" min="0" max="1" step="0.01" value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
      />
      {disabled && disabledHint ? <small>{disabledHint}</small> : null}
    </div>
  )
}

export default function LandscapeStudio() {
  const mountRef = useRef(null)
  const spaceRef = useRef(null)
  const [status, setStatus] = useState({ phase: 'detecting' })
  const [activeView, setActiveView] = useState(ARTIST_VIEW)
  const [light, setLight] = useState(0.62)
  const [fog, setFog] = useState(0.32)
  const [depth, setDepth] = useState(0.22)
  const [autoRotate, setAutoRotate] = useState(false)
  const [showLabels, setShowLabels] = useState(false)

  useEffect(() => {
    let active = true
    let space = null
    // 延后一帧：先让容器完成布局，避免低端设备首屏布局与 WebGL 初始化叠加
    const frame = requestAnimationFrame(() => {
      const capability = detectCapability()
      if (!capability.supported) {
        if (active) setStatus({ phase: 'unsupported', reason: capability.webgl.reason })
        return
      }
      try {
        space = new LandscapeSpace(mountRef.current, { tier: capability.tier, prefersReducedMotion: capability.prefersReducedMotion })
      } catch (error) {
        console.warn('Landscape WebGL init failed:', error)
        if (active) setStatus({ phase: 'unsupported', reason: 'blocked' })
        return
      }
      spaceRef.current = space
      space.onViewChange = (viewId) => active && setActiveView(viewId)
      space.onContextLost = () => {
        if (!active) return
        spaceRef.current = null
        setStatus({ phase: 'unsupported', reason: 'lost' })
      }
      space.onTierDowngrade = (tier) => active && setStatus((prev) => ({ ...prev, tier, downgraded: true }))
      space.setLight(0.62)
      space.setFog(0.32)
      space.setDepth(0.22)
      space.start()
      if (active) setStatus({ phase: 'ready', tier: capability.tier })
    })
    return () => {
      active = false
      cancelAnimationFrame(frame)
      space?.dispose()
      spaceRef.current = null
    }
  }, [])

  const goTo = (viewId) => {
    setActiveView(viewId)
    spaceRef.current?.goToView(viewId)
  }
  const reset = () => {
    setLight(0.62); setFog(0.32); setDepth(0.22)
    const space = spaceRef.current
    if (space) {
      space.setLight(0.62)
      space.setFog(0.32)
      space.setDepth(0.22)
    }
    setActiveView(ARTIST_VIEW)
    spaceRef.current?.resetArtistView()
  }
  const activePreset = VIEW_PRESETS.find((preset) => preset.id === activeView)
  const lowTier = status.tier === TIER_LOW

  return (
    <section className="space-studio" id="space">
      <div className="studio-head">
        <div>
          <div className="section-kicker">/ 空间实验</div>
          <h2>把一幅山水，<i>转一圈来看。</i></h2>
          <p className="studio-desc">将山水拆解为远景、主峰、水面、林木、建筑与近景等深度层，沿真实三维空间拉开。旋转视角，在“高远、深远、平远”与镜头透视之间来回切换，比较两种空间观。</p>
        </div>
        {status.phase === 'ready' && (
          <div className={'quality-badge' + (status.downgraded ? ' is-soft' : '')}>
            <Gauge size={14} />
            <span>{TIER_LABEL[status.tier]}</span>
            {status.downgraded && <small>已按帧率自动降级</small>}
          </div>
        )}
      </div>

      <div className="studio-stage">
        <div className="canvas-frame">
          <div ref={mountRef} className="canvas-mount" />
          {status.phase === 'detecting' && (
            <div className="canvas-loading"><Mountain size={22} /><span>正在铺陈山水…</span></div>
          )}
          {status.phase === 'unsupported' && <LandscapeFallback reason={status.reason} />}

          {status.phase === 'ready' && (
            <>
              <div className="view-hint" key={activeView}>
                <b>{activePreset.method || '原作视角'}</b>
                <p>{activePreset.hint}</p>
              </div>
              <div className="canvas-tip"><Compass size={13} /> 拖拽旋转 · 滚轮缩放 · 双指平移</div>
            </>
          )}
        </div>

        {status.phase === 'ready' && (
          <aside className="control-panel">
            <div className="panel-group">
              <p className="panel-title"><Eye size={13} /> 观察视角</p>
              <div className="view-grid">
                {VIEW_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    className={activeView === preset.id ? 'view-chip active' : 'view-chip'}
                    onClick={() => goTo(preset.id)}
                  >
                    {preset.label}
                    {preset.method && <small>{preset.method.split(' · ')[0]}</small>}
                  </button>
                ))}
              </div>
              <button className="artist-reset" onClick={reset}>
                <RotateCcw size={14} /> 一键恢复艺术家视角
              </button>
            </div>

            <div className="panel-group">
              <p className="panel-title"><Aperture size={13} /> 空间参数</p>
              <Slider icon={Sun} label="光照强度" value={light} onChange={(value) => { setLight(value); spaceRef.current?.setLight(value) }} />
              <Slider icon={Wind} label="雾气化境" value={fog} onChange={(value) => { setFog(value); spaceRef.current?.setFog(value) }} />
              <Slider
                icon={Aperture} label="景深" value={depth}
                disabled={lowTier}
                disabledHint="当前为流畅模式：以雾色层次替代景深虚化"
                onChange={(value) => { setDepth(value); spaceRef.current?.setDepth(value) }}
              />
            </div>

            <div className="panel-group toggle-row">
              <button className={autoRotate ? 'toggle-btn active' : 'toggle-btn'} onClick={() => { const next = !autoRotate; setAutoRotate(next); spaceRef.current?.setAutoRotate(next) }}>
                <Compass size={14} /> 缓慢环视
              </button>
              <button className={showLabels ? 'toggle-btn active' : 'toggle-btn'} onClick={() => { const next = !showLabels; setShowLabels(next); spaceRef.current?.setLabelsVisible(next) }}>
                <Layers size={14} /> 分层标注
              </button>
            </div>

            <p className="panel-footnote">
              正面为画家安排的“散点”图式：远近山体近乎等大；转到斜视时，真实镜头透视与这一图式的差异即被看见。
            </p>
          </aside>
        )}
      </div>
    </section>
  )
}
