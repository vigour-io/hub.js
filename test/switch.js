const hub = require('../')
const test = require('tape')
const bs = require('brisky-stamp')

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

  const client1 = hub({
    url: 'ws://localhost:6061',
    id: 'client1'
    // context: 'a'
  })

  client1.subscribe({
    ref: {
      $switch: t => {
        console.log(t.path(), t.origin().key  === 'blurf')
        return t.origin().key  === 'blurf' ? {
          b: { val: true }
        } : {
          a: { val: true }
        }
      }
    }
  }, state => {
    console.log('incoming:', state.path())
  })

  client1.set({ ref: [ '@', 'blurf' ] })
})
