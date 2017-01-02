const hub = require('../')
const test = require('tape')

test('context', t => {
  const scraper = hub({
    id: 'scraper',
    port: 6060,
    somefield: {
      val: 'somefield!'
    }
  })

  const hybrid = hub({
  id: 'theHub',
    url: 'ws://localhost:6060',
    port: 6061
  })

  hybrid.subscribe(true)

  const client1 = hub({
    id: 'client1',
    url: 'ws://localhost:6061',
    context: 'pavel'
  })

  const client2 = hub({
    id: 'client2',
    url: 'ws://localhost:6061',
    context: 'pavel'
  })

  const client3 = hub({
    id: 'client3',
    url: 'ws://localhost:6061'
  })

  client2.subscribe(true)

  client2.get('blurf', {}).once('hello', () => {
    t.pass('client2 recieves correct value')
    console.log('??? --->', hybrid.getContext('pavel').keys(), hybrid.clients.keys())
    console.log(hybrid.getContext('pavel').clients.client1.keys())
  })

  client1.set({ blurf: 'hello' })
  // client1.client.set({
  //   iAmTheReceiver: true
  // })

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
