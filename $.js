import * as symbol from './symbols.js'
import channel from './channel.js'

const SPECT_CLASS = '👁'
const ELEMENT = 1
const CLASS_OFFSET = 0x1F700
let count = 0
const _spect = Symbol.for('@spect')
const ids = {}, classes = {}, tags = {}, names = {}, animations = {}
const style = document.head.appendChild(document.createElement('style'))
style.classList.add('spect-style')
const { sheet } = style

const observer = new MutationObserver((list) => {
  for (let mutation of list) {
    let { addedNodes, removedNodes, target } = mutation
    if (mutation.type === 'childList') {
      removedNodes.forEach(target => {
        if (target.nodeType !== ELEMENT) return
        ;[target.classList.contains(SPECT_CLASS) ? target : null, ...target.getElementsByClassName(SPECT_CLASS)]
        .forEach(node => node && node[_spect].forEach(set => set.delete(node)))
      })

      addedNodes.forEach(target => {
        if (target.nodeType !== ELEMENT) return

        // selector-set optimization:
        // instead of walking full ruleset for each node, we detect which rules are applicable for the node
        // ruleset checks target itself and its children, returns list of [el, aspect] tuples
        if (target.id) {
          ids[target.id] && ids[target.id].forEach(c => c.add(target))
          let node
          for (let id in ids) if (node = target.getElementById(id)) ids[id].forEach(c => c.add(node))
        }
        if (target.className) {
          target.classList.forEach(cls => classes[cls] && classes[cls].forEach(c => c.add(target)))
          for (let cls in classes) [].forEach.call(target.getElementsByClassName(cls), node => classes[cls].forEach(c => c.add(node)))
        }
        if (target.attributes.name) {
          const name = target.attributes.name.value
          names[name] && names[name].forEach(c => c.add(target))
          for (let name in names) [].forEach.call(target.getElementsByName(name), node => names[name].forEach(c => c.add(node)))
        }
        tags[target.tagName] && tags[target.tagName].forEach(c => c.add(target))
        for (let tag in tags) [].forEach.call(target.getElementsByTagName(tag), node => tags[tag].forEach(c => c.add(node)))
      })
    }
  }
})
observer.observe(document, {
  childList: true,
  subtree: true
})


export default function spect(scope, selector, fn) {
  // spect`#x`
  if (scope && scope.raw) return new $(null, String.raw(...arguments))
  // spect(selector, fn)
  if (typeof scope === 'string') return new $(null, scope, selector)
  // spect(target, fn)
  if (!selector ||  typeof selector === 'function') {
    fn = selector
    let target = scope
    if (!target) target = []
    if (target.nodeType) target = [target]

    const set = new $(null, null, fn)
    set.add(...target)
    return set
  }

  return new $(scope, selector, fn)
}

export class $ extends Array {

  constructor(scope, selector, fn){
    // self-call, like splice, map, slice etc. fall back to array
    if (typeof scope === 'number') return Array(scope)

    super()

    if (scope) this._scope = scope
    if (selector) this._selector = selector
    if (fn) this._fn = fn
    this._match
    this._id
    this._tag
    this._name
    this._class
    this._channel = channel()
    this._items = new WeakMap
    this._delete = new WeakSet

    // init existing elements
    this.add(...(scope || document).querySelectorAll(selector))

    const parts = selector && selector.match(/^(\s*)(?:#([\w-]+)|(\w+)|\.([\w-]+)|\[\s*name=([\w]+)\s*\])([^]*)/)

    if (parts) {
    // TODO: handle multiple simple parts, make sure rulesets don't overlap
      let [, op, id, tag, cls, name, match ] = parts

      this._match = match

      // indexable selectors
      if (id) (ids[id] = ids[this._id = id] || []).push(this)
      else if (name) (names[name] = names[this._name = name] || []).push(this)
      else if (cls) (classes[cls] = classes[this._class = cls] || []).push(this)
      else if (tag) (this._tag = tag = tag.toUpperCase(), tags[tag] = tags[tag] || []).push(this)
    }

    // complex selectors are handled via anim events (technique from insertionQuery). Cases:
    // - dynamically added attributes so that existing nodes match (we don't observe attribs in mutation obserever)
    // - complex selectors, inc * - we avoid >O(c) sync mutations check
    // Simple tag selectors are meaningless to observe - they're never going to dynamically match.
    // NOTE: only connected scope supports anim observer
    // FIXME: if complex selectors have `animation`redefined by user-styles it may conflict
    if (!/^\w+$/.test(selector)) {
      let anim = animations[selector]
      if (!anim) {
        anim = animations[selector] = []
        this._animation = anim.id = String.fromCodePoint(CLASS_OFFSET + count++)
        sheet.insertRule(`@keyframes ${ anim.id }{}`, sheet.rules.length)
        sheet.insertRule(`${ selector }:not(.${ anim.id }){animation:${ anim.id }}`, sheet.rules.length)
        sheet.insertRule(`.${ anim.id }{animation:${ anim.id }}`, sheet.rules.length)
        sheet.insertRule(`${ selector }.${ anim.id }{animation:unset;animation:revert}`, sheet.rules.length)
        anim.rules = [].slice.call(sheet.rules, -4)

        anim.onanim = e => {
          if (e.animationName !== anim.id) return
          e.stopPropagation()
          e.preventDefault()

          let {target} = e

          if (!target.classList.contains(anim.id)) {
            target.classList.add(anim.id)
            anim.forEach(set => set.add(target))
          }
          else {
            target.classList.remove(anim.id)
            anim.forEach(set => set.delete(target))
          }
        }
        document.addEventListener('animationstart', anim.onanim, true)
      }
      this._animation = anim.id
      anim.push(this)
    }
  }

  add(el, ...els) {
    if (!el) return

    // ignore existing items
    if (el[_spect] && el[_spect].has(this)) return

    // ignore out-of-scope
    if (this._scope) {
      if (this._scope === el) return
      if (this._scope.nodeType) { if (!this._scope.contains(el)) return }
      else if ([].every.call(this._scope, scope => !scope.contains(el))) return
    }
    // ignore not-matching
    if (this._match) if (!el.matches(this._match)) return


    // expose refs
    // TODO: add attribs mutation observer
    if (el.attributes.name) this[el.attributes.name.value] = el
    if (el.id) this[el.id] = el

    // enable item
    if (!el[_spect]) el[_spect] = new Set

    // mark element
    el[_spect].add(this)
    el.classList.add(SPECT_CLASS)

    // cancel planned delete
    if (this._delete.has(el)) this._delete.delete(el)

    // track collection
    this.push(el)
    this._items.set(el, this._fn && this._fn(el))

    // notify
    this._channel.push(this)

    if (els.length) this.add(...els)
  }

  delete(el, immediate = false) {
    // clean up refs
    if (el.attributes.name) delete this[el.attributes.name.value]
    if (el.id) delete this[el.id]

    // remove element from list sync
    const teardown = this._items.get(el)
    this._items.delete(el)
    if (this.length) {
      this.splice(this.indexOf(el >>> 0, 1), 1)
      this._channel.push(this)
    }

    // plan destructor async
    this._delete.add(el)

    const del = () => {
      if (!this._delete.has(el)) return
      this._delete.delete(el)

      if (!el[_spect]) return

      if (teardown) {
        if (teardown.call) teardown(el)
        else if (teardown.then) teardown.then(fn => fn && fn.call && fn())
      }

      el[_spect].delete(this)

      if (!el[_spect].size) {
        delete el[_spect]
        el.classList.remove(SPECT_CLASS)
      }
    }

    if (immediate) del()
    else requestAnimationFrame(del)
  }

  [symbol.observable]() {
    const { subscribe, observers, push } = this._channel
    const set = this
    return {
      subscribe(){
        const unsubscribe = subscribe(...arguments)
        push(set, observers.slice(-1))
        return unsubscribe
      }
    }
  }

  item(n) { return n < 0 ? this[this.length + n] : this[n] }

  namedItem(name) { return this[name] }

  has(item) { return this._items.has(item) }

  [symbol.dispose]() {
    if (this._id) ids[this._id].splice(ids[this._id].indexOf(this) >>> 0, 1)
    if (this._class) classes[this._class].splice(classes[this._class].indexOf(this) >>> 0, 1)
    if (this._tag) tags[this._tag].splice(tags[this._tag].indexOf(this) >>> 0, 1)
    if (this._name) names[this._name].splice(names[this._name].indexOf(this) >>> 0, 1)
    if (this._animation) {
      const anim = animations[this._selector]
      anim.splice(anim.indexOf(this) >>> 0, 1)
      if (!anim.length) {
        document.removeEventListener('animationstart', anim.onanim)
        delete animations[this._selector]
        anim.rules.forEach(rule => {
          let idx = [].indexOf.call(sheet.rules, rule)
          if (~idx) sheet.deleteRule(idx)
        })
      }
    }

    this._channel.close()
    let els = [...this]
    this.length = 0
    els.forEach(el => this.delete(el, true))
  }
}
