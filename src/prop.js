import { setMicrotask, clearMicrotask } from './util'

// async generator, returning props of an object
// TODO: all-sets mode (no diff check)

const cache = new WeakMap

export default function prop(target, name, callback) {
  if (!name) throw Error('`prop` expects property name to observe')

  // check if prop is configurable
  let initialDesc = Object.getOwnPropertyDescriptor(target, name)
  if (cache.has(initialDesc)) return cache.get(initialDesc)

  let currentValue = initialDesc && ('value' in initialDesc) ? initialDesc.value : target[name],
      plannedValue, planned
  let resolve, p = new Promise(ok => resolve = ok)

  let desc = {
    configurable: true,
    get() {
      // shortcut planned call
      if (planned) applyValue()
      return currentValue
    },
    set(value) {
      if (Object.is(value, currentValue)) {
        if (planned) clearMicrotask(planned)
        return
      }

      if (!planned) planned = setMicrotask(applyValue)
      plannedValue = value
    }
  }

  function applyValue() {
    planned = null
    currentValue = plannedValue
    resolve({ value: plannedValue })
    p = new Promise(ok => resolve = ok)
    end.then = p.then.bind(p)
  }

  function end () {
    end.done = true

    Object.defineProperty(target, name, initialDesc || {
      configurable: true,
      value: currentValue,
      writable: true,
      enumerable: true
    })
    if (initialDesc) target[name] = currentValue
  }

  end[Symbol.asyncIterator] = () => {
    return {
      i: 0,
      next() {
        if (end.done) return {done: true}
        this.i++
        return p
      },
      // FIXME: find out good pattern with ending generator
      return() {
        end()
      }
    }
  }
  end.then = p.then.bind(p)

  Object.defineProperty(target, name, desc)
  cache.set(desc, end)

  return end
}
