'use strict'
const vstamp = require('vigour-stamp')
const parse = require('vigour-ua')
// call some functions from context folder
// context is where most of this stuff is
// ua on the server or somewhere else?

module.exports = function createContext (hub, socket, client, stamp) {
  const id = client.id
  const upgrade = socket.upgradeReq
  const ua = upgrade.headers['user-agent']
  // 1000 double check this
  const ip = socket.upgradeReq.connection.remoteAddress
  const clientobj = { id, ip, upstream: hub.id }

  if (ua) {
    // cant we just do this on the client?
    const parsed = parse(ua)
    clientobj.device = parsed.device
    clientobj.platform = parsed.platform
    clientobj.browser = parsed.browser
    clientobj.ua = ua
  } else {
    clientobj.device = 'server'
    clientobj.platform = 'node.js'
  }
  clientobj.cache = {} // reuse old ONE!

  var context = client.context
  var contextHub
  if (context === void 0) {
    context = ip
  }
  if (context === false) {
    contextHub = hub
  } else {
    contextHub = hub.getContext(context)
    if (!contextHub) {
      contextHub = new hub.Constructor({ context: context }, stamp)
    }
  }

  // need to remove queue after switch
  if (contextHub !== hub && contextHub.clients && !contextHub.hasOwnProperty('clients')) {
    if (contextHub.clients === hub.clients) {
      contextHub.clients = void 0
      contextHub.set({ clients: {} })
      if (hub.clients.sort) {
        // so should not do this but just make an instance that you reset (where you keep listeners etc)
        contextHub.clients.set({ sort: hub.clients.sort })
      }
    }
  }

  contextHub.set({ clients: { [id]: clientobj } }, stamp)
  const hClient = contextHub.clients[id]
  // not correct since we want that stamp here its extra meta info
  hClient.ip.stamp = vstamp.create('ip', contextHub.id, false, true) // no need to close
  hClient.socket = socket
  socket.client = hClient

  if (socket.context && socket.context !== contextHub) {
    console.log('switch content take over CACHE')
    if (hub.inprogress[hub.id][id]) {
      console.log('NO WAY!!! its switching context and is still in progress of sending stuff danger times')
    }
    const oldClient = socket.context.get([ 'clients', id ])

    if (!oldClient) {
      console.log('wtf is happening>???? no old client')
    } else {
      oldClient.remove()
    }
  }

  socket.context = contextHub
  return contextHub
}
