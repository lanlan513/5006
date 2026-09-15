// WebGL 可用性探测与设备性能分级。
// 目的：在真正创建渲染器之前决定画质档，避免低端设备一初始化就卡死。

export const TIER_HIGH = 'high'
export const TIER_MEDIUM = 'medium'
export const TIER_LOW = 'low'

export function detectWebGL() {
  if (typeof window === 'undefined' || !window.WebGLRenderingContext) {
    return { supported: false, reason: 'unsupported' }
  }
  const canvas = document.createElement('canvas')
  let context = null
  try {
    context = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  } catch (error) {
    return { supported: false, reason: 'blocked', detail: error?.message }
  }
  if (!context) return { supported: false, reason: 'blocked' }
  let debugInfo = null
  try {
    debugInfo = context.getExtension('WEBGL_debug_renderer_info')
  } catch {
    debugInfo = null
  }
  const renderer = debugInfo ? String(context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '') : ''
  const loseContext = context.getExtension('WEBGL_lose_context')
  loseContext?.loseContext?.()
  return { supported: true, renderer }
}

function scoreHardware(renderer) {
  const deviceMemory = navigator.deviceMemory || 4
  const cores = navigator.hardwareConcurrency || 4
  const maxTextureSize = 4096 // detectWebGL 已释放上下文，保守取值
  let score = 0
  score += Math.min(deviceMemory, 16) * 2
  score += Math.min(cores, 12)
  if (window.innerWidth * window.innerHeight <= 1366 * 768) score -= 2
  if (matchMedia('(pointer: coarse)').matches) score -= 2
  if (/SwiftShader|llvmpipe|Software|Microsoft Basic Render/i.test(renderer)) score -= 20
  if (/Mali-4|Adreno 3|Adreno 4|Apple A[7-9]|PowerVR/i.test(renderer)) score -= 8
  if (/Apple A1[4-9]|Apple M[1-9]|RTX|GTX|RX \d|Radeon Pro/i.test(renderer)) score += 6
  if (maxTextureSize < 4096) score -= 4
  return score
}

export function tierFromScore(score) {
  if (score >= 26) return TIER_HIGH
  if (score >= 15) return TIER_MEDIUM
  return TIER_LOW
}

export function detectCapability() {
  const webgl = detectWebGL()
  if (!webgl.supported) return { supported: false, tier: TIER_LOW, webgl }
  const score = scoreHardware(webgl.renderer)
  const tier = tierFromScore(score)
  return { supported: true, tier, score, webgl, prefersReducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches }
}
