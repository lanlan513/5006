// 手势仲裁器：把原始指针事件分类成语义手势，并在冲突时仲裁。
//
// 手势集合：单指拖动元素 / 单指平移视野（纸面空白处）/ 双指捏合缩放旋转
// （落在同一元素上则变换该元素，否则变换视野）/ 滚轮缩放视野。
//
// 仲裁规则（先到先得，双指优先）：
// 1. 锁定的元素拒绝一切手势（锁定 > 任何指针）。
// 2. 单指按下后先进入「触探」，越过位移阈值才升级为拖动 —— 轻点不会误移元素。
// 3. 拖动进行中落下第二指：拖动立即取消（状态回滚），让位于捏合 —— 双指优先。
// 4. 捏合中抬起一指：以剩余手指为基准重新起算拖动，不跳变。
// 5. 第三指及以后一律忽略（前两指赢得仲裁）。
// 6. 滚轮始终作用于视野，与指针手势互不干扰。

const SLOP_PX = 6

export class GestureArbiter {
  /**
   * @param {HTMLElement} el 监听手势的容器
   * @param {object} hooks
   *   hitTest(event) → { kind:'seal'|'inscription'|'body'|'paper', id?, locked? }
   *   onMode(mode, reason)            手势模式变化（用于界面仲裁指示）
   *   onTap(hit)
   *   onDragStart(hit) / onDrag({dx,dy}) / onDragEnd() / onDragCancel()
   *   onTransformStart(target) / onTransform({scale,rotation}) / onTransformEnd()
   *   onViewPan({dx,dy}) / onViewPanEnd()
   *   onViewZoom({delta,x,y})
   *   onReject(reason, hit)
   */
  constructor(el, hooks) {
    this.el = el
    this.hooks = hooks
    this.pointers = new Map()
    this.mode = 'idle'
    this.enabled = true
    this.startHit = null
    this.startPos = null
    this.lastPos = null
    this.transformBase = null
    this.transformTarget = null

    this.onPointerDown = this.onPointerDown.bind(this)
    this.onPointerMove = this.onPointerMove.bind(this)
    this.onPointerUp = this.onPointerUp.bind(this)
    this.onWheel = this.onWheel.bind(this)

    el.addEventListener('pointerdown', this.onPointerDown)
    el.addEventListener('wheel', this.onWheel, { passive: false })
    el.style.touchAction = 'none'
  }

  destroy() {
    this.el.removeEventListener('pointerdown', this.onPointerDown)
    this.el.removeEventListener('wheel', this.onWheel)
    this.detachWindow()
  }

  attachWindow() {
    window.addEventListener('pointermove', this.onPointerMove)
    window.addEventListener('pointerup', this.onPointerUp)
    window.addEventListener('pointercancel', this.onPointerUp)
  }

  detachWindow() {
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerup', this.onPointerUp)
    window.removeEventListener('pointercancel', this.onPointerUp)
  }

  setMode(mode, reason) {
    if (this.mode === mode) return
    this.mode = mode
    this.hooks.onMode?.(mode, reason)
  }

  onPointerDown(event) {
    if (!this.enabled) return
    if (event.button !== undefined && event.button !== 0) return
    const hit = this.hooks.hitTest?.(event) || { kind: 'paper' }
    if (hit.locked) {
      // 仲裁：锁定优先于一切手势。
      this.hooks.onReject?.('locked', hit)
      return
    }
    if (this.pointers.size >= 2) {
      // 仲裁：第三指被忽略。
      this.hooks.onReject?.('extra-pointer', hit)
      return
    }
    try {
      this.el.setPointerCapture(event.pointerId)
    } catch {
      // 某些环境下捕获失败不影响手势继续。
    }
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, hit })
    this.attachWindow()

    if (this.pointers.size === 1) {
      this.startHit = hit
      this.startPos = { x: event.clientX, y: event.clientY }
      this.lastPos = this.startPos
      this.setMode('pending', 'touch')
    } else if (this.pointers.size === 2) {
      // 仲裁：双指介入。若拖动正在进行，取消拖动（由消费方回滚），捏合接管。
      const wasDrag = this.mode === 'drag' || this.mode === 'viewpan'
      if (wasDrag) this.hooks.onDragCancel?.()
      const [a, b] = [...this.pointers.values()]
      const sameElement =
        a.hit && b.hit && a.hit.kind === b.hit.kind && a.hit.id === b.hit.id &&
        (a.hit.kind === 'seal' || a.hit.kind === 'inscription')
      this.transformTarget = sameElement ? { kind: a.hit.kind, id: a.hit.id } : { kind: 'view' }
      this.transformBase = this.geometryOf(a, b)
      this.setMode('transform', wasDrag ? 'pinch-preempts-drag' : 'pinch')
      this.hooks.onTransformStart?.(this.transformTarget)
    }
  }

  onPointerMove(event) {
    const pointer = this.pointers.get(event.pointerId)
    if (!pointer) return
    pointer.x = event.clientX
    pointer.y = event.clientY

    if (this.mode === 'pending' && this.pointers.size === 1) {
      const dist = Math.hypot(event.clientX - this.startPos.x, event.clientY - this.startPos.y)
      if (dist > SLOP_PX) {
        const kind = this.startHit?.kind || 'paper'
        if (kind === 'paper' || kind === 'body') {
          this.setMode('viewpan', 'pan')
          this.hooks.onViewPanStart?.()
        } else {
          this.setMode('drag', 'drag')
          this.hooks.onDragStart?.(this.startHit)
        }
        this.lastPos = { x: event.clientX, y: event.clientY }
      }
      return
    }

    if (this.mode === 'drag') {
      const dx = event.clientX - this.startPos.x
      const dy = event.clientY - this.startPos.y
      this.hooks.onDrag?.({ dx, dy })
      return
    }

    if (this.mode === 'viewpan') {
      const dx = event.clientX - this.lastPos.x
      const dy = event.clientY - this.lastPos.y
      this.lastPos = { x: event.clientX, y: event.clientY }
      this.hooks.onViewPan?.({ dx, dy })
      return
    }

    if (this.mode === 'transform' && this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()]
      const now = this.geometryOf(a, b)
      const scale = this.transformBase.dist > 0 ? now.dist / this.transformBase.dist : 1
      const rotation = ((now.angle - this.transformBase.angle) * 180) / Math.PI
      this.hooks.onTransform?.({ scale, rotation })
    }
  }

  onPointerUp(event) {
    const pointer = this.pointers.get(event.pointerId)
    if (!pointer) return
    this.pointers.delete(event.pointerId)

    if (this.pointers.size === 0) {
      this.detachWindow()
      if (this.mode === 'pending') {
        this.hooks.onTap?.(this.startHit || { kind: 'paper' })
      } else if (this.mode === 'drag') {
        this.hooks.onDragEnd?.()
      } else if (this.mode === 'viewpan') {
        this.hooks.onViewPanEnd?.()
      } else if (this.mode === 'transform') {
        this.hooks.onTransformEnd?.()
      }
      this.setMode('idle', 'release')
      this.transformBase = null
      this.transformTarget = null
      return
    }

    if (this.pointers.size === 1 && this.mode === 'transform') {
      // 仲裁：捏合中抬起一指 → 以剩余手指重新起算，避免视图/元素跳变。
      this.hooks.onTransformEnd?.()
      const [remaining] = [...this.pointers.values()]
      this.startHit = remaining.hit
      this.startPos = { x: remaining.x, y: remaining.y }
      this.lastPos = this.startPos
      this.setMode('pending', 'pinch-lifted')
    }
  }

  onWheel(event) {
    if (!this.enabled) return
    event.preventDefault()
    this.hooks.onViewZoom?.({ delta: event.deltaY, x: event.clientX, y: event.clientY })
  }

  geometryOf(a, b) {
    return {
      cx: (a.x + b.x) / 2,
      cy: (a.y + b.y) / 2,
      dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
      angle: Math.atan2(b.y - a.y, b.x - a.x)
    }
  }
}
