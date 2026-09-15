import { memo, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight, CornerDownRight, GitBranch, Layers, Users } from 'lucide-react'
import { getNode, nodeTypes, peopleOfTurningPoint, treeStats, turningPoints } from '../data/conceptGraph'
import './conceptChain.css'

// ------------------------------------------------------------------
// 布局与性能策略（针对「展开层级过深」）：
// 1. 归一化数据：节点只存 id，渲染时通过 getNode 查询，避免深层 props 传递。
// 2. 懒挂载：未展开的原因子树不渲染（不是 display:none，而是不生成 DOM）。
// 3. 默认展开深度 AUTO_DEPTH=2，更深层折叠为「+N 条深层原因」按钮按需展开。
// 4. 深度 ≥ STRIP_DEPTH 时，从缩进树切换为横向「路径条」布局，
//    避免无限缩进把内容挤压到过窄（移动端尤其明显）。
// 5. 树节点组件 memo 化；展开状态集中在一个 Set 中，键为路径定位串。
// 6. CSS content-visibility:auto 让屏外子树跳过布局与绘制。
// ------------------------------------------------------------------

const AUTO_DEPTH = 2
const STRIP_DEPTH = 4

const countDescendants = (node) => (node.causes || []).reduce((sum, child) => sum + 1 + countDescendants(child), 0)

function NodeChip({ id, relation }) {
  const node = getNode(id)
  const type = nodeTypes[node.type] || nodeTypes.concept
  return (
    <span className="cc-chip" style={{ '--chip-color': type.color }} title={node.summary}>
      <i>{type.label}</i>
      {relation && <em>{relation}</em>}
      <b>{node.name}</b>
    </span>
  )
}

// —— 深层路径条：深度超限后，子树拍平为横向卡片条，纵向缩进终止 ——
// 每个卡片仍可继续展开（递归回到 CauseNode，因深度仍超限而保持条带模式），
// 这样任意深的树都只占固定行高，横向滚动浏览。
const CauseStrip = memo(function CauseStrip({ causes, depth, pathKey, expanded, onToggle }) {
  return (
    <div className="cc-strip" role="list" aria-label="深层原因链">
      {causes.map((item, index) => {
        const key = `${pathKey}.${index}`
        const itemNode = getNode(item.node)
        const children = item.causes || []
        const isOpen = expanded.has(key)
        return (
          <div className="cc-strip-item" role="listitem" key={key}>
            <span className="cc-strip-depth">第 {depth} 层</span>
            <b>{itemNode.name}</b>
            <p>{item.note}</p>
            {children.length > 0 && (
              isOpen ? (
                <>
                  <button className="cc-more" onClick={() => onToggle(key)}><ChevronDown size={13} /> 收起</button>
                  <CauseStrip causes={children} depth={depth + 1} pathKey={`${key}s`} expanded={expanded} onToggle={onToggle} />
                </>
              ) : (
                <button className="cc-more" onClick={() => onToggle(key)}>
                  <ChevronRight size={13} /> {countDescendants(item)} 条更深层原因
                </button>
              )
            )}
          </div>
        )
      })}
    </div>
  )
})

// —— 原因树节点：递归渲染，受控展开 ——
const CauseNode = memo(function CauseNode({ node, depth, pathKey, expanded, onToggle }) {
  const causes = node.causes || []
  const isOpen = expanded.has(pathKey)
  const autoVisible = depth <= AUTO_DEPTH
  const hiddenCount = countDescendants(node)
  const nodeInfo = getNode(node.node)

  // 深度超限：切换为横向路径条，终止纵向缩进
  if (depth >= STRIP_DEPTH && causes.length > 0) {
    return (
      <div className="cc-cause cc-cause-strip-mode">
        <CauseCard node={node} nodeInfo={nodeInfo} depth={depth} />
        {isOpen || autoVisible ? (
          <CauseStrip causes={causes} depth={depth + 1} pathKey={`${pathKey}s`} expanded={expanded} onToggle={onToggle} />
        ) : (
          <button className="cc-more" onClick={() => onToggle(pathKey)}>
            <ChevronRight size={13} /> 展开更深的 {hiddenCount} 条原因
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="cc-cause" style={{ '--depth': Math.min(depth, 6) }}>
      <CauseCard node={node} nodeInfo={nodeInfo} depth={depth} />
      {causes.length > 0 && (
        autoVisible || isOpen ? (
          <div className="cc-children">
            {causes.map((child, index) => (
              <CauseNode key={`${pathKey}.${index}`} node={child} depth={depth + 1} pathKey={`${pathKey}.${index}`} expanded={expanded} onToggle={onToggle} />
            ))}
          </div>
        ) : (
          <button className="cc-more" onClick={() => onToggle(pathKey)}>
            <ChevronRight size={13} /> {hiddenCount} 条深层原因
          </button>
        )
      )}
    </div>
  )
})

function CauseCard({ node, nodeInfo, depth }) {
  const type = nodeTypes[nodeInfo.type] || nodeTypes.concept
  return (
    <div className="cc-cause-card" style={{ '--chip-color': type.color }}>
      <div className="cc-cause-head">
        <span className="cc-cause-type">{type.label}</span>
        <b>{nodeInfo.name}</b>
        {nodeInfo.years && <span className="cc-cause-years">{nodeInfo.years}</span>}
        <span className="cc-cause-depth">L{depth}</span>
      </div>
      <p>{node.note}</p>
      {nodeInfo.summary && <p className="cc-cause-summary">{nodeInfo.summary}</p>}
    </div>
  )
}

// —— 单条解释路径 ——
function PathPanel({ path, expanded, onToggle }) {
  const stats = useMemo(() => treeStats(path.root), [path])
  return (
    <div className="cc-path">
      <div className="cc-path-meta">
        <span><GitBranch size={13} /> {stats.count} 个关联节点</span>
        <span><Layers size={13} /> 最深 {stats.maxDepth} 层</span>
        {stats.maxDepth > STRIP_DEPTH - 1 && <span className="cc-path-hint">超深层级已切换为横向路径条</span>}
      </div>
      <CauseNode node={path.root} depth={1} pathKey={path.id} expanded={expanded} onToggle={onToggle} />
      {path.altRoots && (
        <div className="cc-alt-roots">
          <div className="cc-alt-label"><CornerDownRight size={13} /> 同期的另一条线索</div>
          {path.altRoots.map((alt, index) => (
            <CauseNode key={`${path.id}-alt${index}`} node={alt} depth={1} pathKey={`${path.id}-alt${index}`} expanded={expanded} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  )
}

// —— 前后观念对照栏 ——
function ConceptColumn({ title, conceptIds, works, side }) {
  return (
    <div className={`cc-column cc-column-${side}`}>
      <div className="cc-column-title"><span>{side === 'before' ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}</span>{title}</div>
      <div className="cc-concepts">
        {conceptIds.map((id) => {
          const node = getNode(id)
          return (
            <div className="cc-concept" key={id}>
              <b>{node.name}</b>
              <span>{node.years}</span>
              <p>{node.summary}</p>
            </div>
          )
        })}
      </div>
      <div className="cc-works">
        <div className="cc-works-label">代表作品</div>
        {works.map((work) => (
          <div className="cc-work" key={work.title}>
            <b>{work.title}</b>
            <span>{work.artist}</span>
            <p>{work.note}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ConceptChain() {
  const [activeId, setActiveId] = useState(turningPoints[1].id)
  const [activePathId, setActivePathId] = useState(null)
  const [expanded, setExpanded] = useState(() => new Set())

  const active = turningPoints.find((tp) => tp.id === activeId)
  const people = useMemo(() => peopleOfTurningPoint(active), [active])
  const trigger = getNode(active.trigger)
  const currentPath = active.paths.find((p) => p.id === activePathId) || active.paths[0]

  const toggle = (key) => setExpanded((prev) => {
    const next = new Set(prev)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return next
  })

  const selectTurningPoint = (id) => {
    setActiveId(id)
    setActivePathId(null)
    setExpanded(new Set())
  }

  return (
    <section className="cc" id="concept-chain">
      <div className="cc-inner">
        <header className="cc-head">
          <div>
            <div className="section-kicker">/ 观念关系链</div>
            <h2>近现代美术观念，<i>不是一条直线。</i></h2>
          </div>
          <p className="cc-head-note">点击转折点，对照此前与此后的观念；每个转折点都可沿多条解释路径向下追问，而非单一时间线。</p>
        </header>

        {/* 关系链：转折点导航 */}
        <div className="cc-chain" role="tablist" aria-label="观念转折点">
          {turningPoints.map((tp, index) => (
            <div className="cc-chain-item" key={tp.id}>
              {index > 0 && <span className="cc-chain-link" aria-hidden="true" />}
              <button
                className={tp.id === activeId ? 'cc-chain-node active' : 'cc-chain-node'}
                onClick={() => selectTurningPoint(tp.id)}
                role="tab"
                aria-selected={tp.id === activeId}
              >
                <span className="cc-chain-year">{tp.year}</span>
                <b>{tp.name}</b>
              </button>
            </div>
          ))}
        </div>

        {/* 前后对照 */}
        <div className="cc-compare" key={active.id}>
          <ConceptColumn title="此前观念" conceptIds={active.before} works={active.worksBefore} side="before" />
          <div className="cc-pivot">
            <span className="cc-pivot-year">{active.year}</span>
            <h3>{active.name}</h3>
            <div className="cc-pivot-trigger">
              <span>触发事件</span>
              <NodeChip id={active.trigger} />
              <p>{trigger.summary}</p>
            </div>
            <div className="cc-pivot-people">
              <span><Users size={12} /> 关系网中的人物</span>
              <div>{people.map((person) => <NodeChip key={person.id} id={person.id} relation={person.relation} />)}</div>
            </div>
          </div>
          <ConceptColumn title="此后观念" conceptIds={active.after} works={active.worksAfter} side="after" />
        </div>

        {/* 多解释路径 */}
        <div className="cc-paths">
          <div className="cc-paths-head">
            <span className="cc-paths-title">为什么会发生这一转向？<em>（{active.paths.length} 条解释路径，可独立展开）</em></span>
            <div className="cc-path-tabs" role="tablist" aria-label="解释路径">
              {active.paths.map((path) => (
                <button
                  key={path.id}
                  className={path.id === currentPath.id ? 'cc-path-tab active' : 'cc-path-tab'}
                  onClick={() => setActivePathId(path.id)}
                  role="tab"
                  aria-selected={path.id === currentPath.id}
                >
                  {path.label}
                </button>
              ))}
            </div>
          </div>
          <p className="cc-path-summary">{currentPath.summary}</p>
          <PathPanel key={`${active.id}:${currentPath.id}`} path={currentPath} expanded={expanded} onToggle={toggle} />
        </div>
      </div>
    </section>
  )
}
