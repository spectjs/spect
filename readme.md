# Spect ![experimental](https://img.shields.io/badge/stability-experimental-yellow) [![Build Status](https://travis-ci.org/spectjs/spect.svg?branch=master)](https://travis-ci.org/spectjs/spect)

_Spect_ is [aspect-oriented](https://en.wikipedia.org/wiki/Aspect-oriented_programming) web-framework.

#### 🎡 Concept

_Spect_ introduces _reactive aspects_ and collection of _side-effects_ to manipulate data domains: `attr`, `html`, `css`, `state`, `data`, `prop`, `on` etc.

#### 🏛️ Principles

1. Expressivity.
2. No bundling.
3. HTML first.
3. Organic hydration.
5. Max utility, min presentation.

<!-- Spect is build with a set of modern practices in mind (proxies, symbols, tagged strings, virtual dom, incremental dom, htm, custom elements, hooks, observers, tuples, frp). It grounds on API design research, experiments and proofs. Current API is 4th iteration. -->

<!--
Conceptually, app is a set of _reactions_ to changes in some _domain_.

_Reaction_ may have various side-_effects_, like changing html, css, page title, sound volume, displaying dialog etc. _React_ components provide main html side-effect per component, to provide other side-effects, the mechanism of hooks is introduced. In _jQuery_, any element may have an effect on any other element, but lack of component composition is 🍝.

_State_ can be any structure, representing some domain. In web, main domains are - data storage and DOM tree (besides navigation, web-audio, localstorage, webgl etc.). Reactions can be triggered by changes in these domains.

`$` function wraps any group of DOM nodes, providing connections to different domains - html, css, navigation, storage, events etc. The `fx` method serves as aspect for group, it works as `useEffect` merged with component renderer (component renderer conceptually _is_ effect too).

Other approaches include:

* Decomposition algorithm, aspects (CSS is aspect).
* streamlined html (fragment is container, attributes reflect domains, tagname is main domain indicator, children are implicit prop of syntax).
* streamlined effects (global is effect holder, effect scope is indicated in ref, effect corresponds to domain).
* streamlined subscription (autosubscribe to domain by reading it, sources of rerendering(target, subscriptions, direct gate call), soft/hard effects).
* optimization API equation (contextual effects → effect constructors → hooks namespace → html wrappers → events middleware).
* streamlined updates (batch updates after fx tick, clean up required diffs).
* streamlized html (orig holder, vdom, attaching fx, API, carrying over DOM nodes)
-->


```js
import { html, attr, state, fx, deps, route } from 'spect'
import ky from 'ky'
import { t, useLocale } from 'ttag'

// main app aspect - load & render data
use('#app', async el => {
  let { id } = route('users/:id')

  // run state effect when `id` changes (useEffect)
  fx(id, id => {
    attr(el, { loading: true })
    state(el, { user: await ky.get`./api/user/${ id }` })
    attr(el, { loading: false })
  })

  // html side-effect
  html`<${el}.preloadable>
    <p.i18n>${ attr(el).loading ? `Hello, ${ state(el).user?.name }!` : `Thanks for patience...` }</p>
  </>`
}

// preloader aspect - append/remove spinner if loading state changes
use('.preloadable', el => {
  fx(attr(el).loading, loading => {
    if (!loading) return
    let progress = html`<progress.progress-circle />`
    el.append(progress)
    return () => el.remove(progress)
  })
})

// i18n aspect - translates content when `lang` attribute changes
use('.i18n', el => {
  fx(attr(el).lang || attr(document.documentElement).lang,
  lang => {
    useLocale(lang)
    text(el, t(text))
  })
})
```
-->

## Installation

**A.** As _npm_ package:

[![npm i spect](https://nodei.co/npm/spect.png?mini=true)](https://npmjs.org/package/spect/)

```js
import $ from 'spect'

// ...UI code
```

**B.** As module<sup><a href="#principle-2">2</a></sup>:

```html
<script type="module">
import $ from 'https://unpkg.com/spect@latest?module'

// ...UI code
</script>
```

**C.** As standalone bundle:

```html
<script src="https://unpkg.com/spect/dist-umd/index.bundled.js"></script>
<script>
  let $ = window.spect

  // ...UI code
</script>
```


## Getting started


🎬 Let's build [basic examples](https://reactjs.org/).

### A Simple Aspect

This example assigns `hello` aspect to `#hello-example` element and renders single `div` with welcoming.

```html
<div id="hello-example" name="Cyril"></div>

<script type="module">
import { html, use } from 'spect'

use('#hello-example', function hello(el) {
  html`<${el}>
    <div.message>
      Hello, ${ el.name }!
    </div>
  </>`
})
</script>
```

<p align='right'><a href="https://codesandbox.io/s/a-simple-aspect-xz22f">Open in sandbox</a></p>


### A Stateful Aspect

_Spect_ introduces `.state`, `.mount`, `.fx` and other effects, similar to `useState` and `useEffect` hooks and jQuery utils. Effects may accept `deps` argument for conditional triggering.

```js
import { use, state, on, fx, mount } from 'spect'

use(`#timer-example`, el => {
  let { seconds = 0 } = state(el)

  // connected callback
  mount(el, () => {
    let i = setInterval( () => state(el, { seconds++ }), 1000 )
    return () => clearInterval(i)
  })

  html`<${el}>Seconds: ${ state(el, 'seconds') }</>`

  console.log( state(el).seconds )
})

```

<p align='right'><a href="https://codesandbox.io/s/a-stateful-aspect-9pbji">Open in sandbox</a></p>


### An Application

Events are provided by `.on` effect, decoupling callbacks from markup and enabling event delegation. They can be used along with direct `on*` attributes.

```js
import { $, use, on, delegate, html, state, h } from 'spect'

use('#todos-example', (el) => {
  let {items = [], text: ''} = state(el)

  on(el, 'submit', e => {
    e.preventDefault()

    if (!text.length) return

    const newItem = {
      text,
      id: Date.now()
    };

    state(el, {
      items: [...state.items, newItem],
      text: ''
    })
  })

  on(el, '#new-todo', 'change', e => state(el, { text: e.target.value }))

  html(el, html`
    <h3>TODO</h3>
    <main.todo-list items=${ items }/>
    <form>
      <label for=new-todo>
        What needs to be done?
      </label>
      <br/>
      <input#new-todo value=${ text }/>
      <button>
        Add #${ items.length + 1 }
      </button>
    </form>
  `)
})

use('.todo-list', el => {
  html(el, html`<ul>${ el.items.map(item => html`<li>${ item.text }</li>`) }</ul>`)
})
```

<p align='right'><a href="https://codesandbox.io/s/an-application-uiv4v">Open in sandbox</a></p>


### A Component Using External Plugins

_Spect_ is able to create components via native web-components mechanism, as seen in previous example. Let's see how that can be used in composition.

```js
// index.js
import { h, html } from 'spect'
import MarkdownEditor from './editor.js'

// MarkdownEditor is created as web-component
use('#markdown-example', el => html(el, html`<${MarkdownEditor} content='Hello, **world**!'/>`))
```

```js
// editor.js
import { prop, state, html } from 'spect'
import { Remarkable } from 'remarkable'

export default function MarkdownEditor (el) {
  fx(prop(el).content, content => state(el, { value: content }))

  html`<${el}.markdown-editor>
    <h3>Input</h3>
    <label for="markdown-content">
      Enter some markdown
    </label>
    <textarea#markdown-content
      onchange=${ e => state(el, { value: e.target.value }) }
    >${ state(el).value }</textarea>

    <h3>Output</h3>
    <div.content>${ html({ raw: getRawMarkup( state(el).value )}) }</>
  </>`)
}

let getRawMarkup = content => {
  const md = new Remarkable();
  return md.render(content);
}
```

<p align='right'><a href="https://codesandbox.io/s/a-component-tnwdm">Open in sandbox</a></p>

<!--
### More examples

* [Popup-info component from MDN](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define#Autonomous_custom_element):
-->



## API

[**`$`**](#-selector--els--markup---selector--h)&nbsp;&nbsp; [**`.use`**](#use-fns---assign-aspects)&nbsp;&nbsp; [**`.fx`**](#fx-el--destroy--deps---generic-side-effect)&nbsp;&nbsp; [**`.state`**](#state-name--val-deps---state-provider)&nbsp;&nbsp; [**`.prop`**](#prop-name--val-deps---properties-provider)&nbsp;&nbsp; [**`.attr`**](#attr-name--val-deps---attributes-provider)&nbsp;&nbsp; [**`.html`**](#htmlmarkup---html-side-effect)&nbsp;&nbsp; [**`.text`**](#text-content----text-content-side-effect)&nbsp;&nbsp; [**`.clsx`**](#class-classes-deps---classes-side-effect)&nbsp;&nbsp; [**`.css`**](#css-styles-deps---css-side-effect)&nbsp;&nbsp; [**`.on`**](#on-evt-fn---events-provider)&nbsp;&nbsp; [**`.mount`**](#mount-fn-onmount--onunmount----lifecycle-callbacks)

##

<!-- ### `$( selector | els | markup )` − create collection

Create collection of elements, wrapped into [spect](https://ghub.io/spect). Effects broadcast to all items in collection.

```js
// select nodes
$('#id.class > div')
$(elements)
$('> div', container)

// create html
$('<div.foo/>')
$`foo <bar.baz/>`
```

<p align="right">Ref: <a href="https://jquery.com">jquery</a>, etc.</p> -->


### `use( selector, fn )` − assign aspect

Assign aspect to elements matching selector. Aspect `fn` is when element appears in the DOM and rerenders whenever its dependencies update. See [spect#use](https://github.com/spectjs/spect/tree/nodom#use-fns---assign-aspects) for details.

```js
let bar = $('.bar')

use('.foo', el => {
  // subscribe to updates
  let x = attr( el ).x
  let y = attr( bar ).y

  // rerender after 1s
  setTimeout(() => attr( el ).x++, 1000)
})

// triggers rerendering $foo
attr(bar, { y: 1 })
```
<!--
Aspects can be attached via `.html` effect as well:

```js
$els.html`<div is=${foo} use=${[bar, baz]}></div>`
```

Aspects, assigned via `is`, define custom elements, see `.html` for details.
Note that aspects "upgrade" elements - once assigned, elements cannot be "downgraded", very much like custom elements. -->



<!--
### `run( fn )` - run aspect function

Run assigned aspect or a single aspect for all elements in collection. See [spect#update](https://github.com/spectjs/spect/tree/nodom#update-fn-deps----update-aspect).

```js
// run all assigned aspects
$els.update()

// run single aspect
$els.update( fn )
``` -->


### `state( target, obj? )` − read / write target state

Read or write state associated with any target. Reading returns first element state in the set. Reading subscribes current aspect to changes of that state. Writing rerenders all subscribed aspects. Optional `deps` param can define bypassing strategy, see `.fx`.

```js
// write
state(target, { foo: 'bar' })
state(target).foo = bar

// mutate/reduce
state(target, s => s.foo = 1)
state(target, s => {...s, foo: 1})

// read
state(target).foo
state(target)
```


### `prop( target, obj? )` − target properties

Read or write elements properties. Same as `.state`, but provides access to element properties.

```js
// write prop
$els.prop('foo', 1)
$els.prop({foo: 1})

// mutate
$els.prop(p => p.foo = 1)

// reduce
$els.prop(p => {...p, foo: 1})

// init
$els.prop({foo: 1}, [])

// read first element prop
$els.prop('foo')

// read all
$els.prop()
```

<p align="right">Ref: <a href="https://reactjs.org/docs/hooks-state.html">useState</a></p>


### `attr( element, obj? )` − read / write element attributes

Read or write attributes to elements in a set. Same as `.prop`, but works with attributes, therefore values are always strings. Reading creates observer for external attribute changes. For boolean values, it sets/unsets attribute, rather than stringifies value.

```js
// write attribute
$els.attr('foo', 'bar')
$els.attr({ foo: 'bar'})

// mutate
$els.attr(a => a.foo = 'bar')

// reduce
$els.attr(a => {...a, foo: 'bar'})

// read first element attribute
$els.attr('foo')

// read all
$els.attr()

// set/unset attribute
$els.attr('foo', true)
$els.attr('foo', false) // same as null or undefined
```

<p align="right">Ref: <a href="https://ghub.io/attributechanged">attributechanged</a></p>


### ``.html`...markup` `` − create html

Patch HTML for elements in collection. Internally uses [htm](https://ghub.io/htm) and [incremental-dom](https://ghub.io/incremental-dom) for efficient rendering.

```js
// set html
$els.html`foo <bar><baz/></> qux`
$els.html`foo ${ document.querySelector('.bar') } ${ $baz }`
$els.html`<div>${ $div => {} }</div>`
$els.html(document.querySelector('.bar'), deps)
$els.html([foo, bar, baz], deps)

// append/prepend, reduce, wrap/unwrap
// TODO $els.html(el => [prepend, ...children, append])
// TODO $els.html(children => $`<div.foo>${ children }</div>`)

/* @jsx $.h */
// TODO $els.html(<>Markup</>)

// components
$els.html`<button is=${SuperButton}></button>`
$els.html`<${SuperButton}/>`
function SuperButton($btn) {
  // ...
}

// assign aspects
$els.html`<foo use=${bar}/>`
$els.html`<foo use=${[bar, baz]}/>`
```

<p align="right">Ref: <a href="https://ghub.io/incremental-dom">incremental-dom</a>, <a href='https://ghub.io/htm'>htm</a></p>


### `on( element, evt, fn )` − events provider

Registers event listeners for elements in collection.

```js
// single event
$target.on('foo', e => {})

// multiple events
$target.on('foo bar', e => {})

// delegate selector
$target.on('foo', '.bar', e => {})

// sequences
$target.on('touchstart > touchmove > touchend', e => {
  // touchstart

  return e =>
    // touchmove

    return e => {
      // touchend
    }
  }
})
```

<p align="right">Ref: <a href="https://github.com/donavon/use-event-listener">use-event-listener</a></p>


### `mount( fn: onmount => onunmount )` - lifecycle callbacks

Triggers callback `fn` when element is connected to the DOM. Returned function is triggered when the element is disconnected.
If an aspect is assigned to connected elements, the `onmount` is triggered immediately.

```js
$el.mount(() => {
  // connected
  return () => {
    // disconnected
  }
})
```


### `text( element, content ) ` − text content side-effect

Provide text content for elements.

```js
// set text
$target.text`...text`
$target.text(str => i18n(nbsp(clean(str))))

// get text
$target.text()
```


### `css( element, styles )` − CSS side-effect

Provide scoped CSS styles for collection.

```js
// write css
$target.css` :host { width: 100%} `
```

<!-- $target.css({ ':host': { width: 100%} }) -->
<!-- $target.css(rules => rules[':host'].width = '100%') -->
<!-- $target.css(':host').width -->
<!-- $target.css.path = obj|str -->
<!-- $target.css.path // obj -->
<!-- $target.css`selector { ...rules }` -->
<!-- $target.css = `selector { ...rules }` -->

<p align="right">Ref: <a href="https://ghub.io/virtual-css">virtual-css</a></p>


### `class( ...classes, deps? )` − classes side-effect

Manipulate elements classes.

```js
// write classes
$target.class`foo bar baz`
$target.class('foo', true && 'bar', 'baz')
$target.class({ foo: true, bar: false, bas: isTrue() })
$target.class(clsx => clsx.foo = false)

// read classes
$target.class('foo')
$target.class()
```

<p align="right">Ref: <a href="https://ghub.io/clsx">clsx</a>, <a href="https://ghub.io/classnames">classnames</a></p>


### `fx( deps, el => destroy )` − generic side-effect

Run effect function for each element in collection, with optional `deps` check. See [spect#fx](https://github.com/spectjs/spect/tree/nodom#fx-------bool--deps---generic-side-effect) for details.

```js
// called each time
$els.fx($el => {});

// called when value changes to non-false
$els.fx($el => { $el.show(); return () => $el.hide(); }, $el.visible);

// called on init only
$els.fx($el => {}, []);

// destructor is called any time deps change
$els.fx($el => () => {}, deps);
```



## [FAQ](./faq.md)


<!--
## Core API

[**`spect.fn`**](#spectfn-fns----register-effects)&nbsp;&nbsp; [**`spect`**](#spect-target---create-aspectable)&nbsp;&nbsp; [**`.use`**](#use-fns---assign-aspects)&nbsp;&nbsp; [**`.run`**](#run-fns-deps----run-aspects)&nbsp;&nbsp; [**`.dispose`**](#dispose-fns----remove-aspect)&nbsp;&nbsp; [**`.fx`**](#fx-------bool--deps---generic-side-effect)&nbsp;&nbsp; [**`.state`**](#state-name--val-deps---getset-state)&nbsp;&nbsp; [**`.prop`**](#prop-name--val-deps---getset-properties)&nbsp;&nbsp;

### `spect.fn( ...fns )` - register effects

Register effect(s) available for targets.

```js
import spect, { state, prop, fx } from 'spect'
import { html, css, attr } from 'spect'

spect.fn(state, prop, fx, html, css, attr)

let target = spect(document.querySelector('#my-element'))

// use effects
target.attr('foo', 'bar')
target.html`...markup`
target.css`...styles`
```

### `spect( target? )` − create aspectable

Turn target into aspectable. The wrapper provides transparent access to target props, extended with registered effects via Proxy. `use`, `update` and `dispose` methods are provided by default, other effects must be registered via `spect.fn(...fxs)`.

```js
import spect, { state } from 'spect'

spect.fn(state)

let foo = {}
let $foo = spect(foo)

// targets are thenable
await $foo.use($foo => {
  // get foo by deconstructing:
  let [foo] = $foo

  console.log($foo.state('count'))

  // rerender
  setTimeout(() => $foo.state( state => state.count++ ), 1000)
})

// re-run all aspects
$foo.update()
```

### `use( fns? )` − assign aspects

Assign aspect(s) to target. Each aspect `fn` is invoked as microtask. By reading/writing effects, aspect subscribes/publishes changes, causing update.

```js
import spect, { prop, state } from 'spect'

spect.fn(prop, state)

let foo = spect({})
let bar = spect({})

foo.use(foo => {
  // subscribe to updates
  let x = foo.state('x')
  let y = bar.prop('y')

  // update after 1s
  setTimeout(() => foo.state( state => state.x++ ), 1000)
})

// update foo
bar.prop('y', 1)
```

### `update( fns?, deps? )` - run aspect(s)

(re-)Run assigned aspects. If `fn` isn't provided, rerenders all aspects. `deps` control the conditions when the aspect must be rerun, they take same signature as `useEffect` hook.

```js
import spect from 'spect'

let foo = spect({})

foo.use(a, b)

// update only a
await foo.update(a)

// update all
await foo.update()
```

### `dispose( fns? )` - remove aspect

Remove assigned aspects. If `fn` isn't provided, removes all aspects. Function, returned by aspect is used as destructor.

```js
import spect from 'spect'

let foo = spect({})

foo.use(a, b)

// remove a
await foo.dispose(a)

// remove all
await foo.dispose()

function a () {

}

function b () {
  return () => {
    // destructor
  }
}
```


### `fx( () => (() => {})? , bool | deps? )` − generic side-effect

Run effect function as microtask, conditioned by `deps`. Very much like [`useEffect`](https://reactjs.org/docs/hooks-effect.html) with less limitations, eg. it can be nested into condition. Boolean `deps` can be used to organize toggle / FSM that triggers when value changes to non-false, which is useful for binary states like `visible/hidden`, `disabled/enabled` etc.

```js
import spect, { fx } from 'spect'

spect.fn(fx)


let foo = spect()

// called each time
foo.fx(() => {});

// called on init only
foo.fx(() => {}, []);

// destructor is called any time deps change
foo.fx(() => () => {}, [...deps]);

// called when value changes to non-false
foo.fx(() => { show(); return () => hide(); }, visible);
```


### `state( name | val, deps? )` − get/set state

Read or write state associated with target. Reading subscribes current aspect to changes of that state. Writing rerenders all subscribed aspects. Optional `deps` param can define trigger condition, see `.fx`.

```js
import spect, { state } from 'spect'

spect.fn(state)


// write state
$foo.state('foo', 1)
$foo.state({ foo: 1 })

// mutate/reduce
$foo.state(s => s.foo = 1)
$foo.state(s => ({...s, foo: 1}))

// init
$foo.state({foo: 1}, [])

// read
$foo.state('foo')
$foo.state()
```


### `prop( name | val, deps? )` − get/set properties

Read or write target properties. Same as `.state`, but provides access to element properties.

```js
import spect, { prop } from 'spect'

spect.fn(prop)


// write prop
$foo.prop('foo', 1)
$foo.prop({foo: 1})

// mutate/reduce
$foo.prop(p => p.foo = 1)
$foo.prop(p => ({...p, foo: 1}))

// init
$foo.prop({foo: 1}, [])

// read
$foo.prop('foo')
$foo.prop()
```

### Standalone effects

Effects can be used on their own, without `spect`:

```js
import { fx, state, prop } from 'spect'

let foo = {x: 1}

state.call(foo, 'y', 2)
prop.call(foo, 'x', 3)

fx.call(foo, () => {
  state.call(foo, 'y') // 2
  state.call(foo, 'x') // 3
})
```
-->

<!--
#### Internals

Internal methods are available for effects as

```js
import spect, { symbols } from 'spect'

spect.fn(function myEffect (arg, deps) {
  // `this` is `spect` instance
  // `this[symbols.target]` - initial target object

  // `this._deps(deps, destructor)` - is dependencies gate
  if (!this._deps(deps, () => { /* destructor */})) return this

  // `this._pub(path)` - publishes update of some name / path string
  // `this._sub(path, aspect?)` - subscribes current aspect to paths
  // `this[symbols.subscription]` - subscriptions dict
  // `this._run(aspect)` - runs aspect as microtask
  // `this[symbols.promise]` - internal queue
  // `this[symbols.aspects]` - internal map of assigned aspects

  return this
})
```
-->


## Changelog

Version | Changes
---|---
8.0.0 | Atomize: split core to multiple effects.
7.0.0 | Deatomize; single core approach; final ref-based approach.
6.0.0 | DOM-less core. Pluggable effects.
5.0.0 | Wrapper as aspect argument, along with props for react-compatible API. Effect queues.
4.0.0 | Functional effects API design.
3.0.0 | References + proxy-based API design.
2.0.0 | Global effects API design.
1.0.0 | HTM compiler remake with support for anonymous attributes, html-comments and unclosed tags.
0.0.1 | [jsxify](https://github.com/scrapjs/jsxify) R&D.
0.0.0 | Mod framework (Modifiers for DOM).

##

<p align="center">HK</p>
