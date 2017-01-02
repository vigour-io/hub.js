const hub = require('../')
const test = require('tape')

test('switch', t => {
  const server = hub({
    id: 'server',
    port: 6061,
    bla: {
      a: 'hello'
    },
    blurf: {
      b: 'hello'
    }
  })

  server.on('error', err => {
    console.log('dirtface', err)
  })

  const client = hub({
    url: 'ws://localhost:6061',
    id: 'client1'
    // context: 'a'
  })

  client.subscribe({
    ref: {
      $switch: t => {
        return t.origin().key  === 'blurf' ? {
          b: { val: true }
        } : {
          a: { val: true }
        }
      }
    }
  })

  client.set({ ref: [ '@', 'parent', 'blurf' ] })

  client.get([ 'blurf', 'b' ], {}).once('hello').then(() => {
    t.pass('received blurf.b')
    server.set(null)
    client.set(null)
    t.end()
  })
})
