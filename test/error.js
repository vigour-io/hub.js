const hub = require('../')
const test = require('tape')
// const bs = require('brisky-stamp')

test('error', { timeout: 1000 }, t => {
  const s = hub({
    port: 6060,
    ha: true,
    getContext: (context, retrieve, hub, socket) => new Promise((resolve, reject) => {
      if (context === 'flurpy') {
        socket.send(JSON.stringify([void 0, {
          emit: {
            error: {
              hahha: 'hello some error for you'
            }
          }
        }]))
        // reject(new Error('ha!'))
        // so this will become error handler for real --- fix it fix it
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
    console.log('| --->', err)
    if (err.hahha) {
      console.log('go go go')
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
