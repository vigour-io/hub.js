const r = Date.now
Date.now = () => r() - 1e6

const hub = require('../../')
const client = hub({ url: 'ws://localhost:6060' })

client.set({ lolcats2: 'ha' })

client.connected.once(true).then(val => {
  client.set({ lolcats: 'more lol' })
})
