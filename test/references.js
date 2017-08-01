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
      itemList: {
        items: {
          b: {
            val: ['@', 'root', 'b'],
            extra: 1
          },
          c: {
            val: ['@', 'root', 'c'],
            extra: 2
          },
          e: ['@', 'root', 'a', 'itemList', 'items', 'c']
        }
      }
    },
    b: {
      val: 'valB',
      siblings: {
        val: ['@', 'root', 'a', 'itemList'],
        explain: 'siblingsOfB'
      },
      other: {
        val: ['@', 'parent', 'otherData']
      },
      otherData: 'someText',
      f: ['@', 'root', 'c']
    },
    c: {
      val: 'valC',
      siblings: {
        val: ['@', 'root', 'a', 'itemList', 'items'],
        explain: 'siblingsOfC'
      }
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
        items: {
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
    }).catch(e => {
      console.error(e)
    })
  }, 100)
})

test('reference field merge', { timeout: 2e3 }, t => {
  t.plan(9)

  const server = hub({
    _uid_: 'server',
    port: 6061,
    types: {
      list: {
        props: {
          default: {
            tf: 'tv'
          }
        }
      }
    },
    list: {
      i1: {
        items: {
          type: 'list',
          sub1: ['@', 'root', 'list', 'i2'],
          sub2: ['@', 'root', 'list', 'i3']
        }
      },
      i2: {
        items: {
          type: 'list',
          sub1: ['@', 'root', 'list', 'i3'],
          sub2: ['@', 'root', 'list', 'i4']
        },
        other: 'master'
      },
      i3: {
        items: {
          type: 'list',
          sub: ['@', 'root', 'list', 'i4']
        }
      },
      i4: {
        f1: 'v1'
      }
    }
  })

  const client = hub({
    url: 'ws://localhost:6061',
    _uid_: 'client',
    context: 'first',
    props: {
      list: {
        props: {
          default: {
            pf: 'pv'
          }
        }
      }
    }
  })

  client.subscribe({ ref: { $switch: () => ({ items: { val: true } }) } })

  client.set({ ref: ['@', 'root', 'list', 'i1'] })

  client.get(['list', 'i3', 'items', 'sub', 'tf'], {}).once('tv')
    .then(() => {
      client.set({ list: {
        i1: { items: { sub1: { bf: false } }, pf: false },
        i2: { first: false },
        i4: { sub: { bf: true } }
      } })

      client.set({
        context: 'second',
        ref: ['@', 'root', 'list', 'i1']
      })

      return client.get(['list', 'i4', 'sub', 'bf']).once(null)
    })
    .then(() => {
      client.set({ list: {
        i1: { items: { sub2: { bf: true } } },
        i2: { other: 'second' },
        i3: { items: { sub: { bf: false } }, pf: false },
        i4: { f1: true }
      } })

      client.set({
        context: 'first',
        ref: ['@', 'root', 'list', 'i2']
      })

      setTimeout(() => {
        client.set({ ref: ['@', 'root', 'list', 'i1'] })
      }, 50)

      return client.get(['list', 'i1', 'items', 'sub1', 'bf'], {}).once(false)
    })
    .then(() => {
      t.equals(
        client.get(['list', 'i1', 'items', 'sub1', 'bf', 'compute']), false,
        'i1 sub1 branch field is correct'
      )
      t.equals(
        client.get(['list', 'i1', 'items', 'sub2', 'tf', 'compute']), 'tv',
        'i1 sub1 type field is correct'
      )
      // i1 pf override won't get synced back
      // because it's out of subscription range
      t.equals(
        client.get(['list', 'i1', 'pf', 'compute']), undefined,
        'i1 props field override is not there'
      )
      // we need to fix this eventually
      // guard for sending parent on client
      // t.equals(
      //   client.get(['list', 'i2', 'first', 'compute']), false,
      //   'i2 branch field is correct'
      // )
      t.equals(
        client.get(['list', 'i4', 'sub', 'bf', 'compute']), true,
        'i4 sub branch field is correct'
      )

      client.set({
        context: 'second',
        ref: ['@', 'root', 'list', 'i3']
      })

      setTimeout(() => {
        client.set({ ref: ['@', 'root', 'list', 'i1'] })
      }, 50)

      return client.get(['list', 'i1', 'items', 'sub2', 'bf'], {}).once(true)
    })
    .then(() => {
      t.equals(
        client.get(['list', 'i1', 'items', 'sub2', 'bf', 'compute']), true,
        'i1 sub2 branch field is correct'
      )
      t.equals(
        client.get(['list', 'i2', 'other', 'compute']), 'second',
        'i2 branch field is correct'
      )
      t.equals(
        client.get(['list', 'i3', 'items', 'sub', 'bf', 'compute']), false,
        'i3 sub branch field is correct'
      )
      t.equals(
        client.get(['list', 'i3', 'items', 'sub', 'tf', 'compute']), 'tv',
        'i3 sub type field is correct'
      )
      // we need to fix this eventually
      // something with cache
      // t.equals(
      //   client.get(['list', 'i3', 'pf', 'compute']), false,
      //   'i3 props field override is correct'
      // )
      t.equals(
        client.get(['list', 'i4', 'f1', 'compute']), true,
        'i4 master field override is correct'
      )

      server.set(null)
      client.set(null)
    })
})
