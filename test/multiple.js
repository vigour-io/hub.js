const hub = require('../')
const test = require('tape')
const bs = require('brisky-stamp')

test('client - multiple', t => {
  const server = hub({
    id: 'server',
    key: 'server',
    port: 6060,
    somefield: {
      val: 'somefield!',
      stamp: bs.create('click', 'client', 0.0001)
    }
  })

  const hybrid = hub({
    key: 'hybrid',
    id: 'hybrid',
    port: 6061
  })

  hybrid.subscribe({
    val: true
  }, (t, type) => {
    // console.log('hybrid', t.path(), type)
  })

  const client = hub({
    key: 'client',
    url: 'ws://localhost:6061',
    id: 'client'
  })

  client.subscribe({
    val: true
  }, (t, type) => {
    // console.log('client', t.path(), type)
  })

  console.log('\n\nSET BLURF')
  client.set({ blurf: 'hello' })

  // // url: 'ws://localhost:6060'
  client.connected.once(true).then(() => {
    console.log('🐵 clientIsConnected 🐵')
    hybrid.set({
      url: 'ws://localhost:6060'
    })
  })

  server.get('blurf', {}).once('hello', () => {
    console.log('\n🐵 !!!omfg!!! 🐵')
    // client.set({ blurf: 'x' })
    console.log('\n\n\n---->SET SERVER')
    server.set({ blarf: 'yyy' })

    client.get('blarf', {}).once('yyy', () => {
      console.log('??????? recieved blarf!')
      server.set({ somefield: null })
      // client.set(null)
    })
  })
})
