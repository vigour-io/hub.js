const hub = require('../../')
const test = require('tape')
const child = require('child_process')

// handle ping
const timeout = (i) => new Promise(resolve => {
  setTimeout(() => resolve(i), 10)
})

test('subscription - time offset', t => {
  const spawned = child.fork('./test/offset/client')
  process.on('exit', () => spawned.kill('SIGINT'))
  const server = hub({ _uid_: 'server', port: 6060 })
  server.set({
    lolcats: true
  })
  var cnt = 0
  server.lolcats.on(() => {
    console.log('lol cats')
    cnt++
  })
})
