import React, { useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, Boxes, Check, GitCompare, ScanLine } from 'lucide-react'
import {
  techniques,
  getTechnique,
  buildTechniqueIndex,
  selectArtworksByTechnique,
  getDimensionRows,
  getTechniqueView
} from '../data/techniques'
import CompareViewer from './CompareViewer'
import { MissingText } from './common'
import { resolveArtworkImage } from '../lib/painting'

const STORAGE_KEY = 'cam-technique-compare'

/**
 * 表现技法比较（Compare Studio）
 * ----------------------------
 * 信息结构与画科馆刻意不同：
 *  - 画科馆按“画了什么”分人物 / 山水 / 花鸟 / 界画，每科一种陈列布局；
 *  - 这里按“怎么画”分工笔 / 写意 / 没骨，首页即一台双作品比较器，
 *    作品、局部热点、文字解释都随所选两种技法重新组合。
 *
 * 数据仍只存一份：技法 → 作品 ID 的索引由 buildTechniqueIndex 反向构建，
 * 组件不复制作品；一件兼工带写的作品可同时出现在两种技法中。
 */
export default function CompareStudio({ artworkRows, onOpen, statusMessage }) {
  const [selection, setSelection] = useState(loadSelection)

  const index = useMemo(() => buildTechniqueIndex(artworkRows), [artworkRows])
  const artworkById = useMemo(() => new Map(artworkRows.map((row) => [row.id, row])), [artworkRows])

  // 两侧所选技法（随技法改变重新组合作品）。
  const [leftId, rightId] = normalizePair(selection.techniques)
  const leftArtworks = useMemo(
    () => selectArtworksByTechnique(artworkRows, index, leftId, artworkById),
    [artworkRows, index, leftId, artworkById]
  )
  const rightArtworks = useMemo(
    () => selectArtworksByTechnique(artworkRows, index, rightId, artworkById),
    [artworkRows, index, rightId, artworkById]
  )

  // 当前两侧作品 ID：优先用户在该技法下的最近选择，回落该技法的首件代表作。
  const initialFor = (works, list) => (works && list.some((a) => a.id === works) ? works : (list[0]?.id ?? null))
  const [workChoice, setWorkChoice] = useState(() => ({
    [leftId]: initialFor(selection.works[leftId], leftArtworks),
    [rightId]: initialFor(selection.works[rightId], rightArtworks)
  }))
  const leftWorkId = workChoice[leftId] ?? leftArtworks[0]?.id ?? null
  const rightWorkId = workChoice[rightId] ?? rightArtworks[0]?.id ?? null

  // 数据刷新导致当前作品不再属于该技法时，回落到首件代表作。
  useEffect(() => {
    if (leftWorkId && !leftArtworks.some((a) => a.id === leftWorkId)) {
      setWorkChoice((s) => ({ ...s, [leftId]: leftArtworks[0]?.id ?? null }))
    }
  }, [leftArtworks, leftWorkId, leftId])
  useEffect(() => {
    if (rightWorkId && !rightArtworks.some((a) => a.id === rightWorkId)) {
      setWorkChoice((s) => ({ ...s, [rightId]: rightArtworks[0]?.id ?? null }))
    }
  }, [rightArtworks, rightWorkId, rightId])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ techniques: [leftId, rightId], works: workChoice }))
    } catch { /* private mode */ }
  }, [leftId, rightId, workChoice])

  // 两侧不能选同一技法：再次点到对侧技法时直接交换两槽。
  const pickTechnique = (slot, techniqueId) => {
    if (slot === 'left') {
      if (techniqueId === rightId) {
        setSelection((s) => ({ ...s, techniques: [rightId, leftId] }))
      } else {
        setSelection((s) => ({ ...s, techniques: [techniqueId, rightId] }))
      }
    } else if (techniqueId === leftId) {
      setSelection((s) => ({ ...s, techniques: [rightId, leftId] }))
    } else {
      setSelection((s) => ({ ...s, techniques: [leftId, techniqueId] }))
    }
  }

  const leftArtwork = artworkById.get(leftWorkId) ?? leftArtworks[0] ?? null
  const rightArtwork = artworkById.get(rightWorkId) ?? rightArtworks[0] ?? null
  const leftTechnique = getTechnique(leftId)
  const rightTechnique = getTechnique(rightId)

  const swap = () => setSelection((s) => ({ ...s, techniques: [rightId, leftId] }))

  const dimensions = useMemo(() => getDimensionRows(leftId, rightId), [leftId, rightId])

  if (!leftArtwork || !rightArtwork) {
    return (
      <section className="compare-section" id="compare">
        <CompareHead />
        <div className="empty-state">
          <Boxes size={26} />
          <h3>技法作品尚在编目</h3>
          <p>所选技法下暂无可比较的作品，数据回补后此比较器自动可用。</p>
        </div>
      </section>
    )
  }

  // 传给浏览器的是“技法语境下”的笔墨内容（同一件作品在不同技法中可给不同解释）。
  const leftView = getTechniqueView(leftArtwork, leftId)
  const rightView = getTechniqueView(rightArtwork, rightId)

  return (
    <section className="compare-section" id="compare">
      <CompareHead statusMessage={statusMessage} multiCount={index.multiTechnique.length} />

      {/* 技法选择：两个槽位 */}
      <div className="tech-picker">
        <TechniqueSlot
          slot="left" technique={leftTechnique} count={leftArtworks.length}
          onPick={(id) => pickTechnique('left', id)} otherId={rightId}
        />
        <button className="tech-swap" onClick={swap} aria-label="交换左右技法">
          <ArrowLeftRight size={18} />
        </button>
        <TechniqueSlot
          slot="right" technique={rightTechnique} count={rightArtworks.length}
          onPick={(id) => pickTechnique('right', id)} otherId={leftId}
        />
      </div>

      {/* 比较维度矩阵：“怎么画”的信息骨架 */}
      <DimensionMatrix rows={dimensions} left={leftTechnique} right={rightTechnique} />

      {/* 双作品同步浏览器 */}
      <div className="compare-stage-head">
        <div>
          <p className="compare-kicker"><ScanLine size={13} /> 同步细读 · 笔墨局部</p>
          <h3>同一支笔，两种动作。</h3>
        </div>
        <p className="compare-stage-hint">滚轮 / 双指捏合缩放，拖动平移；默认双画同步，可解开链接独立观察。</p>
      </div>

      <CompareViewer
        left={{
          artwork: leftArtwork,
          technique: { name: leftTechnique.name, accent: leftTechnique.accent, details: leftView.details }
        }}
        right={{
          artwork: rightArtwork,
          technique: { name: rightTechnique.name, accent: rightTechnique.accent, details: rightView.details }
        }}
      />

      {/* 代表作品随技法重新组合（不按画科陈列） */}
      <div className="rework-rails">
        <WorkRail
          technique={leftTechnique} artworks={leftArtworks} currentId={leftArtwork.id}
          onSelect={(id) => setWorkChoice((s) => ({ ...s, [leftId]: id }))} onOpen={onOpen}
        />
        <WorkRail
          technique={rightTechnique} artworks={rightArtworks} currentId={rightArtwork.id}
          onSelect={(id) => setWorkChoice((s) => ({ ...s, [rightId]: id }))} onOpen={onOpen}
        />
      </div>

      {/* 每件代表作的一句话笔墨判读（随所选作品更新） */}
      <div className="brush-verdicts">
        <BrushVerdict technique={leftTechnique} artwork={leftArtwork} brushNote={leftView.brushNote} />
        <BrushVerdict technique={rightTechnique} artwork={rightArtwork} brushNote={rightView.brushNote} />
      </div>
    </section>
  )
}

function CompareHead({ statusMessage, multiCount }) {
  return (
    <div className="compare-head">
      <div className="section-kicker"><span className="eyebrow-line" />表现技法 / BRUSH TECHNIQUES</div>
      <h2>不问画了什么，<i>只看怎么画。</i></h2>
      <p className="compare-lead">
        工笔以线立骨、三矾九染；写意以书入画、一笔成形；没骨不用墨线，直以彩色点染。
        选择两种技法，代表作品、笔墨局部与文字解释会重新组合，并在双画浏览器中同步放大对照。
      </p>
      <p className="compare-note">
        <GitCompare size={13} />
        技法与画科是两套平行关系：同一件作品可“兼工带写”，数据仍只存一份（库内 {multiCount ?? 0} 件跨技法作品）。
        {statusMessage ? <span className="compare-status">{statusMessage}</span> : null}
      </p>
    </div>
  )
}

function TechniqueSlot({ slot, technique, count, onPick, otherId }) {
  return (
    <div className={`tech-slot slot-${slot}`} style={{ ['--slot-accent']: technique.accent }}>
      <span className="tech-slot-tag">{slot === 'left' ? '左 · 技法一' : '右 · 技法二'}</span>
      <div className="tech-card-row">
        {techniques.map((option) => {
          const active = option.id === technique.id
          const disabled = option.id === otherId
          return (
            <button
              key={option.id}
              className={active ? 'tech-card active' : 'tech-card'}
              onClick={() => onPick(option.id)}
              aria-pressed={active}
              disabled={disabled && !active}
              title={disabled ? '已在另一侧选择，点击将交换两侧' : option.epithet}
            >
              <span className="tech-char">{option.char}</span>
              <span className="tech-card-copy">
                <b>{option.name}</b>
                <small>{option.pinyin}</small>
              </span>
              {active ? <Check size={15} className="tech-check" /> : null}
            </button>
          )
        })}
      </div>
      <div className="tech-slot-meta">
        <b>{technique.name}</b>
        <span>{technique.epithet}</span>
        <em>{count} 件代表作</em>
      </div>
      <p className="tech-slot-intro">{technique.intro}</p>
      <ul className="tech-methods">
        {technique.method.map((step) => <li key={step}>{step}</li>)}
      </ul>
      <p className="tech-watch">{technique.watch}</p>
    </div>
  )
}

function DimensionMatrix({ rows, left, right }) {
  return (
    <div className="dimension-matrix">
      <div className="dimension-row dimension-head-row">
        <span className="dimension-name">比较维度</span>
        <span className="dimension-side" style={{ ['--tech-accent']: left.accent }}>{left.name}</span>
        <span className="dimension-axis">谱系</span>
        <span className="dimension-side" style={{ ['--tech-accent']: right.accent }}>{right.name}</span>
      </div>
      {rows.map((row) => (
        <div className="dimension-row" key={row.id}>
          <span className="dimension-name"><b>{row.name}</b><small>{row.id}</small></span>
          <p className="dimension-cell">{row.left}</p>
          <span className="dimension-axis">{row.axis}</span>
          <p className="dimension-cell">{row.right}</p>
        </div>
      ))}
    </div>
  )
}

function WorkRail({ technique, artworks, currentId, onSelect, onOpen }) {
  return (
    <div className="work-rail" style={{ ['--tech-accent']: technique.accent }}>
      <div className="work-rail-head">
        <span className="work-rail-char">{technique.char}</span>
        <b>{technique.name} · 代表作</b>
        <em>{artworks.length} 件</em>
      </div>
      <div className="work-rail-track">
        {artworks.map((artwork) => {
          const active = artwork.id === currentId
          return (
            <article key={artwork.id} className={active ? 'work-chip active' : 'work-chip'}>
              <button className="work-chip-main" onClick={() => onSelect(artwork.id)} title="放入比较器">
                <span className="work-chip-thumb"><WorkThumb artwork={artwork} /></span>
                <span className="work-chip-copy">
                  <b>{artwork.title}</b>
                  <small>{artwork.dynasty ?? <MissingText>年代不详</MissingText>} · {artwork.artist ?? <MissingText>佚名</MissingText>}</small>
                </span>
              </button>
              <button className="work-chip-open" onClick={() => onOpen(artwork)} aria-label={`查看${artwork.title}详情`}>著录</button>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function WorkThumb({ artwork }) {
  // 缩略图直接解析图像（比较页作品数量少，无需懒加载观察器）。
  const src = resolveArtworkImage(artwork)
  if (!src) return <span className="work-thumb-missing">缺图</span>
  return <img src={src} alt="" draggable={false} loading="lazy" decoding="async" />
}

function BrushVerdict({ technique, artwork, brushNote }) {
  return (
    <figure className="brush-verdict" style={{ ['--tech-accent']: technique.accent }}>
      <figcaption>
        <span className="verdict-tech">{technique.name}</span>
        <cite>{artwork.title}</cite>
      </figcaption>
      <blockquote>{brushNote ?? <MissingText>笔墨判读待著录</MissingText>}</blockquote>
    </figure>
  )
}

/* ---------------- 选择状态 ---------------- */

function normalizePair(pair) {
  const [a, b] = pair ?? []
  const left = techniques.some((t) => t.id === a) ? a : 'gongbi'
  let right = techniques.some((t) => t.id === b) ? b : 'xieyi'
  if (right === left) right = techniques.find((t) => t.id !== left)?.id ?? 'mogu'
  return [left, right]
}

function loadSelection() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    const [l, r] = normalizePair(saved?.techniques)
    return {
      techniques: [l, r],
      works: saved?.works && typeof saved.works === 'object' ? saved.works : {}
    }
  } catch {
    return { techniques: ['gongbi', 'xieyi'], works: {} }
  }
}
