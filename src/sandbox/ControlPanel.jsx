import React from 'react'
import {
  AlertTriangle,
  Camera,
  Download,
  History,
  Lock,
  LockOpen,
  Redo2,
  RotateCcw,
  Undo2,
  Upload
} from 'lucide-react'

const EDGE_LABELS = { top: '上', right: '右', bottom: '下', left: '左' }

function Slider({ label, value, min, max, step, disabled, onChange, format }) {
  return (
    <label className={`param-row ${disabled ? 'is-disabled' : ''}`}>
      <span className="param-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ '--fill': ((value - min) / (max - min)) * 100 }}
      />
      <span className="param-value">{format ? format(value) : value}</span>
    </label>
  )
}

const pct = (digits = 0) => (v) => `${(v * 100).toFixed(digits)}%`

export default function ControlPanel({
  work,
  comp,
  locks,
  metrics,
  layers,
  selected,
  historyInfo,
  snapshots,
  arbitration,
  replaying,
  onParam,
  onInscriptionParam,
  onSealParam,
  onToggleLock,
  onToggleLayer,
  onUndo,
  onRedo,
  onReset,
  onSaveSnapshot,
  onApplySnapshot,
  onDeleteSnapshot,
  onExport,
  onImport,
  onExportReplay,
  onClearTrajectory
}) {
  const selectedSeal = selected?.kind === 'seal' ? comp.seals.find((s) => s.id === selected.id) : null
  const bodyLocked = locks.body

  return (
    <aside className="sandbox-panel">
      {/* 章法参数 */}
      <section className="panel-section">
        <h3>
          章法参数
          {bodyLocked && <span className="locked-hint"><Lock size={11} /> 正文已锁定</span>}
        </h3>
        <Slider label="字径" value={comp.fontSize} min={24} max={88} step={1} disabled={bodyLocked}
          onChange={(v) => onParam('fontSize', v, '字径', 'param-fontSize')} />
        <Slider label="字距" value={comp.charGap} min={0} max={1.4} step={0.02} disabled={bodyLocked}
          onChange={(v) => onParam('charGap', v, '字距', 'param-charGap')} format={pct()} />
        <Slider label="行距" value={comp.colGap} min={0.2} max={2.4} step={0.02} disabled={bodyLocked}
          onChange={(v) => onParam('colGap', v, '行距', 'param-colGap')} format={pct()} />
        <div className="param-subhead">留白边界</div>
        {[
          ['t', '上'],
          ['r', '右'],
          ['b', '下'],
          ['l', '左']
        ].map(([key, label]) => (
          <Slider key={key} label={label} value={comp.margins[key]} min={0} max={0.28} step={0.005}
            disabled={bodyLocked}
            onChange={(v) => onParam(`margins.${key}`, v, `留白·${label}`, `param-margin-${key}`)}
            format={pct()} />
        ))}
        <div className="param-subhead">落款</div>
        <Slider label="款字径" value={comp.inscription.scale} min={0.24} max={1} step={0.01}
          disabled={locks.inscription}
          onChange={(v) => onInscriptionParam('scale', v, '落款字径', 'param-insScale')} format={pct()} />
        {selectedSeal && (
          <>
            <div className="param-subhead">选中印章 · {selectedSeal.chars}</div>
            <Slider label="印面" value={selectedSeal.size} min={20} max={160} step={1}
              disabled={locks.seals[selectedSeal.id]}
              onChange={(v) => onSealParam(selectedSeal.id, 'size', v, '印面大小', `param-sealSize-${selectedSeal.id}`)} />
            <Slider label="印角" value={selectedSeal.rotation} min={-45} max={45} step={0.5}
              disabled={locks.seals[selectedSeal.id]}
              onChange={(v) => onSealParam(selectedSeal.id, 'rotation', v, '印章旋转', `param-sealRot-${selectedSeal.id}`)}
              format={(v) => `${v.toFixed(1)}°`} />
          </>
        )}
      </section>

      {/* 元素锁定 */}
      <section className="panel-section">
        <h3>局部锁定</h3>
        <div className="lock-list">
          <LockItem label="正文" locked={locks.body} onToggle={() => onToggleLock('body')} />
          <LockItem label="落款" locked={locks.inscription} onToggle={() => onToggleLock('inscription')} />
          {comp.seals.map((seal) => (
            <LockItem
              key={seal.id}
              label={`印·${seal.chars}`}
              locked={Boolean(locks.seals[seal.id])}
              onToggle={() => onToggleLock('seal', seal.id)}
            />
          ))}
        </div>
        <p className="panel-note">锁定的元素不参与拖动、捏合与滑杆调整；复原原帖不受锁定限制。</p>
      </section>

      {/* 实时读数 */}
      <section className="panel-section">
        <h3>实时读数</h3>
        <div className="balance-meter">
          <div className="balance-score">
            <b>{metrics.balanceScore}</b>
            <span>{metrics.balanceLabel}</span>
          </div>
          <div className="balance-bar">
            <i style={{ width: `${metrics.balanceScore}%` }} />
          </div>
        </div>
        <dl className="metric-list">
          <div>
            <dt>视觉重心</dt>
            <dd>
              ({pct(1)(metrics.centroid.nx)}, {pct(1)(metrics.centroid.ny)})
              <em>偏移 {pct(1)(metrics.deviation.dist)}</em>
            </dd>
          </div>
          <div>
            <dt>空白比例</dt>
            <dd>
              <span className="mini-bar"><i style={{ width: pct()(metrics.blankRatio) }} /></span>
              {pct(1)(metrics.blankRatio)}
            </dd>
          </div>
          <div>
            <dt>四边密度</dt>
            <dd className="edge-densities">
              {Object.entries(metrics.boundary).map(([edge, value]) => (
                <span key={edge} className={value > 0.5 ? 'is-hot' : ''}>
                  {EDGE_LABELS[edge]} {pct()(value)}
                </span>
              ))}
            </dd>
          </div>
        </dl>
        {metrics.warnings.length > 0 ? (
          <ul className="warning-list">
            {metrics.warnings.map((warning) => (
              <li key={warning.key} className={`level-${warning.level}`}>
                <AlertTriangle size={12} />
                {warning.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="all-clear">章法安稳，无预警。</p>
        )}
      </section>

      {/* 视图图层 */}
      <section className="panel-section">
        <h3>可视化图层</h3>
        <div className="layer-toggles">
          {[
            ['centroid', '视觉重心'],
            ['trajectory', '重心轨迹'],
            ['heatmap', '密度热力'],
            ['boundary', '边界密度'],
            ['margin', '留白边界'],
            ['jiugong', '九宫格']
          ].map(([key, label]) => (
            <button
              key={key}
              className={`layer-chip ${layers[key] ? 'active' : ''}`}
              onClick={() => onToggleLayer(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <button className="text-btn" onClick={onClearTrajectory}>清除轨迹</button>
      </section>

      {/* 历史 */}
      <section className="panel-section">
        <h3>
          <History size={13} /> 编辑历史
        </h3>
        <div className="history-row">
          <button className="tool-btn" onClick={onUndo} disabled={!historyInfo.canUndo}>
            <Undo2 size={14} /> 撤销
          </button>
          <button className="tool-btn" onClick={onRedo} disabled={!historyInfo.canRedo}>
            <Redo2 size={14} /> 重做
          </button>
          <span className="history-pos">
            {historyInfo.cursor + 1} / {historyInfo.total}
          </span>
        </div>
        <button className="tool-btn wide" onClick={onReset} disabled={replaying}>
          <RotateCcw size={14} /> 复原原帖章法
        </button>
      </section>

      {/* 快照与回放 */}
      <section className="panel-section">
        <h3>快照 · 回放</h3>
        <div className="history-row">
          <button className="tool-btn" onClick={onSaveSnapshot} disabled={replaying}>
            <Camera size={14} /> 存快照
          </button>
          <button className="tool-btn" onClick={onExport}>
            <Download size={14} /> 导出
          </button>
          <label className="tool-btn as-label">
            <Upload size={14} /> 导入
            <input type="file" accept="application/json,.json" hidden onChange={onImport} />
          </label>
        </div>
        <button className="tool-btn wide" onClick={onExportReplay} disabled={historyInfo.total < 2}>
          <Download size={14} /> 导出回放（{historyInfo.total} 帧）
        </button>
        {snapshots.length > 0 && (
          <ul className="snapshot-list">
            {snapshots.map((snap) => (
              <li key={snap.id}>
                <button className="snapshot-apply" onClick={() => onApplySnapshot(snap)} title="应用此快照">
                  {snap.name}
                </button>
                <button className="snapshot-delete" onClick={() => onDeleteSnapshot(snap.id)} aria-label="删除快照">
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 手势仲裁 */}
      <section className="panel-section">
        <h3>手势仲裁</h3>
        <p className="arbitration-log">{arbitration || '拖动元素排布墨阵；双指捏合缩放旋转；滚轮缩放视野。冲突时：双指优先，锁定最大。'}</p>
      </section>
    </aside>
  )
}

function LockItem({ label, locked, onToggle }) {
  return (
    <button className={`lock-item ${locked ? 'locked' : ''}`} onClick={onToggle}>
      {locked ? <Lock size={12} /> : <LockOpen size={12} />}
      {label}
    </button>
  )
}
