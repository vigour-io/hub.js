const hub = require('../')
const test = require('tape')

test('references', t => {
  const scraper = hub({
    _uid_: 'scraper',
    port: 6060,
    a: {
      b: {
        c: 'c!'
      }
    },
    bla: [ '@', 'parent', 'a', 'b', 'c' ]
  })

  const client = hub({
    _uid_: 'client',
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

test('circular references', t => {
  const scraper = hub({
    _uid_: 'scraper',
    port: 6060,
    a: {
      items: {
        b: ['@', 'root', 'b'],
        c: ['@', 'root', 'c']
      }
    },
    b: {
      val: 'valB',
      siblings: ['@', 'root', 'a', 'items']
    },
    c: {
      val: 'valC',
      siblings: ['@', 'root', 'a', 'items']
    }
  })

  const client = hub({
    _uid_: 'client',
    url: 'ws://localhost:6060'
  })

  client.subscribe(true)

  client.get([ 'a', 'items', 'c', 'siblings', 'b' ], {}).once('valB').then(() => {
    t.pass('received circular reference')
    client.set(null)
    scraper.set(null)
    t.end()
  })
})
