// domdiff html implementation
import htm from 'htm'
import { isElement, paramCase, isPrimitive, isIterable } from './util'
import morph from 'morphdom'
import clsx from 'clsx'
import { fire } from './on'
import equal from 'fast-deep-equal'
import 'array-flat-polyfill'
import { apply as applyUse } from './use'

const propsCache = new WeakMap()

let currentUseCache = null

const _morph = Symbol('morph')

export default function html (...args) {
  let prevUseCache = currentUseCache
  currentUseCache = new Set()

  // render DOM
  let result = htm.call(h, ...args)

  // non-DOM htm result to DOM
  if (typeof result === 'string') result = document.createTextNode(result)
  else if (Array.isArray(result)) {
    result = result.map(el => used(el))
    let frag = document.createDocumentFragment()
    frag.append(...result)
    result = frag
  }
  else result = used(result)

  // run `use`, `is` in children
  for (let el of currentUseCache) {
    used(el)
  }
  currentUseCache = prevUseCache

  // seal result
  result[_morph] = false

  return result
}

function used (el, list) {
  if (!list && !currentUseCache.has(el)) return el
  currentUseCache.delete(el)

  if (!list) list = [el.is, el.use].flat().filter(Boolean).filter(f => typeof f === 'function')

  let result = applyUse(el, list)

  // elements created via use are able to be morphed
  if (result !== el) result[_morph] = true

  return result
}



function h(tag, props, ...children) {
  if (!props) props = {}

  // html`<.sel></>`
  if (typeof tag === 'string' && (tag[0] === '#' || tag[0] === '.')) {
    tag = document.querySelector(tag)
    if (!tag) return
  }

  // html`<${el}>...</>`
  if (isElement(tag)) {
    // html`<${el}.a.b.c />`
    for (let name in props) {
      let value = props[name]
      if (value === true && name[0] === '#' || name[0] === '.') {
        let [, id, classes] = parseTag(name)
        if (id && !props.id) props.id = id
        if (classes.length) props.class = [props.class || '', ...classes].filter(Boolean).join(' ')
        delete props[name]
      }
    }

    // don't override initial tag id
    if (tag.id && !props.id) props.id = tag.id
    if (tag.classList.length && props.class) {
      props.class = [...tag.classList, props.class]
    }

    // keep attributes
    if (tag.attributes) {
      for (let attr of tag.attributes) {
        if (!props[attr.name]) props[attr.name] = attr.value
      }
    }
    let newTag = createElement(tag.tagName, props, children)

    morph(tag, newTag, {
      getNodeKey: (el) => {
        return el.key || el.id
      },
      onBeforeElChildrenUpdated: (fromEl, toEl) => {
        // text-only case is special
        // if ([...fromEl.childNodes].every(node => node.nodeType === 3) && [...toEl.childNodes].every(node => node.nodeType === 3)) {
        //   console.log(fromEl.innerHTML, toEl.innerHTML)
        //   // fromEl.textContent = toEl.textContent
        //   // return false
        // }
      },
      onBeforeElUpdated: (fromEl, toEl) => {
        // FIXME: this blocks updating
        // if (fromEl.isEqualNode(toEl)) {
        //   return false
        // }
        //   console.log(fromEl.innerHTML, toEl.innerHTML)
        if (!toEl[_morph]) {
          fromEl.replaceWith(toEl)
          return false
        }

        if (propsCache.has(toEl)) {
          let changedProps = propsCache.get(toEl)
          for (let prop of changedProps) {
            if (!Object.is(fromEl[prop], toEl[prop])) {
              fromEl[prop] = toEl[prop]
              fire(fromEl, 'prop:' + prop)
            }
            // propsCache.delete(prop)
          }
        }

        return true
      }
    })

    return tag
  }


  // html`<${C}/>`
  if (typeof tag === 'function') {
    let el = createElement(tag.name && paramCase(tag.name), props, children)

    el = used(el, [tag])

    return el
  }


  // html`<>content...</>`
  let [tagName, id, classes] = parseTag(tag)
  if (id && !props.id) props.id = id
  if (classes.length) props.class = [props.class || '', ...classes].filter(Boolean).join(' ')

  let el = createElement(tagName, props, children)

  return el
}

function createElement(el, props, children) {
  if (!el) el = document.createDocumentFragment()
  else if (typeof el === 'string') el = document.createElement(el, props && props.is && {is: props.is})

  if (children) {
    children = children.flat()
      .filter(child => typeof child === 'number' || child)
      .map(child => {
        if (isPrimitive(child)) return document.createTextNode(child)
        // clone textnodes to avoid morphing them
        if (child.nodeType === 3) return child.cloneNode()
        if (child.then) {
          child.then(el => {
            holder.replaceWith(el)
          })
          let holder = isElement(child) ? child : document.createTextNode('')
          return holder
        }
        return child
      })
  }

  if (props) applyProps(el, props)
  if (children) el.append(...children)

  // internal nodes can be morphed
  el[_morph] = true

  return el
}

function applyProps(el, props) {
  for (let name in props) {
    let value = props[name]
    if (name === 'style') {
      if (typeof value === 'string') el.style.cssText = value
      else {
        for (let styleProp in value) {
          el.style.setProperty(styleProp, value[styleProp])
        }
      }
    }
    else if (name === 'class') {
      el.className = clsx(value)
    }
    // html class props remnants
    else if (name[0] === '.' && value) {
      el.classList.add(name.slice(1))
    }
    else if (name.substr(0, 5) === 'data-') {
      el.setAttribute(name, value)
    }
    else {
      // FIXME: some attributes, like colspan, are not automatically exposed to elements
      if (isPrimitive(value) && isElement(el) && el.setAttribute && name !== 'href') {
        if (value === false || value === null || value === undefined) {
          el.removeAttribute(name)
        }
        else if (value === true) el.setAttribute(name, '')
        el.setAttribute(name, value)
      }

      el[name] = value
      // collect use/is patch rendered DOM
      if (value && (name === 'use' || name === 'is')) currentUseCache.add(el)
      if (!propsCache.has(el)) propsCache.set(el, new Set)
      propsCache.get(el).add(name)
    }
  }
  return el
}

function parseTag(str) {
  if (typeof str !== 'string' && isIterable(str)) throw Error('Cannot handle iterables for now: ' + str)
  let tag, id, classes
  let [beforeId, afterId = ''] = str.split('#')
  let beforeClx = beforeId.split('.')
  tag = beforeClx.shift()
  let afterClx = afterId.split('.')
  id = afterClx.shift()
  classes = [...beforeClx, ...afterClx]
  return [tag, id, classes]
}