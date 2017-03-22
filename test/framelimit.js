const hub = require('../')
const test = require('tape')

var server, client

test('frame limit', { timeout: 4000 }, t => {
  server = hub({
    key: 'server',
    _uid_: 'server',
    port: 6000
  })

  client = hub({
    key: 'client',
    _uid_: 'client',
    url: 'ws://localhost:6000',
    context: false
  })

  var someData = ''
  var i = 100000
  while (i-- > 0) {
    someData += '\nhello wtf is this :)'
  }

  console.log('bytes', Buffer.from(someData).byteLength)

  server.set({ someData })

  client.subscribe({ someData: true }, () => {
    t.ok(true, 'subscription fired')
    client.set(null)
    server.set(null)
    t.end()
  })
})
