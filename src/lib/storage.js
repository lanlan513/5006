const FAVORITES_KEY = 'cam-favorites'
const VIEW_STATE_KEY = 'cam-view-state'
const VISITOR_ID_KEY = 'cam-visitor-id'
const MATERIAL_TRAIL_KEY = 'cam-material-trail'
const MATERIAL_HISTORY_KEY = 'cam-material-history'

export function loadFavorites() {
  try {
    const value = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function saveFavorites(ids) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids))
  } catch {
    // Storage can be disabled in private or embedded browsing contexts.
  }
}

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
    // Storage can be disabled in private or embedded browsing contexts.
  }
}

export function getVisitorId() {
  try {
    const existingId = localStorage.getItem(VISITOR_ID_KEY)
    if (existingId) return existingId
    const visitorId = crypto.randomUUID?.() || `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(VISITOR_ID_KEY, visitorId)
    return visitorId
  } catch {
    return `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

// 材料探索器：当前浏览路径（面包屑对应的节点栈）
export function loadMaterialTrail() {
  try {
    const value = JSON.parse(localStorage.getItem(MATERIAL_TRAIL_KEY) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function saveMaterialTrail(trail) {
  try {
    localStorage.setItem(MATERIAL_TRAIL_KEY, JSON.stringify(trail))
  } catch {
    // Storage can be disabled in private or embedded browsing contexts.
  }
}

// 材料探索器：浏览历史（含每个节点当时所处的完整路径，便于原路返回）
export function loadMaterialHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(MATERIAL_HISTORY_KEY) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function saveMaterialHistory(entries) {
  try {
    localStorage.setItem(MATERIAL_HISTORY_KEY, JSON.stringify(entries))
  } catch {
    // Storage can be disabled in private or embedded browsing contexts.
  }
}
