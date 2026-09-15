const VIEW_STATE_KEY = 'glyph-observer-view'

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
