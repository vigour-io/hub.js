import hub from '../lib'
import test from 'tape'

test('client - connect', t => {
  const client = hub({
    url: 'ws://localhost:6060',
    id: 'client'
  })

  const server = hub({
    port: 6060,
    id: 'server'
  })

  const server2 = hub({
    port: 6061,
    id: 'server-2'
  })

  const isConnected = server => client.get('connected').once(true).then(() => {
    t.pass('connected client')
    return server.get('clients', {}).once(clients => {
      if (clients.keys().length) {
        t.same(clients.keys(), [ 'client' ], 'correct clients')
        return true
      }
    })
  })

  isConnected(server).then(() => {
    client.set({ url: 'ws://localhost:6061' })
    t.equal(client.connected.compute(), false)
    return isConnected(server2)
  }).then(() => {
    t.same(server.clients.keys(), [], 'removed client from server')
    client.set({ url: false })
  })
})

//  add receiveOnly as well

// const client = hub({
//   url: 'ws://localhost:6060',
//   id: 'client',
//   nested: {
//     field: {
//       id: 'client',
//       url: 'ws://localhost:6061'
//     }
//   }
// })

// client.subscribe({
//   gurt: true
// }, (t) => {
//   console.log('INCOMING ON CLIENT', t.path())
// })

// setTimeout(() => {
//   const server2 = hub({ //eslint-disable-line
//     port: 6061,
//     id: 'server2'
//   })

//   const server = hub({ //eslint-disable-line
//     port: 6060,
//     id: 'server',
//     gurt: 'its a gurt!'
//   })
// }, 100)

// client.set({
//   hello: true, // to server 1
//   nested: {
//     field: {
//       haha: true // will be send to server2
//     }
//   }
// })
