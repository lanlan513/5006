// 3D 山水空间的场景管理器：渲染器 / OrbitControls / 后处理 / 自适应降级 / 相机预设动画。
// React 只负责 UI；所有 Three 对象的生命周期都收敛在这里，便于 dispose。
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { buildLandscape } from './geometry'
import { ARTIST_VIEW, VIEW_MAP } from './views'
import { TIER_HIGH, TIER_MEDIUM, TIER_LOW } from './capabilities'

const PAPER_COLOR = 0xe3dcc9
const CAMERA_NEAR = 0.1
const CAMERA_FAR = 120
// 初始雾密度与 _applyFog(0.32) 的结果一致，保证首帧到应用参数之间无跳变
const INITIAL_FOG_DENSITY = 0.002 + 0.32 * 0.024

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export class LandscapeSpace {
  constructor(container, { tier, prefersReducedMotion = false } = {}) {
    this.container = container
    this.tier = tier
    this.prefersReducedMotion = prefersReducedMotion
    this.running = false
    this.disposed = false
    this.visible = true
    this.onTierDowngrade = null
    this.onContextLost = null
    this.onViewChange = null

    this.lightIntensity = 1
    this.fogAmount = 0.32
    this.depthAmount = 0.22
    this.autoRotate = false
    this.currentView = ARTIST_VIEW
    this.tween = null

    const dpr = Math.min(window.devicePixelRatio || 1, tier === TIER_HIGH ? 2 : tier === TIER_MEDIUM ? 1.4 : 1)
    this.renderer = new THREE.WebGLRenderer({ antialias: tier !== TIER_LOW, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(dpr)
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setClearColor(PAPER_COLOR, 1)
    this.renderer.shadowMap.enabled = tier === TIER_HIGH
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.02
    container.appendChild(this.renderer.domElement)
    this.canvas = this.renderer.domElement
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.style.display = 'block'
    this.canvas.style.touchAction = 'none'
    this.canvas.setAttribute('aria-label', '可交互的三维山水空间')

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(PAPER_COLOR)
    this.scene.fog = new THREE.FogExp2(PAPER_COLOR, INITIAL_FOG_DENSITY)

    this.camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, CAMERA_NEAR, CAMERA_FAR)
    const artist = VIEW_MAP[ARTIST_VIEW]
    this.camera.position.set(...artist.position)
    this.camera.fov = artist.fov

    this._setupLights()
    this.landscape = buildLandscape(tier)
    this.scene.add(this.landscape.group)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.target.set(...artist.target)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.07
    this.controls.minDistance = 5
    this.controls.maxDistance = 46
    this.controls.maxPolarAngle = Math.PI * 0.62
    this.controls.minPolarAngle = Math.PI * 0.08
    this.controls.autoRotateSpeed = 0.55
    this.controls.update()
    this.controls.addEventListener('start', () => { this._cancelTween() })

    // 低档初始即关闭后处理：BokehPass 每帧要额外渲染一遍深度，低端 GPU 直接承担会拖垮帧率；
    // 景深滑块在无 bokehPass 时安全空转，雾色层次仍可暗示空间虚化。
    if (tier !== TIER_LOW) this._setupComposer(dpr)
    else { this.composer = null; this.bokehPass = null }
    this._applyLight()
    this._applyFog()
    this._applyDepth()

    this._resizeObserver = new ResizeObserver(() => this.resize())
    this._resizeObserver.observe(container)
    this._visibilityHandler = () => this.setVisibility(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', this._visibilityHandler)
    this._contextLostHandler = (event) => {
      event.preventDefault()
      // 上下文丢失后渲染调用只会持续报 GL 错误，立即停止循环
      this.running = false
      if (this._raf) {
        cancelAnimationFrame(this._raf)
        this._raf = 0
      }
      this.onContextLost?.()
    }
    this.canvas.addEventListener('webglcontextlost', this._contextLostHandler)

    this._frameBudget = tier === TIER_LOW ? 1000 / 30 : 1000 / 60
    this._lastFrame = 0
    this._fpsSamples = []
    this._downgraded = false
  }

  _setupLights() {
    this.hemi = new THREE.HemisphereLight(0xf3e9d2, 0x5d584c, 1.05)
    this.key = new THREE.DirectionalLight(0xffefd2, 2.0)
    this.key.position.set(-9, 16, 9)
    this.key.castShadow = this.tier === TIER_HIGH
    this.key.shadow.mapSize.set(1024, 1024)
    this.key.shadow.camera.left = -20
    this.key.shadow.camera.right = 20
    this.key.shadow.camera.top = 18
    this.key.shadow.camera.bottom = -6
    this.key.shadow.camera.far = 60
    this.key.shadow.bias = -0.0004
    this.scene.add(this.hemi, this.key)
  }

  _setupComposer(dpr) {
    this.composer = new EffectComposer(this.renderer)
    this.composer.setPixelRatio(dpr)
    this.composer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    this.bokehPass = new BokehPass(this.scene, this.camera, { focus: 26, aperture: 0, maxblur: 0.012, width: this.container.clientWidth, height: this.container.clientHeight })
    this.composer.addPass(this.bokehPass)
    this.composer.addPass(new OutputPass())
  }

  setLight(value) {
    this.lightIntensity = value
    this._applyLight()
  }

  _applyLight() {
    const l = this.lightIntensity
    this.key.intensity = 0.45 + 1.85 * l
    this.hemi.intensity = 0.45 + 0.75 * l
    this.renderer.toneMappingExposure = 0.78 + 0.42 * l
    if (this.landscape?.waterMaterial) this.landscape.waterMaterial.uniforms.uLight.value = l
  }

  setFog(value) {
    this.fogAmount = value
    this._applyFog()
  }

  _applyFog() {
    // 0.32 对应“纸本薄雾”的基准密度；0 仍保留一层极淡的空间分隔
    const density = 0.002 + this.fogAmount * 0.024
    this.scene.fog.density = density
  }

  setDepth(value) {
    this.depthAmount = value
    this._applyDepth()
  }

  _applyDepth() {
    if (!this.bokehPass) return
    // 滑块 0..1 -> 0..0.0009。场景纵深约 40 个单位，
    // BokehShader 的 aperture 需在该量级才能产生可见的焦点外虚化。
    this.bokehPass.uniforms.aperture.value = this.depthAmount * 0.0009
    this.bokehPass.uniforms.maxblur.value = 0.004 + this.depthAmount * 0.012
  }

  setAutoRotate(value) {
    this.autoRotate = value
    this.controls.autoRotate = value
  }

  setLabelsVisible(visible) {
    this.landscape.setLabelsVisible(visible)
  }

  goToView(viewId, { instant = false } = {}) {
    const preset = VIEW_MAP[viewId]
    if (!preset) return
    this.currentView = viewId
    this.onViewChange?.(viewId)
    if (instant || this.prefersReducedMotion) {
      this.camera.position.set(...preset.position)
      this.controls.target.set(...preset.target)
      this.camera.fov = preset.fov
      this.camera.updateProjectionMatrix()
      this.controls.update()
      return
    }
    this._cancelTween()
    const startPosition = this.camera.position.clone()
    const startTarget = this.controls.target.clone()
    const startFov = this.camera.fov
    this.tween = {
      startedAt: performance.now(),
      duration: 950,
      preset,
      from: { position: startPosition, target: startTarget, fov: startFov }
    }
    this.controls.enabled = false
  }

  resetArtistView() {
    this.goToView(ARTIST_VIEW)
  }

  _applyPreset(preset, t) {
    this.camera.position.lerpVectors(this.tween?.from?.position ?? this.camera.position, new THREE.Vector3(...preset.position), t)
    if (this.tween) {
      this.controls.target.lerpVectors(this.tween.from.target, new THREE.Vector3(...preset.target), t)
      this.camera.fov = THREE.MathUtils.lerp(this.tween.from.fov, preset.fov, t)
      this.camera.updateProjectionMatrix()
    }
  }

  _updateTween(now) {
    if (!this.tween) return
    const progress = Math.min(1, (now - this.tween.startedAt) / this.tween.duration)
    this._applyPreset(this.tween.preset, easeInOutCubic(progress))
    if (progress >= 1) {
      this.tween = null
      this.controls.enabled = true
    }
  }

  _cancelTween() {
    if (!this.tween) return
    this.tween = null
    this.controls.enabled = true
  }

  // 持续低帧率时自动降档：high -> medium -> low，低端机从首帧就使用低预算。
  _trackFps(delta) {
    if (this._downgraded) return
    this._fpsSamples.push(delta)
    if (this._fpsSamples.length > 90) this._fpsSamples.shift()
    if (this._fpsSamples.length < 60) return
    const average = this._fpsSamples.reduce((sum, value) => sum + value, 0) / this._fpsSamples.length
    if (average > 1000 / 28) {
      if (this.tier === TIER_HIGH) this._downgrade(TIER_MEDIUM)
      else if (this.tier === TIER_MEDIUM) this._downgrade(TIER_LOW)
      this._fpsSamples = []
    }
  }

  _downgrade(nextTier) {
    this._downgraded = true
    this.tier = nextTier
    this._frameBudget = nextTier === TIER_LOW ? 1000 / 30 : 1000 / 60
    if (nextTier === TIER_MEDIUM) {
      this.renderer.shadowMap.enabled = false
      this.landscape.group.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false
          child.receiveShadow = false
        }
      })
    }
    if (nextTier === TIER_LOW) {
      // 低档彻底关闭后处理：景深滑块改由雾化程度暗示空间虚化
      const composer = this.composer
      this.composer = null
      this.bokehPass = null
      // EffectComposer.dispose 不释放自定义 pass 的资源，这里在 RAF 之外立即回收
      composer?.passes?.forEach((pass) => pass.dispose?.())
      composer?.dispose?.()
    }
    this.onTierDowngrade?.(nextTier)
  }

  resize() {
    if (this.disposed || !this.container.clientWidth) return
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
    this.composer?.setSize(width, height)
  }

  setVisibility(visible) {
    this.visible = visible
    if (visible) {
      this._lastFrame = performance.now()
      if (this.running) this._raf = requestAnimationFrame(this._tick)
    } else if (this._raf) {
      cancelAnimationFrame(this._raf)
      this._raf = 0
    }
  }

  start() {
    if (this.running || this.disposed) return
    this.running = true
    this._lastFrame = performance.now()
    this._raf = requestAnimationFrame(this._tick)
  }

  _tick = (now) => {
    if (!this.running || this.disposed) return
    if (!this.visible) {
      this._raf = 0
      return
    }
    this._raf = requestAnimationFrame(this._tick)
    const elapsed = now - this._lastFrame
    if (elapsed < this._frameBudget) return
    const delta = Math.min(elapsed, 100)
    this._lastFrame = now

    const seconds = now / 1000
    if (this.landscape.waterMaterial) this.landscape.waterMaterial.uniforms.uTime.value = seconds
    for (const sprite of this.landscape.mistSprites) {
      sprite.position.x = sprite.userData.baseX + Math.sin(seconds * 0.08 + sprite.userData.phase) * sprite.userData.drift
    }
    this.landscape.boat.position.x = -3.4 + Math.sin(seconds * 0.12) * 0.9

    this._updateTween(now)
    this.controls.update()
    if (this.bokehPass) {
      this.bokehPass.uniforms.focus.value = this.camera.position.distanceTo(this.controls.target)
    }
    if (this.composer) this.composer.render(delta / 1000)
    else this.renderer.render(this.scene, this.camera)
    this._trackFps(delta)
  }

  dispose() {
    this.disposed = true
    this.running = false
    if (this._raf) cancelAnimationFrame(this._raf)
    this._resizeObserver?.disconnect()
    document.removeEventListener('visibilitychange', this._visibilityHandler)
    this.canvas?.removeEventListener('webglcontextlost', this._contextLostHandler)
    this.controls?.dispose()
    this.scene?.traverse((child) => {
      child.geometry?.dispose?.()
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      for (const material of materials) {
        for (const key of Object.keys(material || {})) {
          const value = material[key]
          if (value?.isTexture) value.dispose()
        }
        material?.dispose?.()
      }
    })
    this.composer?.passes?.forEach((pass) => pass.dispose?.())
    this.composer?.dispose?.()
    this.renderer.dispose()
    this.canvas?.remove()
  }
}
