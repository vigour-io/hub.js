const hub = require('../../')
const test = require('tape')
const child = require('child_process')

test('subscription - val + fields', t => {
  const spawned = child.fork('./test/skip/client')
  process.on('exit', () => spawned.kill('SIGINT'))

  const server = hub({ _uid_: 'server', port: 6060 })

  server.get('clients', {}).once().then(t => {
    server.set({
      heavy: function * () {
        var i = 10
        while (i--) { yield i }
      }
    })
  })
})
