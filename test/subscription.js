const hub = require('../')
const test = require('tape')

// test('subscription - val + fields', t => {
//   const server = hub({
//     _uid_: 'server',
//     port: 6060,
//     a: {
//       val: 'a',
//       b: { c: 'c!' }
//     }
//   })

//   server.set({ nostamp: 'nostamp!' }, false)

//   const client = hub({
//     _uid_: 'client',
//     url: 'ws://localhost:6060'
//   })

//   Promise.all([
//     client.get([ 'a', 'b', 'c' ], {}).once('c!'),
//     client.get([ 'a' ], {}).once('a')
//   ]).then(() => {
//     client.subscribe({ nostamp: true })
//     return client.get('nostamp', {}).once('nostamp!')
//   }).then(() => {
//     t.pass('received correct payload')
//     client.set(null)
//     server.set(null)
//     t.end()
//   })

//   client.subscribe({ a: true })
// })

test('subscription - reuse', t => {
  const server = hub({
    _uid_: 'server',
    port: 6060,
    a: 'hello'
  })

  server.set({ nostamp: 'nostamp!' }, false)

  const client = hub({
    _uid_: 'client',
    url: 'ws://localhost:6060'
  })

  const client2 = hub({
    _uid_: 'client2',
    url: 'ws://localhost:6060'
  })

  client.subscribe({ a: true }, (t) => {
    console.log('yo', t)
  })

  client2.subscribe({ a: true }, (t) => {
    console.log('yo', t)
  })

  Promise.all([
    client.get('a', {}).once('hello'),
    client2.get('a', {}).once('hello')
  ]).then(() => {
    t.pass('received correct payload (reuse)')
    client.set(null)
    client2.set(null)
    server.set(null)
    t.end()
  })
})
