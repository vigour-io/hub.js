const hub = require('../')
const test = require('tape')
const bs = require('brisky-stamp')

test('client - multiple', t => {
  const server = hub({
    id: 'server',
    key: 'server',
    port: 6060,
    somefield: {
      val: 'somefield!',
      stamp: bs.create('click', 'client', 0.0001)
    }
  })

  const hybrid = hub({
    key: 'hybrid',
    id: 'hybrid',
    port: 6061
  })

  hybrid.subscribe(true)

  const client = hub({
    key: 'client',
    url: 'ws://localhost:6061',
    id: 'client'
  })

  client.set({ blurf: 'hello' })

  client.connected.once(true).then(() => {
    t.pass('client is connected')
    hybrid.set({ url: 'ws://localhost:6060' })
  })

  server.get('blurf', {}).once('hello', () => {
    var cnt = 0
    server.set({ blarf: 'yyy' })
    client.subscribe({
      blurf: true,
      blarf: true
    }, () => {
      cnt++
    })
    client.get('blarf', {}).once('yyy', () => {
      t.pass('client receives blarf from server')
      server.set({ somefield: null })
      cnt = 0
      hybrid.set(null)
      setTimeout(() => {
        server.set(null)
        t.equal(cnt, 0, 'client does not fire when getting removed')
        client.set(null) // do we want to stop firing subs it is kinda wrong...
        t.end()
      }, 50)
    })
  })
})
