// 字形解析层：把「一个输入字」解析为「五个书体格子」的视图模型。
//
// 三种来源：
// 1. 考据条目（glyphData.js）：有注记、有明确的 display 字形与缺样原因。
// 2. 字库自动条目：输入字不在考据库中，但字库收录 —— 仅渲染，不编造注记。
// 3. 缺样：字库未收录或条目明确标记缺失 —— 如实留缺。

import { SCRIPTS } from '../data/scripts'
import { ALIAS_INDEX } from '../data/glyphData'
import { hasGlyph } from './fonts'

const CJK_PATTERN = /[㐀-䶿一-鿿豈-﫿]/

export function isCJKChar(value) {
  return typeof value === 'string' && [...value].length === 1 && CJK_PATTERN.test(value)
}

/** 从输入框文本中提取最后一个有效的汉字 */
export function extractChar(text) {
  const chars = [...(text || '')].filter((ch) => CJK_PATTERN.test(ch))
  return chars.length ? chars[chars.length - 1] : ''
}

export function findEntry(char) {
  return ALIAS_INDEX.get(char) || null
}

/**
 * 为一个字构建五个书体格子的视图模型。
 * @param {string} char 输入字
 * @returns {{ char: string, curated: boolean, entry: object|null, cells: Array }}
 */
export function buildGlyphModel(char) {
  const entry = findEntry(char)
  const cells = SCRIPTS.map((script) => {
    if (entry) {
      const form = entry.forms[script.id]
      if (!form || form.missing) {
        return {
          scriptId: script.id,
          state: 'missing',
          reason: form?.missing || '暂无可靠样本，留缺不补。',
          curated: true
        }
      }
      if (!hasGlyph(script.fontId, form.display)) {
        return {
          scriptId: script.id,
          state: 'missing',
          reason: `字库未收录「${form.display}」。`,
          curated: true
        }
      }
      return {
        scriptId: script.id,
        state: 'ready',
        display: form.display,
        note: form.note,
        tags: form.tags || [],
        curated: true
      }
    }
    // 非考据字：只按字库覆盖渲染，不编造注记。
    if (hasGlyph(script.fontId, char)) {
      return { scriptId: script.id, state: 'ready', display: char, auto: true }
    }
    return {
      scriptId: script.id,
      state: 'missing',
      reason: '字库未收录该字。',
      auto: true
    }
  })
  return { char, curated: Boolean(entry), entry, cells }
}
