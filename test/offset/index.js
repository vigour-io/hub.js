const hub = require('../../')
const test = require('tape')
const child = require('child_process')

test('subscription - time offset', t => {
  const spawned = child.fork('./test/offset/client')
  process.on('exit', () => spawned.kill('SIGINT'))
  const server = hub({ _uid_: 'server', port: 6060 })
  server.set({
    lolcats: true,
    lolcats2: true
  })
  var cnt = 0

  const done = (val) => {
    if (val && cnt === 1) {
      t.pass('receives lol cats')
      server.set(null)
      spawned.kill('SIGINT')
      t.end()
    }
    cnt++
  }

  server.lolcats.on(done)
  server.lolcats2.on(done)
})
