import hub from '../lib'
import test from 'tape'

test('client - connect', t => {
  const client = hub({
    key: 'client-hub',
    url: 'ws://localhost:6060',
    id: 'client'
  })

  const server = hub({
    key: 'server',
    port: 6060,
    id: 'server'
  })

  const server2 = hub({
    key: 'server-2',
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
    t.equal(client.get('connected').compute(), false)
    return isConnected(server2)
  }).then(() => {
    t.same(server.clients.keys(), [], 'removed client from server')
    client.set({ url: false })
    t.equal(client.get('connected').compute(), false, 'disconnected')
    return server2.clients.once(clients => clients.keys().length === 0)
  }).then(() => {
    t.pass('server2 has an empty clients array')
    t.equal(client.socket, false, 'socket is removed')
    client.set({ url: 'ws://localhost:6060' })
    return isConnected(server)
  }).then(() => {
    console.log(client.instances)
    client.set(null)
  }).catch(err => {
    console.log(err)
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
