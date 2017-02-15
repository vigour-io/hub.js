const hub = require('../')
const test = require('tape')
const bs = require('brisky-stamp')

test('types', { timeout: 1000 }, t => {
  const scraper = hub({
    _uid_: 'scraper',
    port: 6060,
    somefield: 'somefield!',
    types: {
      rick: {
        val: 'rick',
        hello: true
      },
      james: {
        val: 'james',
        a: {
          b: {
            c: 'c!'
          }
        }
      },
      blurf: {
        bye: true,
        x: true,
        y: true,
        z: true,
        shurf: 'blurf'
      }
    },
    bla: { type: 'rick' },
    blurf: { type: 'james' },
    shurf: { type: 'blurf' }
  })

  const client = hub({
    _uid_: 'client',
    url: 'ws://localhost:6060'
  })

  const client2 = hub({
    _uid_: 'client2',
    url: 'ws://localhost:6060'
  })

  client.subscribe({
    bla: { type: true, val: true },
    blurf: { type: true, val: true }
  })

  client2.subscribe({
    shurf: { smurt: true }
  }, s => {
    if (s.compute() === 'SMURT!') {
      t.pass('client2 receives update on field from updated type')
      client.set(null)
      client2.set(null)
      scraper.set(null)
      t.end()
    }
  })

  Promise.all([
    client.get('blurf', {}).once('james'),
    client.get('bla', {}).once('rick')
  ]).then(() => {
    t.same(client.blurf.keys(), [ 'a' ], 'correct keys on blurf')
    t.equal(client.blurf.compute(), 'james', 'correct val on blurf')
    t.same(client.types.keys(), [ 'rick', 'james' ], 'received correct types')
    // bounce back types
    client.set({ bla: { type: 'blurf' } })
    client.types.blurf.once(s => {
      return s.keys().length > 0
    }).then(val => {
      t.same(
        client.types.blurf.keys(),
        [ 'bye', 'x', 'y', 'z', 'shurf' ],
        'bounced back blurf type'
      )
      client.set({
        types: { hello: { smurt: 'SMURT!' } },
        shurf: { type: 'hello' }
      })
      scraper.types.get([ 'hello', 'smurt' ], {}).once('SMURT!').then(() => {
        t.same(
          scraper.types.keys(),
          [ 'rick', 'james', 'blurf', 'hello' ],
          'received types from client'
        )
      })
    })
  }).catch((err) => {
    console.log('error', err)
  })
})
