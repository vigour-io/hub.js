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
    console.log('whisper! on client2 ', val)
  })

  client.subscribe({
    clients: { $any: true }
  })

  client2.on('bla', (val) => {
    console.log('?????')
    t.pass('broadcast from client on client1')
  })

  /*
  server.on('bla', (val) => {
    t.pass('broadcast from client on server')
  })
  */

  var receiverError = false
  client.on('error', err => {
    receiverError = true
    t.pass('receives error')
  })

  // server can also listen to specific events but that comes later
  server.on('error', err => server.broadcast('error', err))

  client.clients.on(() => {
    client.clients.client2.emit('whisper', {
      psst: true
    })
    server.emit('error', new Error('wrong!'))

    // this does not work yet...

    // just send on all
    client.broadcast('bla', {
      bla: 'emits to all clients'
    })
  })
})
