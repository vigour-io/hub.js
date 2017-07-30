// bit more low lever api
const hub = require('../../')
const test = require('tape')
// const bs = require('stamp')
test('emit custom events', { timeout: 2e3 }, t => {
  const server = hub({
    _uid_: 'server',
    port: 6060
  })
  // need to be able to get server!
  // maybe just use key word $server or just server

  const client = hub({
    _uid_: 'client1',
    url: 'ws://localhost:6060'
  })

  const client2 = hub({
    _uid_: 'client2',
    url: 'ws://localhost:6060'
  })

  client2.on('whisper', (val) => {
    t.pass('receives whisper on client2')
    server.emit('error', new Error('wrong!'))
  })

  client.subscribe({
    clients: { $any: true }
  })

  server.on('error', err => server.broadcast('error', err))

  client.on('error', () => {
    t.pass('receives error')
    client.broadcast('bla', {
      bla: 'emits to all clients'
    })
  })

  client2.on('bla', (val) => {
    t.pass('broadcast from client on client1')
    client.set(null)
    client2.set(null)
    server.set(null)
    t.end()
  })

  client.clients.once().then(() => {
    client.clients.client2.emit('whisper', {
      psst: true
    })
  })
})
