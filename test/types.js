const hub = require('../')
const test = require('tape')
const bs = require('brisky-stamp')

test('types', t => {
  const scraper = hub({
    id: 'scraper',
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
      blurf: { bye: true, x: true, y: true, z: true }
    },
    bla: {
      type: 'rick'
    },
    blurf: {
      type: 'james'
    }
  })

  const client = hub({
    id: 'client',
    url: 'ws://localhost:6060'
  })

  client.subscribe({
    bla: { type: true, val: true },
    blurf: { type: true, val: true }
  })

  Promise.all([
    client.get('blurf', {}).once('james'),
    client.get('bla', {}).once('rick')
  ]).then(() => {
    t.same(client.blurf.keys(), [ 'a' ], 'correct keys on blurf')
    t.equal(client.blurf.compute(), 'james', 'correct val on blurf')
    t.same(client.types.keys(), [ 'rick', 'james' ], 'recieved correct types')
    bs.on(() => {
      client.set({ bla: { type: 'blurf' } })
      client.types.blurf.once(s => {
        return s.keys().length > 0
      }).then((val) => {
        t.same(
          client.types.blurf.keys(),
          [ 'bye', 'x', 'y', 'z' ],
          'bounced back blurf type'
        )
        client.set({ types: { hello: { smurt: true } } })
        scraper.types.get([ 'hello', 'smurt' ], {}).once(true).then(() => {
          t.same(
            scraper.types.keys(),
            [ 'rick', 'james', 'blurf', 'hello' ],
            'received types from client'
          )
          client.set(null)
          scraper.set(null)
          t.end()
        })
      })
    })
  })
})
