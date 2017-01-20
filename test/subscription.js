const hub = require('../')
const test = require('tape')

test('subscription - val + fields', t => {
  const server = hub({
    _uid_: 'server',
    port: 6060,
    a: {
      val: 'a',
      b: { c: 'c!' }
    }
  })

  server.set({ nostamp: 'nostamp!' }, false)

  const client = hub({
    _uid_: 'client',
    url: 'ws://localhost:6060'
  })

  Promise.all([
    client.get([ 'a', 'b', 'c' ], {}).once('c!'),
    client.get([ 'a' ], {}).once('a')
  ]).then(() => {
    client.subscribe({ nostamp: true })
    return client.get('nostamp', {}).once('nostamp!')
  }).then(() => {
    t.pass('received correct payload')
    client.set(null)
    server.set(null)
    t.end()
  })

  client.subscribe({ a: true })
})
