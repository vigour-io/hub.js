'use strict'
const test = require('tape')
const Hub = require('../')
const vstamp = require('vigour-stamp')

test('queue', function (t) {
  const subs = {
    a: { val: true },
    b: { val: true },
    c: { val: true },
    reference: { val: true },
    special: {
      reference: { val: true }
    },
    clients: { $any: { val: true } }
  }

  const server = new Hub({
    id: 'server',
    context: false,
    port: 6000,
    clients: { sort: 'key' }
  })

  const client1 = new Hub({
    id: 1,
    url: 'ws://localhost:6000',
    context: 'blurf'
  })

  client1.subscribe(subs)

  const client2 = new Hub({
    id: 2,
    url: 'ws://localhost:6000',
    context: 'blurf'
  })

  client2.subscribe(subs)
  client1.set({ a: 1, b: 1, c: 1 })
  client2.set({ a: 2, b: 2, c: 2 })

  isConnected(true, () => {
    const context = server.getContext('blurf')
    t.equal(context.a.val, 2, '"a" is set by "client2"')
    t.equal(context.b.val, 2, '"b" is set by "client2"')
    t.equal(context.c.val, 2, '"c" is set by "client2"')
    t.same(context.clients.keys(), [ '1', '2' ], 'server-context has clients')
    t.same(client1.clients.keys(), [ '1', '2' ], 'client1 has clients')
    t.same(client2.clients.keys(), [ '2', '1' ], 'client2 has clients')
    server.port.set(false)
    isConnected(false, disconnect)
  })

  function disconnect () {
    t.ok(true, 'disconnected clients')
    client1.a.set(-1)
    client1.b.set(-1)
    client1.set({ reference: client1.a })
    client2.set({
      special: {
        reference: '$root.special.a'
      }
    })
    t.same(client1.clients.keys(), [ '1' ], 'client1 does not have client2')
    t.same(client2.clients.keys(), [ '2' ], 'client2 does not have client1')
    setTimeout(() => {
      client2.a.set(-2)
      client2.b.set(-2)
      setTimeout(() => {
        client1.a.set('a')
        isConnected(true, reconnect)
        server.port.set(6000)
      }, 50)
    }, 50)
  }

  function reconnect () {
    const context = server.getContext('blurf')
    t.ok(true, 'reconnected clients')
    t.equal(context.reference.val, context.a, 'server has reference')
    t.same(context.clients.keys(), [ '1', '2' ], 'server has clients')
    t.same(client1.clients.keys(), [ '1', '2' ], 'client1 has clients')
    t.same(client2.clients.keys(), [ '2', '1' ], 'client2 has clients')
    t.equal(client1.special.reference.val, client1.special.a, 'client1 has "special.reference"')

    const stamp = vstamp.create('special-type-of-stamp')
    client1.c.remove(stamp)
    client1.special.a.set('a', stamp)
    vstamp.close(stamp)
    Promise.all([
      context.c.is(null),
      client2.c.is(null)
    ]).then(() => {
      t.equal(context.a.val, 'a', 'server - "a" is set to client1')
      t.equal(context.b.val, -2, 'server - "b" is set to client2')
      t.equal(context.c, null, 'server - "c" is removed')
      t.equal(client1.a.val, 'a', 'client1 - got "a" from client1')
      t.equal(client1.b.val, -2, 'client1 - got "b" from client2')
      t.equal(client1.c, null, 'client1 - "c" is removed')
      t.equal(client2.a.val, 'a', 'client2 - got "a" from client1')
      t.equal(client2.b.val, -2, 'client2 - got "b" from client2')
      t.equal(client2.c, null, 'client2 - "c" is removed')
      t.equal(client1.reference.val, client1.a, 'client1 has reference')
      t.equal(client2.reference.val, client2.a, 'client2 has reference')
      t.equal(context.special.a.val, 'a', 'server recieved update on a')
      t.equal(client2.special.a.val, 'a', 'client2 recieved update on a')
      const parsed = vstamp.parse(stamp)
      const result = vstamp.create(parsed.type, 1, parsed.val)
      t.equal(context.special.a.stamp, result, 'server recieved correct stamp on a')
      t.equal(client2.special.a.stamp, result, 'client2 recieved correct stamp on a')
      server.remove()
      client2.remove()
      client1.remove()
      t.end()
    }).catch((err) => {
      console.log(err)
    })
  }

  function isConnected (val, cb) {
    function error (err) { throw err }
    Promise.all([
      client1.connected.is(val),
      client2.connected.is(val)
    ]).then(() => {
      setTimeout(cb, 25)
    }).catch(error)
  }
})
