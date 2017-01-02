const hub = require('../')
const test = require('tape')

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
    id: 'hybrid',
    port: 6061
  })

  const client1 = hub({
    url: 'ws://localhost:6061',
    id: 'client1',
    context: 'a'
  })

  const client2 = hub({
    url: 'ws://localhost:6061',
    id: 'client2',
    context: 'a'
  })

  // const client3 = hub({
  //   url: 'ws://localhost:6061',
  //   id: 'client3'
  // })

  client2.subscribe(true)

  client2.get('blurf', {}).once('hello', () => {
    t.pass('client2 recieves correct value')
    console.log('??? --->')
  })

  client1.set({ blurf: 'hello' })

  // take care of this after context
  // client1.subscribe({
  //   client: {
  //     title: true
  //   }
  // }, (t) => {
  //   console.log('subscribe on my client object', t.path())
  // })
  // client1.client.set({ title: 'HA!' })
})
