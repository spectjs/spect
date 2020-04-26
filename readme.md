<div align="center"><img src="https://avatars3.githubusercontent.com/u/53097200?s=200&v=4" width=108 /></div>
<p align="center"><h1 align="center">spect</h1></p>
<p align="center">
  Hyper Reactive Aspects.<br/>
  <!-- Build reactive UIs with rules, similar to CSS.<br/> -->
  <!-- Each rule specifies an <em>aspect</em> function, carrying a piece of logic.<br/> -->
</p>
<p align="center">
  <a href="https://travis-ci.org/spectjs/spect"><img src="https://travis-ci.org/spectjs/spect.svg?branch=master"/></a>
  <a href="https://bundlephobia.com/result?p=spect"><img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/spect?label=size"></a>
  <a href="https://npmjs.org/package/spect"><img alt="npm" src="https://img.shields.io/npm/v/spect"></a>
  <img src="https://img.shields.io/badge/stability-stable-green"/>
</p>

<p align="center"><img src="/preview.png" width="566"/></p>
<p align="center">▶ <a href="https://codepen.io/dyv/pen/oNXXZEb" target="_blank"><strong>Run</strong></a></p>
<br/>

<!--
<time id="clock"></time>

<script type="module">
  import { $, h, v } from "https://unpkg.com/spect"

  $('#clock', el => {
    const date = v(new Date())

    h`<${el} datetime=${ date }>
      ${ date`toLocaleTimeString` }
    </>`

    let id = setInterval(() => date(new Date()), 1000)
    return () => clearInterval(id)
  })
</script>
-->

_Spect_ is radical minimalistic [_aspect-oriented_](https://en.wikipedia.org/wiki/Aspect-oriented_programming) FRP library, enabling super-compact UI code and highly efficient DOM manipulations with conventional API. It provides 3 essential frontend functions − `$`, `h` and `v`, already familiar from [_jquery_](https://ghub.io/jquery), [_hyperscript_/_JSX_](https://ghub.io/hyperscript) and [_observable_](https://www.npmjs.com/package/observable) backgrounds.

## Principles

:gem: **Separation of cross-cutting concerns** with _aspects_.

:deciduous_tree: **Native first** − semantic clean tree, vanilla flavor.

:calling: **Progressive enhancement** − multiple aspects enrich functionality.

:baby_chick: **Low entry barrier** − no code bureaucracy or complexity hostages.

:dizzy: **0** bundling, **0** server, **0** template.

:shipit: **Low-profile** − doesn’t force stack, can be used as utility.

:golf: Minimized **performance / size** price − faster than many alternatives or even DOM.


## Installation

#### A. Directly as a module:

```html
<script type="module">
import { $, h, v } from 'https://unpkg.com/spect?module'

// ... code here
</script>
```

#### B. As dependency from npm:

[![npm i spect](https://nodei.co/npm/spect.png?mini=true)](https://npmjs.org/package/spect/)

```js
import { $, h, v } from 'spect'

// ... code here too
```

_Spect_ plays perfectly with [snowpack](https://www.snowpack.dev/), but any other bundler will do.


## Usage

Consider simple user welcoming example.

```js
<div class="user">Loading...</div>

<script type="module">
import { $, h, v } from 'spect'

$('.user', async el => {
  const user = v((await fetch('/user')).json())

  h`<${el}>Hello, ${ v(user, u => u.name || 'guest') }!</>`
})
</script>
```

`$` defines a `.user` rule, assigning an _aspect_ callback for matching elements, similar to _CSS_ or _jQuery_, but live.<br/>
`h` is _hyperscript_ / _htm_ in one, declaring markup effect. It rerenders automatically whenever `username` changes.<br/>
`v` is _observable_ acting as _useState_.

<!--
Consider simple todo app.

```js
<form class="todo">
  <label for="add-todo">
    <span>Add Todo</span>
    <input name="text" required/>
  </label>
  <button type="submit">Add</button>
  <ul class="todo-list"><ul>
</form>

<script type="module">
import { $, h, on, list } from 'spect'

const todos = list([])

$('.todo-list', el => h`<${el}>${ todos }</>`)

$('.todo-form', el => on(el, 'submit', e => {
  e.preventDefault()
  if (!el.checkValidity()) return
  todos.push({ text: e.elements.text.value })
  el.reset()
}))
</script>
```

Input element here is uncontrolled and logic closely follows native js to provide _progressive enhancement_. _**`list`**_ creates an observable array `todos`, mutating it automatically rerenders _**`h`**_.
-->

### Examples

* [todomvc](https://spectjs.github.io/spect/examples/todomvc.html)

See [/examples](examples) folder.

<!--

Maybe validation / sending form? (better for cases, eg. forms (all react cases))
Or familiar examples of another framework, rewritten with spect? (better for docs, as spect vs N)
Something showcasing wow features, like composable streaming and how that restructures waterfall rendering?
Yes, makes more sense. The very natural flow, where with HTML you can prototype, then naturally upgrade to UI-framework, then add actions. Minimize design - code distance.

an app, displaying a [list of users].
First, create semantic HTML you'd regularly do without js.

```html
<!doctype html>

<template id="article">
  <article>
  </article>
</template>

<main>
  <div id="articles">
  </div>
</main>
```

Second, make data loading circuit.

```js
<script type="module">
import { $, h, store } from 'https://unpkg.com/spect?module'

const articles = store({
  items: [],
  load() {
    this.loading = true
    this.items = await (await fetch(url)).json()
    this.loading = false
  }
})

$('#articles', el => {
  h`<${el}>${
    articles.map(item => h``)
  }</>`
})
</script>
```

_Spect_ doesn't make any guess about storage, actions, renderer or tooling setup and can be used with different flavors.

#### Vanilla

```js
import { $ } from 'spect'

// touched inputs
$('input', el => el.addEventListener('focus', e => el.classList.add('touched')))
```

#### Microfrontends

Pending...

#### Aspect-Oriented DOM

Pending...

-->

## API

<details><summary><strong>$ − selector observer</strong></summary>

> elements = $( scope? , selector? , aspect? )<br/>
> elements = $\`.selector\`<br/>

Get live collection of elements matching the `selector`. `aspect` function is triggered for each matched element.

* `selector` is a valid CSS selector.
* `scope` is optional _HTMLElement_ or a list of elements to narrow down selector scope.
* `fn` is a function with `(element) => teardown?` signature.
* `elements` is live array with matched elements, implements [HTMLCollection](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCollection), [WeakSet](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet) and [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array).

```js
import { $, v, h } from 'spect'

let $foo = $('.foo', el => {
  console.log('active')
  return () => console.log('inactive')
})

document.body.append(h`<div.foo/><div#bar/>`)

// ... "active"

$foo[0] // <div class="foo"></div>

$foo.bar // <div id="bar"></div>

foo.remove()

// ... "inactive"

$foo[0] // undefined


// observe changes
v($foo)(els => (console.log(els), () => console.log('off', els)))
document.body.append(foo)

// ... "active", [ foo ]

// destroy
$foo[Symbol.dispose]()

// ... "inactive", "off", [ foo ]
```

#### Example

```js
import { $ } from 'spect'

const $timer = $('.timer', el => {
  let count = 0
  let id = setInterval(() => {
    el.innerHTML = `Seconds: ${count++}`
  }, 1000)
  return () => clearInterval(id)
})
```

_Method_: class selectors technique from [fast-on-load](https://ghub.io/fast-on-load), feature-based selectors from [selector-set](https://github.com/josh/selector-set) and animation-based selectors from [insertionQuery](https://github.com/naugtur/insertionQuery).<br/>
_R&D_: [jQuery](https://ghub.io/jquery), [selector-observer](https://github.com/josh/selector-observer), [reuse](https://ghub.io/reuse), [aspect-oriended-programming](https://en.wikipedia.org/wiki/Aspect-oriented_programming) libraries and others.

<br/>

</details>


<details><summary><strong>h − hyperscript / html</strong></summary>

> el = h( tag | target , props? , ...children )<br/>
> el = h\`...content\`<br/>

[Hyperscript](https://ghub.io/hyperscript) with observables. Can be used via JSX or template literal with [HTML syntax](https://ghub.io/xhtm).

```js
import { h, v } from 'spect'

const text = v('foobar')

// create element
const foo = h('foo', {}, text)

// create jsx
/* jsx h */
const bar = <bar>{ text }</bar>

// update
text('fooobar')


// template literal
const foo = h`<baz>${ text }</baz>`

// create multiple elements
const [foo1, foo2] = h`<foo>1</foo><foo>2</foo>`

// document fragment
const fooBarFrag = h`<foo/><bar/>`

// hydrate / render
h`<${foo} ...${props}>${ children }</>`
h(foo, {...props}, ...children)
```

#### Example

```js
import { $, v, h } from 'spect'

$('#clock', el => {
  let date = v(new Date())
  setInterval(() => date(new Date()), 1000)
  h`<${el}>${ v(date, date => date.toISOString())} </>`
})
```

_Method_: cached `<template>`s with fast cloning.<br/>
<!-- _Performance_: faster than manual DOM, see [benchmark](). -->
_R&D_: [lit-html](https://ghub.io/lit-html), [htm@1](https://ghub.io/htm) [htl](https://ghub.io/htl), [hyperscript](https://ghub.io/hyperscript), [incremental-dom](https://ghub.io/incremental-dom), [snabbdom](https://ghub.io/snabbdom), [nanomorph](https://ghub.io/nanomorph), [uhtml](https://ghub.io/uhtml) and others.

<br/>

</details>


<details><summary><strong>v − value observer</strong></summary>

> value = v( source? , map? , inmap? )<br/>
> value = v\`...content\`<br/>

Universal observable − creates a getter/setter function with [observable](https://ghub.io/observable) interface from any `source`:

* _Primitive_ − simple observable state.
* _Function_ − initialized observable state.
* _Observable_ (_v_, [observ-*](https://ghub.io/observ), [observable](https://ghub.io/observable), [mutant](https://ghub.io/mutant) etc.) − 2-way bound wrapper observable.
* _AsyncIterator_ or [`[Symbol.asyncIterator]`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator) − mapped iterator observable.
* _Promise_ or _thenable_ − promise state observable.
* _Standard observable_ or [`[Symbol.observable]`](https://ghub.io/symbol-observable) ([rxjs](https://ghub.io/rxjs), [zen-observable](https://ghub.io/zen-observable) etc.) − mapped source observable.
* [_Ironjs_](https://ghub.io/ironjs) _Reactor_ − 2-way bound reactor observable.
* _Array_, _Object_, _Element_ − props / group observable, inc. _input_ / _select_ value.
* _Template string_ − observable string with dynamic fields.

```js
import { v } from 'spect'

let v1 = v(0)

// get
v1()

// set
v1(1)

// subscribe
v1(value => {
  // value === 1
  return () => {
    // teardown
  }
})

// from value
let v2 = v(v1, v1 => v1 * 2)
v2() // 2

// from multiple values
let v3 = v([v1, v2], ([v1, v2]) => v1 + v2)
v3() // 3
v3[0]() // 1

// run effect on every change
v([v1, v2, v3])(([v1, v2, v3]) => {
  console.log(v1, v2, v3)
  return () => console.log('teardown', v1, v2, v3)
})
// ... 1, 2, 3

// live string
let vsum = v`${v1} + ${v2} = ${v3}`()
vsum() // "1 + 2 = 3"

// from input
let v4 = v(h`<input#id value=1/>`)
v4(input => console.log(input.value))

// from object
let item = { done: false, text: '' }
let v5 = v(item)
v5.done() // false

// log diff
v5((item, diff) => console.log(item, diff))
item.done = true
v5().done // false
// ... { done: true, text: '' }, { done: true }

// initialize value
let v6 = v(() => v5)
v6() // v5

// observe via async iterator
for await (const value of v(v6)) console.log(value)

// dispose
;[v6, v5, v4, v3, v2, v1].map(v => v[Symbol.dispose]())
```

#### Example

```js
import { $, v } from 'spect'

const f = v(...$`#fahren`), c = v(...$`#celsius`)
const celsius = v(f, f => (f - 32) / 1.8)
const fahren = v(c, c => (c * 9) / 5 + 32)

celsius() // 0
fahren() // 32
```

#### Example 2

```js
import { v } from 'spect'

let likes = v({
  count: null,
  loading: false,
  async load() {
    this.loading = true
    this.count = await (await fetch('/likes')).json()
    this.loading = false
  }
})

$('.likes-count', el => h`<${el}>${
    v(likes, ({loading, count}) => loading ? `Loading...` : `Likes: ${ likes.count }`)
  }</>`
})

likes.load()
```

_Method_: stateful/stateless channels.<br/>
_R&D_: [observable](https://ghub.io/observable), [react hooks](https://ghub.io/unihooks), [observable proposal](https://github.com/tc39/proposal-observable), [observ](https://ghub.io/observ), [mutant](https://ghub.io/mutant), [rxjs](https://ghub.io/rxjs), [iron](https://github.com/ironjs/iron), [icaro](https://ghub.io/icaro), [introspected](https://ghub.io/introspected), [augmentor](https://ghub.io/augmentor) and others.

<br/>

</details>


<!--
### _`channel`_

> ch = channel( callback, onCancel )

Event bus. Thenable, Cancelable, AsyncIterable.

```js
import channel from 'spect/channel'

let foobus = channel(
  e => console.log('received', e),
  reason => console.log('canceled', reason)
)

// post to channel
foobus('a')
foobus('b')

// subscribe to channel
for await (let e of foobus) {
  console.log(e)
}

// close channel
foobus.cancel()
```

<br/>
-->


<p align="center">ॐ</p>
