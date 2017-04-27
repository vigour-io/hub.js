const hub = require('../../')
const client = hub({ url: 'ws://localhost:6060' })
const stamp = require('stamp')

var cnt = 0

client.subscribe({ heavy: true }, t => {
  cnt++
  console.log('offset', stamp.offset)
  console.log(cnt)
})
