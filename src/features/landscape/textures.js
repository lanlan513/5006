// 全部纹理由 Canvas 2D 程序化生成，不依赖外部模型 / 贴图，保证离线可用、加载稳定。
import * as THREE from 'three'

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function textureFromCanvas(canvas) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 2
  return texture
}

// 绢 / 宣纸底色，带轻微矿物颗粒与旧化暗角
export function makePaperTexture() {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const rand = mulberry32(7)
  const gradient = ctx.createLinearGradient(0, 0, 0, size)
  gradient.addColorStop(0, '#e7e0d0')
  gradient.addColorStop(0.55, '#e2dac6')
  gradient.addColorStop(1, '#d8cfb8')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 5200; i += 1) {
    const shade = rand() > 0.5 ? 70 : 255
    ctx.fillStyle = `rgba(${shade},${shade * 0.96},${shade * 0.86},${rand() * 0.028})`
    ctx.fillRect(rand() * size, rand() * size, 1 + rand() * 1.6, 1 + rand() * 1.6)
  }
  const vignette = ctx.createRadialGradient(size / 2, size * 0.45, size * 0.2, size / 2, size * 0.5, size * 0.78)
  vignette.addColorStop(0, 'rgba(80,66,44,0)')
  vignette.addColorStop(1, 'rgba(80,66,44,0.16)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, size, size)
  const texture = textureFromCanvas(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(2, 2)
  return texture
}

// 山体表面：纵向墨色晕染 + 披麻皴式笔触。
// tint 为整层墨色基调，mist 越强顶部越“没”进雾里（远山）。
export function makeRidgeTexture(seed, { tint = '#3a3832', mist = 0.35, cun = 1 } = {}) {
  const w = 512
  const h = 512
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const rand = mulberry32(seed)
  ctx.fillStyle = tint
  ctx.fillRect(0, 0, w, h)

  // 大块湿笔晕染
  for (let i = 0; i < 26; i += 1) {
    const x = rand() * w
    const y = h * (0.32 + rand() * 0.68)
    const radius = 40 + rand() * 130
    const wash = ctx.createRadialGradient(x, y, 0, x, y, radius)
    const dark = rand() > 0.5
    wash.addColorStop(0, dark ? 'rgba(15,14,12,0.22)' : 'rgba(238,231,214,0.10)')
    wash.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = wash
    ctx.fillRect(0, 0, w, h)
  }

  // 顶部没入雾气：白色渐变由上向下衰减
  const mistGradient = ctx.createLinearGradient(0, 0, 0, h)
  mistGradient.addColorStop(0, `rgba(232,227,214,${0.55 * mist})`)
  mistGradient.addColorStop(0.45, `rgba(232,227,214,${0.12 * mist})`)
  mistGradient.addColorStop(1, 'rgba(232,227,214,0)')
  ctx.fillStyle = mistGradient
  ctx.fillRect(0, 0, w, h)

  // 皴法：细长、略带弯曲的干笔线
  ctx.lineCap = 'round'
  const strokeCount = Math.round(70 * cun)
  for (let i = 0; i < strokeCount; i += 1) {
    const x = rand() * w
    const y = h * (0.3 + rand() * 0.66)
    const length = 30 + rand() * 110
    ctx.strokeStyle = `rgba(20,19,16,${0.05 + rand() * 0.13})`
    ctx.lineWidth = 0.6 + rand() * 1.8
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.bezierCurveTo(x + (rand() - 0.5) * 26, y + length * 0.35, x + (rand() - 0.5) * 34, y + length * 0.7, x + (rand() - 0.5) * 22, y + length)
    ctx.stroke()
  }
  // 苔点
  for (let i = 0; i < 180 * cun; i += 1) {
    ctx.fillStyle = `rgba(18,17,14,${0.08 + rand() * 0.16})`
    const dotSize = 0.8 + rand() * 2.2
    ctx.fillRect(rand() * w, h * (0.42 + rand() * 0.56), dotSize, dotSize * (0.6 + rand()))
  }
  return textureFromCanvas(canvas)
}

export function makeMistTexture(seed = 31) {
  const w = 256
  const h = 128
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const rand = mulberry32(seed)
  for (let i = 0; i < 14; i += 1) {
    const x = w * (0.2 + rand() * 0.6)
    const y = h * (0.35 + rand() * 0.3)
    const radius = 36 + rand() * 70
    const blob = ctx.createRadialGradient(x, y, 0, x, y, radius)
    blob.addColorStop(0, 'rgba(240,235,224,0.34)')
    blob.addColorStop(1, 'rgba(240,235,224,0)')
    ctx.fillStyle = blob
    ctx.fillRect(0, 0, w, h)
  }
  return textureFromCanvas(canvas)
}

export function makeSunTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const glow = ctx.createRadialGradient(size / 2, size / 2, 8, size / 2, size / 2, size / 2)
  glow.addColorStop(0, 'rgba(232,214,172,0.95)')
  glow.addColorStop(0.28, 'rgba(232,214,172,0.55)')
  glow.addColorStop(1, 'rgba(232,214,172,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, size, size)
  return textureFromCanvas(canvas)
}

export function makeLabelTexture(text) {
  const dpr = 2
  const padX = 12
  const padY = 7
  const measure = document.createElement('canvas').getContext('2d')
  measure.font = '500 13px "Noto Sans SC", sans-serif'
  const textWidth = measure.measureText(text).width
  const w = Math.ceil(textWidth + padX * 2 + 12)
  const h = 30
  const canvas = document.createElement('canvas')
  canvas.width = w * dpr
  canvas.height = h * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.fillStyle = 'rgba(17,17,15,0.66)'
  ctx.strokeStyle = 'rgba(199,154,107,0.75)'
  ctx.lineWidth = 1
  ctx.fillRect(0, 0, w, h)
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1)
  ctx.fillStyle = '#c79a6b'
  ctx.beginPath()
  ctx.arc(padX + 2, h / 2, 2.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#e8e4db'
  ctx.font = '500 13px "Noto Sans SC", sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, padX + 12, h / 2 + 0.5)
  const texture = textureFromCanvas(canvas)
  texture.minFilter = THREE.LinearFilter
  return { texture, aspect: w / h, height: 0.62 }
}
