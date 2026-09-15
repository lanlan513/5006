import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Compass, Layers3, Ruler, TriangleAlert } from 'lucide-react'
import {
  compositions,
  getComposition,
  selectSpecimens,
  buildCompositionIndex,
  annotationKindLabel
} from '../data/compositions'
import SpecimenViewer from './SpecimenViewer'
import { resolveArtworkImage } from '../lib/painting'

const STORAGE_KEY = 'cam-composition-lab'

/**
 * 构图标本馆（Composition Lab）
 * ----------------------------
 * 第三套信息组织方式：画科回答「画了什么」，技法回答「怎么画」，
 * 这里回答「怎么经营位置」。每种构图法以作品为「标本」，
 * 点按关键区域后由辅助线 / 区域遮罩 / 视觉中心解释构图关系。
 *
 * 构图层与作品层分离：buildCompositionIndex 只校验标本持有的 artworkId，
 * 作品对象从 artworkRows 实时解析，同一件作品可被多种构图标本引用。
 */
export default function CompositionLab({ artworkRows, onOpen, statusMessage }) {
  const artworkById = useMemo(() => new Map(artworkRows.map((row) => [row.id, row])), [artworkRows])
  const index = useMemo(() => buildCompositionIndex(artworkRows), [artworkRows])

  const saved = loadPreference()
  const [compositionId, setCompositionId] = useState(saved.compositionId)
  const [specimenId, setSpecimenId] = useState(saved.specimenId)
  const [mode, setMode] = useState(saved.mode === 'original' ? 'original' : 'analysis')
  const [selectedId, setSelectedId] = useState(null)

  const composition = getComposition(compositionId) ?? compositions[0]
  const specimenList = useMemo(() => selectSpecimens(composition.id), [composition.id])

  // 当前标本：优先用户选择，否则该构法首件；引用作品缺失时自动跳过。
  const specimen = specimenList.find((item) => item.id === specimenId)
    ?? specimenList.find((item) => artworkById.has(item.artworkId))
    ?? specimenList[0]
  const artwork = specimen ? artworkById.get(specimen.artworkId) : null

  useEffect(() => {
    if (!specimenList.some((item) => item.id === specimenId)) {
      setSpecimenId(specimenList[0]?.id ?? null)
    }
  }, [compositionId, specimenList, specimenId])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ compositionId, specimenId, mode }))
    } catch { /* private mode */ }
  }, [compositionId, specimenId, mode])

  const pickComposition = (id) => {
    setCompositionId(id)
    const first = selectSpecimens(id)[0]
    setSpecimenId(first?.id ?? null)
    setSelectedId(null)
  }

  const otherSpecimens = specimenList.filter((item) => item.id !== specimen?.id)
  const annotationKinds = specimen
    ? [...new Set(specimen.annotations.map((annotation) => annotation.kind))]
    : []

  return (
    <section className="comp-section" id="composition">
      <div className="compare-head comp-head">
        <div className="section-kicker"><span className="eyebrow-line" />视觉标本库 / COMPOSITION SPECIMENS</div>
        <h2>不画什么，<i>先经营位置。</i></h2>
        <p className="compare-lead">
          散点透视让视点随长卷行走，留白以虚当实，三远法把仰视、窥入、旷望收进一幅立轴，
          对角与 S 形动势则给画面埋下看不见的力。每种构图法选取作品标本，切到「分析模式」后
          点按关键区域，辅助线、区域遮罩与视觉中心会逐处解释它们的位置关系。
        </p>
        <p className="compare-note">
          <Compass size={13} />
          标注坐标全部使用图片自身的归一化坐标系，与 SVG 标注层分离——缩放、平移、窗口变化后仍精确贴合。
          {statusMessage ? <span className="compare-status">{statusMessage}</span> : null}
        </p>
      </div>

      {/* 构图法选择 */}
      <div className="comp-tabs" role="tablist">
        {compositions.map((item) => {
          const active = item.id === composition.id
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={active}
              className={active ? 'comp-tab active' : 'comp-tab'}
              style={{ ['--comp-accent']: item.accent }}
              onClick={() => pickComposition(item.id)}
            >
              <span className="comp-tab-char">{item.char}</span>
              <span className="comp-tab-copy">
                <b>{item.name}</b>
                <small>{item.pinyin}</small>
              </span>
              <span className="comp-tab-count">{index.specimenCounts[item.id] ?? 0}</span>
            </button>
          )
        })}
      </div>

      {/* 当前构法说明 */}
      <article className="comp-method" style={{ ['--comp-accent']: composition.accent }}>
        <header className="comp-method-head">
          <span className="comp-method-char">{composition.char}</span>
          <div>
            <p className="comp-method-epithet">{composition.epithet}</p>
            <h3>{composition.name}</h3>
          </div>
          <Layers3 className="comp-method-icon" size={20} />
        </header>
        <p className="comp-method-intro">{composition.intro}</p>
        <ul className="comp-principles">
          {composition.principles.map((principle) => (
            <li key={principle}><CheckCircle2 size={13} /> {principle}</li>
          ))}
        </ul>
        <p className="comp-watch"><Ruler size={13} /> 观看提示：{composition.watch}</p>
      </article>

      {!specimen || !artwork ? (
        <div className="empty-state">
          <TriangleAlert size={26} />
          <h3>标本尚在编目</h3>
          <p>该构图法下的作品标本引用暂不可用，数据回补后自动出现。</p>
        </div>
      ) : (
        <div className="comp-lab-grid">
          {/* 左：标本浏览器 */}
          <div className="comp-lab-main">
            <SpecimenViewer
              specimen={specimen}
              artwork={artwork}
              mode={mode}
              onModeChange={setMode}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            <div className="spec-title-row">
              <div>
                <h4>{artwork.title}</h4>
                <p>{artwork.artist ?? '佚名'} · {artwork.dynasty ?? '年代不详'} · {artwork.medium}</p>
              </div>
              {onOpen ? <button className="spec-record-btn" onClick={() => onOpen(artwork)}>完整著录</button> : null}
            </div>
            <blockquote className="spec-thesis">「{specimen.thesis}」</blockquote>
          </div>

          {/* 右：标注清单（数量随标本而变） */}
          <aside className="comp-side">
            <div className="comp-side-head">
              <span>关键区域 · {specimen.annotations.length} 处</span>
              <em>{annotationKinds.map(annotationKindLabel).join(' / ')}</em>
            </div>
            <ol className="annotation-list">
              {specimen.annotations.map((annotation, i) => {
                const active = selectedId === annotation.id
                return (
                  <li key={annotation.id}>
                    <button
                      className={active ? 'annotation-item is-active' : 'annotation-item'}
                      onClick={() => {
                        setSelectedId(annotation.id)
                        if (mode !== 'analysis') setMode('analysis')
                      }}
                    >
                      <span className="annotation-index">{String(i + 1).padStart(2, '0')}</span>
                      <span className="annotation-copy">
                        <b>{annotation.label}</b>
                        <small>{annotationKindLabel(annotation.kind)} · {annotation.shape}</small>
                      </span>
                      {active ? <CheckCircle2 size={15} className="annotation-check" /> : null}
                    </button>
                    {active ? <p className="annotation-text">{annotation.text}</p> : null}
                  </li>
                )
              })}
            </ol>
            <p className="comp-side-note">
              各标本标注数量与形状并不固定（本馆 {Math.min(...index.annotationCounts)}–{Math.max(...index.annotationCounts)} 处不等），
              依构图需要给出辅助线、遮罩或视觉中心。
            </p>

            {otherSpecimens.length ? (
              <div className="other-specimens">
                <p className="other-specimens-title">同法标本（{specimenList.length}）</p>
                {specimenList.map((item) => {
                  const other = artworkById.get(item.artworkId)
                  if (!other) return null
                  const active = item.id === specimen.id
                  return (
                    <button
                      key={item.id}
                      className={active ? 'spec-mini is-active' : 'spec-mini'}
                      onClick={() => { setSpecimenId(item.id); setSelectedId(null) }}
                    >
                      <span className="spec-mini-thumb">
                        {resolveArtworkImage(other)
                          ? <img src={resolveArtworkImage(other)} alt="" draggable={false} />
                          : <span>缺图</span>}
                      </span>
                      <span className="spec-mini-copy">
                        <b>{other.title}</b>
                        <small>{other.dynasty ?? '年代不详'} · {item.annotations.length} 处标注</small>
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : null}
          </aside>
        </div>
      )}

      {index.warnings.length ? (
        <p className="comp-warn"><TriangleAlert size={13} /> {index.warnings.length} 条标本数据告警（见数据校验）。</p>
      ) : null}
    </section>
  )
}

function loadPreference() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}
