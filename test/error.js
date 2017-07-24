const hub = require('../')
const test = require('tape')
// const bs = require('brisky-stamp')

test('error', { timeout: 1000 }, t => {
  const s = hub({
    port: 6060,
    ha: true,
    getContext: (context, retrieve, hub, socket) => new Promise((resolve, reject) => {
      if (context === 'flurpy') {
        // socket.send('#' + JSON.stringify({
        //   hahha: true
        // }))
        // reject(new Error('ha!'))
      } else {
        resolve(retrieve(context))
      }
    })
  })

  const client = hub({
    context: 'flurpy',
    url: 'ws://localhost:6060'
  })

  client.subscribe(true)

  client.on('error', err => {
    if (err.hahha) {
      client.set({
        context: 'blurf'
      })
    }
  })

  client.get('ha', false).once(true).then(() => {
    client.set(null)
    s.set(null)
    t.end()
  })
})
