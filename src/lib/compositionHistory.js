// 章法编辑历史：撤销 / 重做 / 合并提交 / 序列化快照与回放文件。
//
// 历史条目即「二维编辑状态的快照」——章法参数是一个纯数据对象，
// 每次提交完整入栈，因此撤销、回放、导出都只是栈上的移动与读取。

const MERGE_WINDOW_MS = 900
const MAX_ENTRIES = 120

export function createHistory(initial, label = '初始章法') {
  return {
    entries: [initial],
    labels: [label],
    cursor: 0,
    lastTime: 0,
    mergeKey: null
  }
}

/** 覆盖当前帧（拖拽过程中的实时更新，不产生新历史）。 */
export function live(history, state) {
  const entries = history.entries.slice()
  entries[history.cursor] = state
  return { ...history, entries }
}

/**
 * 提交一帧。mergeKey 相同的连续提交（如同一次拖动、同一滑杆的连续调整）
 * 在时间窗内合并为一帧，避免历史被拖拽刷屏。
 */
export function commit(history, state, label, mergeKey = null) {
  const now = Date.now()
  const canMerge =
    mergeKey &&
    history.mergeKey === mergeKey &&
    history.cursor === history.entries.length - 1 &&
    now - history.lastTime < MERGE_WINDOW_MS
  if (canMerge) {
    const entries = history.entries.slice()
    entries[history.cursor] = state
    return { ...history, entries, lastTime: now }
  }
  let entries = history.entries.slice(0, history.cursor + 1)
  let labels = history.labels.slice(0, history.cursor + 1)
  entries.push(state)
  labels.push(label)
  if (entries.length > MAX_ENTRIES) {
    entries = entries.slice(entries.length - MAX_ENTRIES)
    labels = labels.slice(labels.length - MAX_ENTRIES)
  }
  return { entries, labels, cursor: entries.length - 1, lastTime: now, mergeKey }
}

export const canUndo = (history) => history.cursor > 0
export const canRedo = (history) => history.cursor < history.entries.length - 1

export function undo(history) {
  return canUndo(history) ? { ...history, cursor: history.cursor - 1, mergeKey: null } : history
}

export function redo(history) {
  return canRedo(history) ? { ...history, cursor: history.cursor + 1, mergeKey: null } : history
}

export function gotoFrame(history, index) {
  const cursor = Math.max(0, Math.min(history.entries.length - 1, index))
  return { ...history, cursor, mergeKey: null }
}

/* ---------- 序列化：快照与回放 ---------- */

const FORMAT = 'zhangfa-sandbox'

/** 当前章法状态 → 可下载的快照对象 */
export function serializeState(workId, state) {
  return {
    app: FORMAT,
    kind: 'snapshot',
    version: 1,
    workId,
    savedAt: Date.now(),
    state
  }
}

/** 整段编辑历史 → 可回放的帧序列 */
export function serializeReplay(workId, history) {
  return {
    app: FORMAT,
    kind: 'replay',
    version: 1,
    workId,
    savedAt: Date.now(),
    frames: history.entries,
    labels: history.labels
  }
}

/**
 * 解析导入的 JSON。返回 { kind, workId, state? , frames?, labels? }，非法输入抛错。
 * 只校验结构，不校验数值范围 —— 数值清洗由 sanitizeComp 完成。
 */
export function parseSerialized(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('文件不是合法的 JSON。')
  }
  if (!data || data.app !== FORMAT || data.version !== 1) {
    throw new Error('文件格式不属于本沙盘（或版本不符）。')
  }
  if (data.kind === 'snapshot' && data.state && typeof data.state === 'object') {
    return { kind: 'snapshot', workId: data.workId, state: data.state }
  }
  if (data.kind === 'replay' && Array.isArray(data.frames) && data.frames.length > 0) {
    return { kind: 'replay', workId: data.workId, frames: data.frames, labels: data.labels || [] }
  }
  throw new Error('文件内容不完整：缺少章法状态或回放帧。')
}
