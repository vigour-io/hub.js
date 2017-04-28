const r = Date.now
// Date.now = () => r() - 1000000000

const hub = require('../../')
const client = hub({ url: 'ws://localhost:6060' })
const stamp = require('stamp')

var cnt = 0

client.connected.once(true).then(val => {
  // this allrdy has to offset time.. even if no subscription we need it...
  // also all queed things need to update there stamps if there is a big offset
  console.log('????', stamp.offset)
  client.set({
    lolcats: 'ha'
  })
})
