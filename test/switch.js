const hub = require('../')
const test = require('tape')

test('switch', { timeout: 1e3 }, t => {
  t.plan(3)

  const server = hub({
    _uid_: 'server',
    key: 'server',
    port: 6061,
    pageA: {
      fixedA: 'dataA'
    },
    pageB: {
      fixedB: 'dataB'
    }
  })

  server.on('error', err => {
    console.log('server error', err)
  })

  const client = hub({
    url: 'ws://localhost:6061',
    _uid_: 'client1'
  })

  client.subscribe({
    ref: {
      $switch: t => {
        return t.origin().key === 'pageA' ? {
          fixedA: { val: true }
        } : {
          fixedB: { val: true }
        }
      }
    }
  }, (val, type) => {
    if (type === 'new') {
      t.equal(
        client.get(['ref', 'val']).key,
        val.parent().key,
        `subscription fired correctly for ${val.parent().key}`
      )
    }
  })

  client.set({ ref: [ '@', 'parent', 'pageA' ] })

  client.get([ 'pageA', 'fixedA' ], {}).once('dataA')
    .then(() => {
      client.set({ ref: [ '@', 'parent', 'pageB' ] })

      return client.get([ 'pageB', 'fixedB' ], {}).once('dataB')
    })
    .then(() => {
      t.pass('switched to A and B correctly')
      server.set(null)
      client.set(null)
    })
})
