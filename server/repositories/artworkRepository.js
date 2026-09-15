import { artworks, domains, eras, getArtwork } from '../../src/data/museumData.js'
import { buildTaxonomy, subjectIds, subjects } from '../../src/data/taxonomy.js'
import { buildTechniqueIndex, techniqueIds, techniques } from '../../src/data/techniques.js'
import { buildCompositionIndex, compositions, specimens } from '../../src/data/compositions.js'

function includesQuery(artwork, query) {
  const normalizedQuery = query.trim().toLocaleLowerCase('zh-CN')
  if (!normalizedQuery) return true

  return [
    artwork.title,
    artwork.artist,
    artwork.dynasty,
    artwork.year,
    artwork.domain,
    artwork.medium,
    artwork.location,
    artwork.matter,
    artwork.composition,
    artwork.focus,
    artwork.summary,
    ...(artwork.tags ?? [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('zh-CN')
    .includes(normalizedQuery)
}

export function listArtworks({ domain = '全部', query = '', subjectId = null } = {}) {
  return artworks.filter((artwork) =>
    (domain === '全部' || artwork.domain === domain)
    && (!subjectId || (artwork.subjectIds ?? []).includes(subjectId))
    && includesQuery(artwork, query)
  )
}

export function findArtwork(id) {
  return getArtwork(id)
}

export function getFeaturedArtwork() {
  return artworks.find((item) => item.id === 'thousand-li') ?? artworks[0]
}

export function listDomains() {
  return domains
}

export function listEras() {
  return eras
}

export function listSubjects() {
  return subjects
}

export function getTaxonomyView() {
  const taxonomy = buildTaxonomy(artworks)
  // 仅把可序列化的索引数据交给前端：作品对象从不复制进分类。
  const idsBySubject = Object.fromEntries(
    subjectIds.map((id) => [id, taxonomy.idsBySubject.get(id)])
  )
  return {
    subjects,
    taxonomy: {
      idsBySubject,
      counts: taxonomy.counts,
      warnings: taxonomy.warnings,
      multiClassified: taxonomy.multiClassified,
      totalArtworks: taxonomy.totalArtworks
    }
  }
}

/** 表现技法分类视图：与画科分类同构，索引只下发作品 ID，作品对象不复制。 */
export function getTechniqueView() {
  const index = buildTechniqueIndex(artworks)
  const idsByTechnique = Object.fromEntries(
    techniqueIds.map((id) => [id, index.idsByTechnique.get(id)])
  )
  return {
    techniques,
    index: {
      idsByTechnique,
      counts: index.counts,
      warnings: index.warnings,
      multiTechnique: index.multiTechnique,
      totalTagged: index.totalTagged
    }
  }
}

export function listTechniques() {
  return techniques
}

/** 构图法标本视图：下发构法元数据、标本（含归一化标注）与索引计数，作品仍不复制。 */
export function getCompositionView() {
  const index = buildCompositionIndex(artworks)
  const idsByComposition = Object.fromEntries(
    compositions.map((item) => [item.id, index.idsByComposition.get(item.id)])
  )
  return {
    compositions,
    specimens,
    index: {
      idsByComposition,
      specimenCounts: index.specimenCounts,
      annotationCounts: index.annotationCounts,
      warnings: index.warnings
    }
  }
}
