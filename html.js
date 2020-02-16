import fx, { primitive } from './fx.js'
import calc from './calc.js'

const FIELD = '\ue000', QUOTES = '\ue001'

export default function htm (statics) {
  let h = this, prev = 0, current = document.createDocumentFragment(), field = 0, args, name, value, quotes = [], quote = 0

  // TODO: turn string into an observable
  // const evaluate = (str, fn = a => a || '', keepQuotes) => {
  const evaluate = (str, keepQuotes) => {
    let i = 0
    // if (!str[1] && str[0] === FIELD) return fn(arguments[++field])
    if (!str[1] && str[0] === FIELD) return [arguments[++field]]

    // str = str.replace(/\ue001/g, m => keepQuotes ? quotes[quote++] : quotes[quote++].slice(1, -1))
    //   .replace(/\ue000/g, (match, idx, str) => {
    //     if (idx) fn(str.slice(i, idx))
    //     i = idx + 1
    //     return fn(arguments[++field])
    //   })
    // if (i < str.length) fn(str.slice(i))
    // return str

    // deps is fixed-length list of [possible] subscribables
    const deps = []
    str.replace(/\ue001/g, m => keepQuotes ? quotes[quote++] : quotes[quote++].slice(1, -1))
      .replace(/\ue000/g, (match, idx, str) => {
        if (idx) deps.push(str.slice(i, idx))
        i = idx + 1
        return deps.push(arguments[++field])
      })
    if (i < str.length) deps.push(str.slice(i))

    return deps
  }

  statics
    .join(FIELD)
    .replace(/('|")[^\1]*?\1/g, match => (quotes.push(match), QUOTES))
    .replace(/\s+/g, ' ')
    .replace(/<!--.*-->/g, '')

    // ...>text<... sequence
    .replace(/(?:^|>)([^<]*)(?:$|<)/g, (match, text, idx, str) => {
      if (idx) {
        let close
        str.slice(prev, idx)
          // <abc/> → <abc />
          .replace(/(\S)\/$/, '$1 /')
          .split(' ').map((part, i) => {
            if (part[0] === '/') {
              close = true
            }
            else if (!i) {
              // current = [current, evaluate(part), null]
              calc(([tag]) => {
                current.appendChild(current = typeof tag === 'string' ? document.createElement(tag) : tag)
              }, [evaluate(part)])
            }
            else if (part) {
              // let props = current[2] || (current[2] = {})
              if (part.slice(0, 3) === '...') {
                // Object.assign(props, arguments[++field])
                // const p = arguments[++field]
                // fx((props) => {
                //   for (let prop in props) {
                //     current.setAttrubute(prop, p[prop])
                //   }
                // }, [props(arguments[++field])])
              }
              else {
                [name, value] = part.split('=')
                // props[evaluate(name)] = value ? evaluate(value) : true
                if (value) {
                  const el = current
                  calc((name, ...value) => {
                    const orig = el.getAttribute(name)

                    if (value.length === 1) value = value[0]
                    else value = value.filter(Boolean).join('')

                    if (value === true) el.setAttribute(name, '')
                    else if (value === false || value == null) el.removeAttribute(name)
                    else el.setAttribute(name, value)

                    return () => {
                      el.setAttribute(name, orig)
                    }
                  }, [name, ...evaluate(value)])
                }
                else {
                  // fx(name => {
                  //   current.setAttrubute(name, '')
                  //   return () => {
                  //     current.removeAttribute(name)
                  //   }
                  // }, [evaluate(name)])
                }
              }
            }
          })

        if (close) {
          // [current, tag, props, ...children] = current
          // current.push(h(tag, props, ...children))
          // fx((tag, props, ...children) => {
            // remove all previous nodes
            // discard all previous effects
            // insert new nodes
          // }, observableList)
          current = current.parentNode
        }
      }
      prev = idx + match.length
      // if (prev < str.length || !idx) evaluate(text, part => current.push(part), true)
      if (prev < str.length || !idx) {
        if (text) {
          const deps = evaluate(text, true)
          const children = deps.flat().map(dep => current.appendChild(document.createTextNode('')))
          calc((...frags) => {
            frags.flat().map((frag, i) => {
              if (primitive(frag)) {
                if (children[i].nodeType !== 3) children[i].replaceWith(children[i] = document.createTextNode(''))
                children[i].textContent = frag
              }
              else {
                children[i].replaceWith(children[i] = frag)
              }
            })
          }, deps)
        }
      }
    })
  // return current.length > 1 ? current : current[0]
  return current.childNodes.length > 1 ? current : current.firstChild
}
