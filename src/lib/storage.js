const FAVORITES_KEY = 'cam-favorites'
const VIEW_STATE_KEY = 'cam-view-state'
const VISITOR_ID_KEY = 'cam-visitor-id'

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
