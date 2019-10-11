import t from 'tst'
import { $, on, fire, html } from '..'

t.only('on: async gen', async t => {
  let el = document.createElement('div')
  let clicks = on(el, 'click', e => {
    log.push(e.type)
  })
  let log = []
  ;(async () => {
    for await (const e of clicks) {
      log.push(e.type)
    }
  })()
  el.click()
  await Promise.resolve().then()
  // t.is(log, [2], 'basic')
  // emit.x = 3
  // emit.x = 4
  // emit.x = 5
  // await Promise.resolve().then()
  // t.is(log, [2, 5], 'updates to latest value')
  // emit.x = 5
  // emit.x = 5
  // await Promise.resolve().then()
  // t.is(log, [2, 5], 'ignores unchanged value')
  // emit.x = 6
  // t.is(emit.x, 6, 'reading applies value')
  // await Promise.resolve()
  // t.is(log, [2, 5, 6], 'reading applies value')
  // p()
  // emit.x = 7
  // await Promise.resolve().then()
  // t.is(emit.x, 7, 'end destructures property')
  // t.is(log, [2, 5, 6], 'end destructures property')
})

t.todo('on: oldschool', async t => {
  let log = []
  let el = html`<a.foo/>`

  let off = on(el, 'click', () => log.push('click'))
  el.click()
  t.is(log, ['click'])

  off()
  el.click()
  await Promise.resolve().then().then()
  t.is(log, ['click'])
  // el.use(fn => {
  //   el.on('b', () => log.push('b'))
  //   el.emit('b')
  //   t.is(log, ['b'])
  // })
})

t.todo('on: await', async t => {
  let log = []
  let el = html`<div/>`

  let off

  ;(async () => {
    while (true) {
      off = on(el, 'click')
      let e = await off
      log.push(e.type)
    }
  })()

  t.is(log, [])
  el.click()
  // FIXME: why two ticks here?
  await Promise.resolve().then().then()
  t.is(log, ['click'])

  off()

  el.click()
  // FIXME: why two ticks here?
  await Promise.resolve().then().then()
  t.is(log, ['click'])
})

t.todo('on: multiple events', t => {
  let log = []
  let el = document.createElement('div')
  let off = on(el, 'touchstart click', e => log.push(e.type))

  el.click()
  t.is(log, ['click'])
  fire(el, 'touchstart')
  t.is(log, ['click', 'touchstart'])
  el.click()
  t.is(log, ['click', 'touchstart', 'click'])

  off()

  el.click()
  t.is(log, ['click', 'touchstart', 'click'])
  fire(el, 'touchstart')
  t.is(log, ['click', 'touchstart', 'click'])
})

t.todo('on: await multiple', async t => {
  let log = []
  let el = document.createElement('div')
  document.body.appendChild(el)

  let off

  ;(async () => {
    while(true) {
      off = on(el, 'touchstart focus click')
      let e = await off
      log.push(e.type)
    }
  })()

  t.is(log, [])
  fire(el, 'focus')
  // FIXME: what the heck?
  await Promise.resolve().then().then().then().then().then()
  t.is(log, ['focus'])

  fire(el, 'click')
  await Promise.resolve().then().then().then().then().then()
  t.is(log, ['focus', 'click'])

  off()

  fire(el, 'touchstart')
  await Promise.resolve().then().then().then().then().then()
  t.is(log, ['focus', 'click'])

  document.body.removeChild(el)
})

t.todo('on: sequences handled as return result', async t => {
  let log = []
  let el = html`<div/>`

  let off = on(el, 'in > out', e => {
    log.push('in')
    return () => log.push('out')
  })

  fire(el, 'in')
  await off

  t.is(log, ['in'])
  fire(el, 'out')
  await off
  t.is(log, ['in', 'out'])
  fire(el, 'in')
  await off
  t.is(log, ['in', 'out', 'in'])
  fire(el, 'in')
  fire(el, 'out')
  await off
  t.is(log, ['in', 'out', 'in', 'out'], 'duplicate is ignored')
  fire(el, 'out')
  fire(el, 'in')
  await off
  t.is(log, ['in', 'out', 'in', 'out', 'in'])
})

t.todo('on: nodelist/htmlcollection as target')

t.skip('on: sequences unbind themselves', t => {
  let log = []

  let $el = $`<a.foo/>`

  $el.on('mousedown', e => {
    log.push(1)
    $(e.currentTarget).on('mouseup', e => (log.push(2), () => log.push(4)))
  })

  $el.emit(new MouseEvent('mouseup'))
  t.is(log, [])

  $el.emit(new MouseEvent('mousedown'))
  t.is(log, [1])

  $el.emit(new MouseEvent('mouseup'))
  t.is(log, [1, 2])

  $el.emit(new MouseEvent('mousedown'))
  t.is(log, [1, 2, 1])
})
