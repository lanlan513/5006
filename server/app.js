import express from 'express'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findArtwork, getFeaturedArtwork, listArtworks, listDomains, listEras } from './repositories/artworkRepository.js'
import { listFavorites, replaceFavorites } from './repositories/favoriteRepository.js'

const app = express()
const port = Number(process.env.PORT) || 3018
const projectDirectory = join(dirname(fileURLToPath(import.meta.url)), '..')
const allowedDomains = new Set(listDomains())

app.use(express.json({ limit: '20kb' }))

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.get('/api/artworks', (request, response) => {
  const domain = typeof request.query.domain === 'string' && allowedDomains.has(request.query.domain) ? request.query.domain : '全部'
  const query = typeof request.query.query === 'string' ? request.query.query.slice(0, 80) : ''
  response.json({ data: listArtworks({ domain, query }) })
})

app.get('/api/artworks/featured', (_request, response) => {
  response.json({ data: getFeaturedArtwork() })
})

app.get('/api/artworks/:id', (request, response) => {
  const artwork = findArtwork(request.params.id)
  if (!artwork) return response.status(404).json({ error: 'ARTWORK_NOT_FOUND', message: '未找到该作品。' })
  return response.json({ data: artwork })
})

app.get('/api/domains', (_request, response) => {
  response.json({ data: listDomains() })
})

app.get('/api/eras', (_request, response) => {
  response.json({ data: listEras() })
})

app.get('/api/favorites', async (request, response, next) => {
  try {
    const visitorId = readVisitorId(request)
    response.json({ data: await listFavorites(visitorId) })
  } catch (error) {
    next(error)
  }
})

app.put('/api/favorites', async (request, response, next) => {
  try {
    const visitorId = readVisitorId(request)
    const artworkIds = Array.isArray(request.body?.artworkIds) ? request.body.artworkIds : null
    if (!artworkIds || artworkIds.length > 100 || artworkIds.some((id) => typeof id !== 'string' || !findArtwork(id))) {
      return response.status(400).json({ error: 'INVALID_FAVORITES', message: '收藏数据无效。' })
    }
    return response.json({ data: await replaceFavorites(visitorId, artworkIds) })
  } catch (error) {
    return next(error)
  }
})

app.use(express.static(join(projectDirectory, 'dist')))
app.get('/{*splat}', (_request, response) => {
  response.sendFile(join(projectDirectory, 'dist/index.html'), (error) => {
    if (error?.code === 'ENOENT') response.status(503).send('前端尚未构建，请先执行 npm run build。')
  })
})

app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(error.status || 500).json({
    error: error.status ? 'INVALID_REQUEST' : 'INTERNAL_ERROR',
    message: error.status ? '请求参数无效。' : '服务暂时不可用。'
  })
})

function readVisitorId(request) {
  const visitorId = request.header('x-visitor-id')
  if (!visitorId || !/^[a-z0-9-]{12,80}$/i.test(visitorId)) {
    const error = new Error('Missing or invalid visitor id')
    error.status = 400
    throw error
  }
  return visitorId
}

app.listen(port, () => {
  console.log(`中国美术数字研究馆 API 正在运行：http://localhost:${port}`)
})
