const hub = require('../')
const test = require('tape')

test('client - multiple', t => {
  const server = hub({
    _uid_: 'server',
    key: 'server',
    port: 6060,
    somefield: 'somefield!'
  })

  const hybrid = hub({
    key: 'hybrid',
    _uid_: 'hybrid',
    port: 6061
  })

  hybrid.subscribe(true)

  const client = hub({
    key: 'client',
    url: 'ws://localhost:6061',
    _uid_: 'client'
  })

  client.set({ blurf: 'hello' })

  hybrid.set({ url: 'ws://localhost:6060' })

  hybrid.connected.once(true).then(() => {
    t.pass('hybrid is connected')
  })

  client.connected.once(true).then(() => {
    t.pass('client is connected')
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
      setTimeout(() => {
        cnt = 0
        hybrid.set(null)
        setTimeout(() => {
          server.set(null)
          t.equal(cnt, 0, 'client does not fire when getting removed')
          client.set(null) // do we want to stop firing subs it is kinda wrong...
          t.end()
        }, 50)
      }, 50)
    })
  })
})
