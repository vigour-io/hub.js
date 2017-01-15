const hub = require('../')
const test = require('tape')

test('subscription - val + fields', t => {
  const server = hub({
    id: 'server',
    port: 6060,
    a: {
      val: 'a',
      b: { c: 'c!' }
    }
  })

  const client = hub({
    id: 'client',
    url: 'ws://localhost:6060'
  })

  Promise.all([
    client.get([ 'a', 'b', 'c' ], {}).once('c!'),
    client.get([ 'a' ], {}).once('a')
  ]).then(() => {
    t.pass('received correct payload')
    client.set(null)
    server.set(null)
    t.end()
  })

  client.subscribe({ a: true })
})