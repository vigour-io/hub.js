const hub = require('../')
const test = require('tape')

// still broken -- both of em

// test('refContext 1', { timeout: 2000 }, t => {
//   const scraper = hub({
//     _uid_: 'scraper',
//     port: 6060,
//     page: {}
//   })

//   const client1 = hub({ // eslint-disable-line
//     _uid_: 'client1',
//     context: 'friends',
//     url: 'ws://localhost:6060'
//   })

//   setTimeout(() => scraper.set({
//     menu: {
//       items: [{
//         bla: 0,
//         val: ['@', 'root', 'page', 'a']
//       }]
//     },
//     page: {
//       a: {
//         b: ['@', 'root', 'page', 'b']
//       },
//       b: {
//         blur: 0,
//         val: ['@', 'root', 'page', 'c']
//       },
//       c: {}
//     }

//   }), 100)
// })

test('refContext 2', { timeout: 3000 }, t => {
  const scraper = hub({
    _uid_: 'scraper',
    port: 6060,
    page: {
      a: { type: 'foo' },
      b: [ '@', 'root', 'page', 'a' ]
    }
  })

  const client1 = hub({ // eslint-disable-line
    _uid_: 'client1',
    context: 'friends',
    url: 'ws://localhost:6060'
  })

  client1.subscribe(true)

  setTimeout(() => {
    scraper.set({
      page: {
        a: { type: 'foo' },
        b: [ '@', 'root', 'page', 'a' ]
      }
    })
    setTimeout(() => {
      scraper.set({
        page: {
          a: { type: 'foo' },
          b: [ '@', 'root', 'page', 'a' ]
        }
      })
      t.end()
    }, 100)
  }, 100)
})
