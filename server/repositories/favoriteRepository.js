import { readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dataDirectory = dirname(fileURLToPath(import.meta.url))
const storePath = join(dataDirectory, '../data/store.json')
let storeWriteQueue = Promise.resolve()

async function readStore() {
  try {
    const content = await readFile(storePath, 'utf8')
    const store = JSON.parse(content)
    return { favorites: store.favorites && typeof store.favorites === 'object' ? store.favorites : {} }
  } catch {
    return { favorites: {} }
  }
}

async function writeStore(store) {
  const temporaryPath = `${storePath}.tmp`
  await writeFile(temporaryPath, `${JSON.stringify(store, null, 2)}\n`, 'utf8')
  await rename(temporaryPath, storePath)
}

export async function listFavorites(visitorId) {
  const store = await readStore()
  return store.favorites[visitorId] ?? []
}

export function replaceFavorites(visitorId, artworkIds) {
  const task = storeWriteQueue.then(async () => {
    const store = await readStore()
    store.favorites[visitorId] = [...new Set(artworkIds)]
    await writeStore(store)
    return store.favorites[visitorId]
  })

  // Keep later writes available even if an earlier disk write fails.
  storeWriteQueue = task.catch(() => {})
  return task
}
