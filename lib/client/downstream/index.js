'use strict'
const createContext = require('./context')
const vstamp = require('vigour-stamp')

module.exports = function (hub, data, socket) {
  const client = data.client
  const id = client.id
  const parsed = vstamp.parse(client.stamp)
  const stamp = vstamp.create(parsed.type)
  const context = createContext(hub, socket, client, stamp, client.context)
  // ------------------------------
  if (client.subscriptions) {
    for (let i in client.subscriptions) {
      context.subscribe(client.subscriptions[i], void 0, void 0, stamp, context.clients[id], i)
    }
  }
  vstamp.close(stamp)
  delete data.client
}
