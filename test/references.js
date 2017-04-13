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

test.skip('circular references', t => {
  const scraper = hub({
    _uid_: 'scraper',
    port: 6060,
    a: {
      itemList: {
        type: 'List',
        items: {
          b: {
            type: 'Item',
            val: ['@', 'root', 'b']
          },
          c: {
            type: 'Item',
            val: ['@', 'root', 'c']
          }
        }
      }
    },
    b: {
      val: 'valB',
      siblings: ['@', 'root', 'a', 'itemList'],
      other: {
        type: 'other',
        val: ['@', 'parent', 'otherData']
      },
      otherData: 'someText'
    },
    c: {
      val: 'valC',
      siblings: ['@', 'root', 'a', 'itemList']
    }
  })

  const hybrid = hub({
    _uid_: 'hybrid',
    url: 'ws://localhost:6060',
    port: 6161
  })

  hybrid.subscribe(true)

  const client = hub({
    _uid_: 'client',
    url: 'ws://localhost:6161',
    context: 'someContextKey'
  })

  client.subscribe({
    a: {
      itemList: {
        $any: {
          val: true
        }
      }
    }
  })

  setTimeout(() => {
    client.get([ 'a', 'itemList', 'items', 'c' ], {}).once('valC').then(() => {
      t.pass('received circular reference')
      client.set(null)
      hybrid.set(null)
      scraper.set(null)
      t.end()
    })
  }, 100)
})
