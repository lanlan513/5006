import { artworks, domains, eras } from '../../src/data/museumData.js'

function includesQuery(artwork, query) {
  const normalizedQuery = query.trim().toLocaleLowerCase('zh-CN')
  if (!normalizedQuery) return true

  return [artwork.title, artwork.artist, artwork.domain, artwork.medium, artwork.location, ...artwork.tags]
    .join(' ')
    .toLocaleLowerCase('zh-CN')
    .includes(normalizedQuery)
}

export function listArtworks({ domain = '全部', query = '' } = {}) {
  return artworks.filter((artwork) =>
    (domain === '全部' || artwork.domain === domain) && includesQuery(artwork, query)
  )
}

export function findArtwork(id) {
  return artworks.find((artwork) => artwork.id === id) ?? null
}

export function getFeaturedArtwork() {
  return artworks[0]
}

export function listDomains() {
  return domains
}

export function listEras() {
  return eras
}
