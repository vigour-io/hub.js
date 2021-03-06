const hub = require('../')
const test = require('tape')

test('client - connect', t => {
  var cnt = 0
  const top = hub({
    someHub: {
      key: 'client-hub',
      url: {
        on: () => { cnt++ }
      },
      _uid_: 'client'
    }
  })

  top.someHub.set({ url: 'ws://localhost:6060' })

  t.equal(cnt, 1, 'fired listener on url')

  const client = top.someHub
  const instance = client.create()
  const topInstance = top.create()

  topInstance.set(null)
  instance.set(null)

  const server = hub({
    key: 'server',
    port: 6060,
    _uid_: 'server'
  })

  const server2 = hub({
    key: 'server-2',
    deep: {
      port: 6061,
      _uid_: 'server-2'
    }
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
    return isConnected(server2.deep)
  })
  .then(() => {
    t.same(server.get('clients').keys(), [], 'removed client from server')
    client.set({ url: false })
    t.equal(client.get('connected').compute(), false, 'disconnected')
    return server2.deep.clients.once(clients => clients.keys().length === 0)
  })
  .then(() => {
    t.pass('server2 has an empty clients array')
    t.ok(!client.socket, 'socket is removed')
    client.set({ url: 'ws://localhost:6060' })
    return isConnected(server)
  })
  .then(() => {
    server.set({ port: 6062 })
    client.set({
      url: 'ws://localhost:6062'
    })

    client.subscribe({ val: true })

    client.set({ receiveOnly: true })
    client.set({ hahaha: true })

    return isConnected(server)
      .then(() => new Promise(resolve => {
        setTimeout(() => {
          t.equal(server.subscriptions.length, 1, 'did recieve subscirptions (receiveOnly)')
          t.equal(server.hahaha, undefined, 'did not recieve hahaha (receiveOnly)')
          resolve()
        }, 100)
      }))
  })
  .then(() => {
    client.set(null)
    return server.clients.once(clients => clients.keys().length === 0)
  }).then(() => {
    t.pass('removal of client clears server')
    t.same(server.keys(), [], 'did not remove server')
    server.set(null)
    server2.set(null)
    t.end()
  })
})
