const hub = require('../')
const test = require('tape')
const bs = require('brisky-stamp')

test('context', t => {
  // const server = hub({
  //   id: 'server',
  //   key: 'server',
  //   port: 6060,
  //   somefield: {
  //     val: 'somefield!',
  //     stamp: bs.create('click', 'client', 0.0001)
  //   }
  // })

  const hybrid = hub({
    key: 'hybrid',
    id: 'hybrid',
    port: 6061
  })

  hybrid.subscribe(true)

  const client1 = hub({
    url: 'ws://localhost:6061',
    id: 'client1',
    context: 'a'
  })

  // const client2 = hub({
  //   url: 'ws://localhost:6061',
  //   id: 'client2',
  //   context: 'b'
  // })

  // client

  client1.set({ blurf: 'hello' })
})
