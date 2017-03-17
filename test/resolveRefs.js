const hub = require('../')
const test = require('tape')

test('context', { timeout: 2000 }, t => {
  const scraper = hub({
    _uid_: 'scraper',
    port: 6060,
    page: {}
  })

  const client1 = hub({ // eslint-disable-line
    _uid_: 'client1',
    context: 'friends',
    url: 'ws://localhost:6060'
  })

  setTimeout(() => scraper.set({
    menu: {
      items: [{
        bla: 0,
        val: ['@', 'root', 'page', 'a']
      }]
    },
    page: {
      a: {
        b: ['@', 'root', 'page', 'b']
      },
      b: {
        blur: 0,
        val: ['@', 'root', 'page', 'c']
      },
      c: {}
    }

  }), 100)
})
