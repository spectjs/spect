const Symbol = globalThis.Symbol;

export const symbol = {
  dispose: Symbol ? (Symbol.dispose || (Symbol.dispose = Symbol('dispose'))) : '@@dispose',
  observable: Symbol ? (Symbol.observable || (Symbol.observable = Symbol('observable'))) : '@@observable'
}

export const channel = () => {
  const observers = []

  function push (...vals) {
      const observers = this ? this.observers || this : channel.observers
      observers.map(sub => {
          if (sub.out && sub.out.call) sub.out()
          if (sub.next) sub.out = sub.next(...vals)
      })
  }

  const error = (e) => observers.map(sub => sub.error && sub.error(e))

  const close = () => {
      let unsubs = observers.map(sub => {
          if (sub.out && sub.out.call) sub.out()
          return sub.unsubscribe
      })
      observers.length = 0
      unsubs.map(unsub => unsub())
      channel.closed = true
  }

  const subscribe = (next, error, complete) => {
      next = next && next.next || next
      error = next && next.error || error
      complete = next && next.complete || complete

      const unsubscribe = () => {
          if (observers.length) observers.splice(observers.indexOf(subscription) >>> 0, 1)
          if (complete) complete()
          unsubscribe.closed = true
      }
      unsubscribe.unsubscribe = unsubscribe
      unsubscribe.closed = false

      const subscription = { next, error, complete, unsubscribe }
      observers.push(subscription)

      return unsubscribe
  }

  const channel = (...vals) => observer(...vals) ? subscribe(...vals) : push(...vals)

  return Object.assign(channel, {
      observers,
      closed: false,
      push,
      subscribe,
      close,
      error
  })
}

export const observer = (next, error, complete) => (next && next.call) || (error && error.call) || (complete && complete.call) || (next && observer(next.next, next.error, next.complete))

export const desc = value => Object.assign({configurable: false, enumerable: false}, value === undefined ? {writable: true} : {value})

export const list = arg => {
  return Array.isArray(arg) || (!primitive(arg) && !arg.nodeType && arg[Symbol.iterator])
}

export const primitive = (val) => {
  if (typeof val === 'object') return val === null
  return typeof val !== 'function'
}

export const immutable = (val) => {
  return !val || primitive(val) || val instanceof RegExp || val instanceof Date
}

export const observable = (arg) => {
  if (immutable(arg)) return false
  return !!(
    arg[symbol.observable]
    || (typeof arg === 'function' && arg.set)
    || arg[Symbol.asyncIterator]
    || arg.next
    || arg.then
    || arg.mutation && arg._state != null
  )
}

export const object = (value) => {
	if (Object.prototype.toString.call(value) !== '[object Object]') return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === null || prototype === Object.prototype;
}
