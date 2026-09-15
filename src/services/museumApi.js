const API_ROOT = '/api'

async function request(path, options) {
  const response = await fetch(`${API_ROOT}${path}`, {
    headers: { Accept: 'application/json', ...options?.headers },
    ...options
  })
  const payload = await response.json().catch(() => null)
  if (!payload || typeof payload !== 'object') {
    throw new Error('数据服务返回了无效内容。')
  }
  if (!response.ok) throw new Error(payload.message || '请求服务失败。')
  if (!Object.hasOwn(payload, 'data')) throw new Error('数据服务返回了不完整内容。')
  return payload.data
}

export function getArtworks({ domain = '全部', query = '', subjectId = null } = {}) {
  const parameters = new URLSearchParams()
  if (domain !== '全部') parameters.set('domain', domain)
  if (subjectId) parameters.set('subjectId', subjectId)
  if (query.trim()) parameters.set('query', query.trim())
  const suffix = parameters.size ? `?${parameters}` : ''
  return request(`/artworks${suffix}`).then((data) => {
    if (!Array.isArray(data)) throw new Error('作品目录格式无效。')
    return data
  })
}

export async function getFeaturedArtwork() {
  const data = await request('/artworks/featured')
  if (!data || typeof data !== 'object' || typeof data.id !== 'string') throw new Error('精选作品格式无效。')
  return data
}

export async function getDomains() {
  const data = await request('/domains')
  if (!Array.isArray(data) || !data.every((item) => typeof item === 'string')) throw new Error('门类数据格式无效。')
  return data
}

export async function getEras() {
  const data = await request('/eras')
  if (!Array.isArray(data) || !data.every((item) => item && typeof item.label === 'string')) throw new Error('时间轴数据格式无效。')
  return data
}

/** 服务端构建的画科分类法（分类元数据 + ID 索引 + 计数与告警），失败由本地数据兜底。 */
export async function getTaxonomy() {
  const data = await request('/taxonomy')
  if (!data || !Array.isArray(data.subjects) || !data.taxonomy) throw new Error('分类法数据格式无效。')
  return data
}

/** 服务端构建的表现技法分类法，失败由前端本地 buildTechniqueIndex 兜底。 */
export async function getTechniques() {
  const data = await request('/techniques')
  if (!data || !Array.isArray(data.techniques) || !data.index) throw new Error('技法数据格式无效。')
  return data
}

/** 服务端构建的构图法标本库，失败由前端本地 compositions.js 兜底。 */
export async function getCompositions() {
  const data = await request('/compositions')
  if (!data || !Array.isArray(data.compositions) || !Array.isArray(data.specimens)) throw new Error('构图法数据格式无效。')
  return data
}

export async function getFavorites(visitorId) {
  const favorites = await request('/favorites', { headers: { 'X-Visitor-Id': visitorId } })
  if (!Array.isArray(favorites)) throw new Error('收藏数据格式无效。')
  return favorites
}
export const updateFavorites = (visitorId, artworkIds) => request('/favorites', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', 'X-Visitor-Id': visitorId },
  body: JSON.stringify({ artworkIds })
})
