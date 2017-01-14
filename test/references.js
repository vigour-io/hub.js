const hub = require('../')
const test = require('tape')

test('references', t => {
  const scraper = hub({
    id: 'scraper',
    port: 6060,
    a: {
      b: {
        c: 'c!'
      }
    },
    bla: [ '@', 'parent', 'a', 'b', 'c' ]
  })

  const client = hub({
    id: 'client',
    url: 'ws://localhost:6060'
  })

  client.subscribe({ bla: true })

  client.get([ 'a', 'b', 'c' ], {}).once('c!').then(() => {
    t.pass('received reference')
    client.set(null)
    scraper.set(null)
    t.end()
  })
})
