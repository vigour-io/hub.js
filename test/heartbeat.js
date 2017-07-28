const hub = require('../')
const test = require('tape')

test('heartbeat', t => {
  // test force dc (how :/)
  const server = hub({
    someHub: {
      key: 'client-hub',
      port: 6060,
      _uid_: 'client'
    }
  })

  // override ua by query param or something?
  const client = hub({
    url: 'ws://localhost:6060'
  })

  setTimeout(() => {
    console.log('💔 Kill connection!!!')
    client.set({ url: false })
  }, 5e3)
})
