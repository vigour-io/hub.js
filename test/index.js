import hub from '../lib'
import hubC from '../lib/hub'
import test from 'tape'

test('client - connect', t => {
  const top = hub({
    someHub: {
      key: 'client-hub',
      url: 'ws://localhost:6060',
      id: 'client'
    }
  })

  const client = top.someHub

  // const clientInstance = client.create()

  const topInstance = top.create()
  topInstance.set(null)
  // clientInstance.set(null)
  // client.context = null
  // client.contextLevel = null

  // console.log(hubC.clients)

  const server = hub({
    key: 'server',
    port: 6060,
    id: 'server'
  })

  // console.log(server.clients)
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
    t.equal(client.get('connected').compute(), false, 'disconnected')
    return isConnected(server2)
  })
  .then(() => {
    t.same(server.get('clients').keys(), [], 'removed client from server')
    client.set({ url: false })
    t.equal(client.get('connected').compute(), false, 'disconnected')
    return server2.clients.once(clients => clients.keys().length === 0)
  })
  .then(() => {
    t.pass('server2 has an empty clients array')
    t.equal(client.socket, false, 'socket is removed')
    client.set({ url: 'ws://localhost:6060' })
    return isConnected(server)
  })
  .then(() => {
    console.log('REMOVE CLIENT')
    client.set(null)
    return server.clients.once(clients => clients.keys().length === 0)
  }).then(() => {
    t.pass('removal of client clears server')
    server.set(null)
    server2.set(null)
    t.end()
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
