// 字体资源层：五种书体字体的异步加载、状态管理与覆盖查询。
//
// 每个字体有四种状态：idle → loading → ready | error。
// error 状态下界面降级为系统字体渲染，并允许重试。
// 覆盖清单（fontManifest.json）由构建期从实际子集字体的 cmap 生成，
// 因此「字库未收录」的判断以真实字体文件为准，不靠猜。

import { useSyncExternalStore } from 'react'
import manifest from '../data/fontManifest.json'

export const FONT_DEFS = {
  seal: { family: 'LXGW Seal', file: '/fonts/seal.woff2', label: '霞鹜篆书', license: 'OFL-1.1' },
  li: { family: 'Qinggu Li TC', file: '/fonts/li.woff2', label: '清骨隸', license: 'Arphic PL' },
  kai: { family: 'Ma Shan Zheng', file: '/fonts/kai.woff2', label: 'Ma Shan Zheng 楷书', license: 'OFL-1.1' },
  xing: { family: 'Zhi Mang Xing', file: '/fonts/xing.woff2', label: 'Zhi Mang Xing 行书', license: 'OFL-1.1' },
  cao: { family: 'Liu Jian Mao Cao', file: '/fonts/cao.woff2', label: 'Liu Jian Mao Cao 毛草', license: 'OFL-1.1' }
}

export const FONT_IDS = Object.keys(FONT_DEFS)

const LOAD_TIMEOUT = 20000

const coverage = Object.fromEntries(
  Object.entries(manifest).map(([id, chars]) => [id, new Set(chars)])
)

/** 字库是否收录该字（以子集字体的真实 cmap 为准） */
export function hasGlyph(fontId, char) {
  return Boolean(char) && (coverage[fontId]?.has(char) ?? false)
}

let statuses = Object.fromEntries(FONT_IDS.map((id) => [id, 'idle']))
const listeners = new Set()
const loadPromises = {}

function setStatus(id, status) {
  statuses = { ...statuses, [id]: status }
  listeners.forEach((listener) => listener())
}

export function getFontStatuses() {
  return statuses
}

export function subscribeFonts(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * 异步加载字体。重复调用返回同一 Promise；
 * 失败后可用 { force: true } 重试（会重建 FontFace）。
 */
export function loadFont(id, { force = false } = {}) {
  if (loadPromises[id] && !force) return loadPromises[id]
  const def = FONT_DEFS[id]
  if (!def) return Promise.reject(new Error(`未知字体：${id}`))

  if (typeof FontFace === 'undefined') {
    setStatus(id, 'error')
    return Promise.reject(new Error('当前环境不支持 FontFace API'))
  }

  setStatus(id, 'loading')
  const face = new FontFace(def.family, `url(${def.file}) format('woff2')`, { display: 'swap' })
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`字体加载超时（${def.label}）`)), LOAD_TIMEOUT)
  })

  const promise = Promise.race([face.load(), timeout])
    .then((loadedFace) => {
      document.fonts.add(loadedFace)
      setStatus(id, 'ready')
      return loadedFace
    })
    .catch((error) => {
      setStatus(id, 'error')
      throw error
    })
  // 状态已记录在 store 中，避免未处理的 rejection 警告。
  promise.catch(() => {})
  loadPromises[id] = promise
  return promise
}

export function retryFont(id) {
  delete loadPromises[id]
  return loadFont(id, { force: true })
}

export function preloadAllFonts() {
  FONT_IDS.forEach((id) => loadFont(id))
}

export function useFontStatuses() {
  return useSyncExternalStore(subscribeFonts, getFontStatuses)
}
