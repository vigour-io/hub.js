const hub = require('../')
const test = require('tape')

test('context', t => {
  const scraper = hub({
    id: 'scraper',
    port: 6060,
    somefield: 'somefield!'
  })

  const hybrid = hub({
    id: 'hybrid',
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

  const client4 = hub({
    id: 'client4',
    url: 'ws://localhost:6060'
  })

  client2.subscribe(true)
  client1.subscribe(true)

  Promise.all([
    client2.get('blurf', {}).once('hello'),
    client2.get('somefield', {}).once('somefield!'),
    client1.get('somefield', {}).once('somefield!')
  ]).then(() => {
    t.pass('client2 recieves correct value')
    t.pass('client2 receives server-1 somefield!')
    client3.set({ somefield: 'hahaha' })
  })

  Promise.all([
    client1.get('somefield', {}).once('hahaha'),
    client2.get('somefield', {}).once('hahaha')
  ]).then(() => {
    t.pass('client1 & client2 receive context updates')
    client4.set({ smurf: true })
  })

  Promise.all([
    client1.get('smurf', {}).once(true),
    client2.get('smurf', {}).once(true)
  ]).then(() => {
    t.pass('client1 & client2 receive updates from client connected to server')
    client4.set({ smurf: true })
  })


  client1.set({ blurf: 'hello' })
  // client1.client.set({ iAmTheReceiver: true })

})
