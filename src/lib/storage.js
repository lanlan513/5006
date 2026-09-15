const VIEW_STATE_KEY = 'glyph-observer-view'
const SANDBOX_KEY = 'zhangfa-sandbox'

export function loadViewState() {
  try {
    const value = JSON.parse(localStorage.getItem(VIEW_STATE_KEY) || '{}')
    return value && typeof value === 'object' ? value : {}
  } catch {
    return {}
  }
}

export function saveViewState(state) {
  try {
    localStorage.setItem(VIEW_STATE_KEY, JSON.stringify(state))
  } catch {
    // 隐私模式等场景下 localStorage 可能不可用，静默降级。
  }
}

/** 章法沙盘：按作品记住章法状态、图层开关与快照列表 */
export function loadSandboxState() {
  try {
    const value = JSON.parse(localStorage.getItem(SANDBOX_KEY) || '{}')
    return value && typeof value === 'object' ? value : {}
  } catch {
    return {}
  }
}

export function saveSandboxState(state) {
  try {
    localStorage.setItem(SANDBOX_KEY, JSON.stringify(state))
  } catch {
    // 同上，静默降级。
  }
}
