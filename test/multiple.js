const hub = require('../')
const test = require('tape')
const bs = require('brisky-stamp')

test('client - multiple', t => {
  console.log('\n\n\nMULTIPLE!')

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

  hybrid.subscribe(true)

  const client = hub({
    key: 'client',
    url: 'ws://localhost:6061',
    id: 'client'
  })

  client.subscribe(true)

  client.set({ blurf: 'hello' })

  client.connected.once(true).then(() => {
    t.pass('client is connected')
    hybrid.set({ url: 'ws://localhost:6060' })
  })

  server.get('blurf', {}).once('hello', () => {
    server.set({ blarf: 'yyy' })
    client.get('blarf', {}).once('yyy', () => {
      t.pass('client receives blarf from server')
      server.set({ somefield: null })
      client.set(null)
      hybrid.set(null)
      server.set(null)
      t.end()
    })
  })
})
