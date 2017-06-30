const hub = require('../')
// const test = require('tape')

// test('heartbeat', t => {
  const s = hub({ port: 6060 }) //eslint-disable-line
const client = hub({ url: 'ws://localhost:6060' })
client.connected.on(val => {
  console.log('connected:', val)
  console.log(client.socket)
})
// })
