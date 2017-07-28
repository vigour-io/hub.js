const hub = require('../')
const test = require('tape')

test('heartbeat', { timeout: 20e3 }, t => {
  const server = hub({
    someHub: {
      key: 'client-hub',
      _uid_: 'server',
      _forceHeartbeat_: true,
      port: 6060
    }
  })

  // override ua by query param or something?
  const client = hub({
    url: 'ws://localhost:6060',
    _uid_: 'client'
  })

  setTimeout(() => {
    server.someHub.clients.on(() => {
      t.pass('removed client based on heartbeat')
      server.set(null)
      client.set(null)
      t.end()
    })
    console.log('disconnect client')
    client.set({ url: false })
  }, 5e3)
})
