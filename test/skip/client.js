const hub = require('../../')
const client = hub({ url: 'ws://localhost:6060' })

client.subscribe({ heavy: true }, t => {
  var d = Date.now()
  var i = 1e7
  var bla // eslint-disable-line
  while (i--) { bla = Math.random() }
  console.log('incoming', t.compute(), Date.now() - d, 'ms')
})
