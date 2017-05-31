const hub = require('../')
const test = require('tape')

test('context', { timeout: 2000 }, t => {
  const scraper = hub({
    _uid_: 'scraper',
    port: 6060,
    somefield: 'somefield!'
  })

  const hybrid = hub({
    _uid_: 'hybrid',
    url: 'ws://localhost:6060',
    port: 6061
  })

  hybrid.subscribe(true)

  const client1 = hub({
    _uid_: 'client1',
    context: 'pavel',
    url: 'ws://localhost:6061'
  })

  const client2 = hub({
    _uid_: 'client2',
    context: 'pavel',
    url: 'ws://localhost:6061'
  })

  const client3 = hub({
    _uid_: 'client3',
    url: 'ws://localhost:6061'
  })

  const client4 = hub({
    _uid_: 'client4',
    url: 'ws://localhost:6060'
  })

  client1.subscribe(true)
  client2.subscribe(true)
  client3.subscribe(true)

  Promise.all([
    client2.get('blurf', {}).once('hello'),
    client2.get('somefield', {}).once('somefield!'),
    client1.get('somefield', {}).once('somefield!')
  ]).then(() => {
    t.pass('client2 recieves correct value')
    t.pass('client2 receives server-1 somefield!')
    client3.set({ somefield: 'hahaha' })
  })

  Promise.all([
    client1.get('somefield', {}).once('hahaha'),
    client2.get('somefield', {}).once('hahaha')
  ]).then(() => {
    t.pass('client1 & client2 receive context updates')
    client4.set({ smurf: true })
  })

  Promise.all([
    client1.get('smurf', {}).once(true),
    client2.get('smurf', {}).once(true),
    client3.get('smurf', {}).once(true)
  ]).then(() => {
    t.pass('client1 & client2 & client3 receive updates')
    client3.get('blurf', {}).once('hello').then(() => {
      t.pass('client3 receives updates after switching context')
      client1.set({ context: false })
      hybrid.getContext('pavel').clients.once(t => t.keys().length === 2)
      .then(() => {
        t.pass('removed client from hybrid')
        client1.set(null)
        client2.set(null)
        client3.set(null)
        client4.set(null)
        hybrid.set(null)
        scraper.set(null)
        t.end()
      })
    })
    client3.set({ context: 'pavel' })
  })

  client1.set({ blurf: 'hello' })
})

test('context - getContext - error', { timeout: 2000 }, t => {
  const server = hub({
    _uid_: 'server',
    getContext: (context, retrieve, hub, socket) => new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('💩'))
      }, 100)
    }),
    port: 6060
  })
  server.on('error', () => {
    t.equal(server.instances, void 0)
    client.set(null)
    server.set(null)
    t.end()
  })
  const client = hub({
    _uid_: 'client1',
    context: 'pavel',
    url: 'ws://localhost:6060'
  })
})

test('context - getContext', { timeout: 2000 }, t => {
  const server = hub({
    _uid_: 'server',
    getContext: (context, retrieve, hub, socket) => new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(hub)
      }, 100)
    }),
    port: 6060
  })

  const client2 = hub({
    _uid_: 'client2',
    context: 'pavel',
    url: 'ws://localhost:6060'
  })

  client2.set({ x: 'yes' })

  const client = hub({
    _uid_: 'client1',
    context: 'pavel',
    url: 'ws://localhost:6060'
  })

  client.subscribe({ x: true })

  client.get('x', {}).once('yes').then(() => {
    client.set(null)
    client2.set(null)
    server.set(null)
    t.end()
  })
})

test('context - basic', { timeout: 2000 }, t => {
  const scraper = hub({
    _uid_: 'scraper',
    port: 6060,
    somefield: 'somefield!'
  })

  const hybrid = hub({
    _uid_: 'hybrid',
    url: 'ws://localhost:6060',
    port: 6061
  })

  hybrid.subscribe(true)

  const client2 = hub({
    _uid_: 'client2',
    context: 'pavel',
    url: 'ws://localhost:6061'
  })

  const client = hub({
    _uid_: 'client1',
    context: 'pavelx',
    url: 'ws://localhost:6061'
  })

  client.subscribe({ x: true })
  client2.subscribe({ x: true })

  scraper.set({ x: 'x' })

  Promise.all([
    client.get('x', {}).once('x'),
    client2.get('x', {}).once('x')
  ]).then(() => {
    scraper.set(null)
    hybrid.set(null)
    client.set(null)
    client2.set(null)
    t.end()
  })
})

test('context - fire subscriptions on context switch', { timeout: 2000 }, t => {
  const server = hub({
    _uid_: 'server',
    port: 6060,
    getContext: (user, retrieve) => new Promise(resolve => {
      const r = retrieve(user)
      r.set({ user: { id: user } })
      resolve(r)
    })
  })

  var context = 'user'
  const client = hub({
    _uid_: 'client',
    context,
    url: 'ws://localhost:6060'
  })
  const counts = {
    anonymous: 0,
    user: 0
  }

  client.subscribe({ user: { val: true } }, val => {
    counts[val.get(['id', 'compute'])]++
  })

  var i = 0
  const schedule = () => {
    if (i < 5) {
      setTimeout(() => {
        context = context === 'user' ? 'anonymous' : 'user'
        client.set({ context })
        schedule()
      }, 100)
      i++
    } else {
      setTimeout(() => {
        t.deepEquals(counts, { anonymous: 3, user: 3 }, 'events fired enough')
        server.set(null)
        client.set(null)
        t.end()
      }, 100)
    }
  }

  schedule()
})
