import uws from 'uws'
import incoming from './incoming'
import bs from 'brisky-stamp'
import { removeClient, removeSubscriptions } from './remove'

const Server = uws.Server

const create = (hub, port) => {
  const server = new Server({ port })
  server.on('connection', socket => {
    socket.useragent = socket.upgradeReq && socket.upgradeReq.headers['user-agent']
    socket.on('message', (data) => {
      data = JSON.parse(data)
      if (data) { incoming(hub, socket, data) }
    })

    const close = () => {
      if (socket.client) removeClient(socket.client)
    }

    socket.on('close', close)
    // socket.on('error', () => close()) // need to do something here as well no leaks!
  })
  return server
}

const removeServer = hub => {
  const server = hub.server
  const instances = hub.instances
  closeConnections(hub)
  for (let i = 0, len = instances && instances.length; i < len; i++) {
    closeConnections(instances[i])
  }
  server.httpServer.close()
  // remove all clients subscriptions
  hub.server = null
}

const closeConnections = hub => {
  const clients = hub.clients
  const id = hub.id // to exclude the client (not nessecary)
  if (clients) {
    clients.forEach(client => {
      if (client.socket && client.key !== id) {
        client.val = null
        removeSubscriptions(hub, client.key)
        client.socket.close()
      }
    })
  }
}

const removePort = hub => {
  hub.port = null
  hub.serverIndex = null
  hub.emitters.set({ data: { port$: null } })
}

const port = (hub, val) => {
  hub.on((val, stamp, t) => {
    if (val === null && !t._c && t === hub) {
      removeServer(hub)
      removePort(hub)
    }
  }, 'port$')
  if (!val) val = null
  if (val !== hub.port) {
    if (hub.server) {
      removeServer(hub)
    }
    if (!val) {
      removePort(hub)
    } else {
      console.log(`💫  hub listening on ${val} 💫`)
      hub.port = val
      let i = -1
      if (hub.key) i++
      hub.parent(() => { i++ })
      hub.serverIndex = i
      hub.server = create(hub, val)
    }
  }
}

const props = {
  server: true,
  serverIndex: true,
  port
}

var removedInProgress
const on = {
  data: {
    remove$: (val, stamp, struct) => {
      if (val === null && (!struct._c || struct._cLevel === 1)) {
        let p = struct
        let hub
        while (p) {
          if (p.port && !p._c) { hub = p }
          p = p.parent()
        }
        if (hub) {
          // probably not working correctly with context
          const target = struct.parent()
          if (target) {
            if (!target._removed) {
              target._removed = []
              if (!removedInProgress) {
                removedInProgress = []
                bs.on(() => {
                  let i = removedInProgress.length
                  while (i--) {
                    delete removedInProgress[i]._removed
                  }
                })
              }
              removedInProgress.push(target)
            }
            target._removed.push(struct)
          }
        }
      }
    }
  }
}

export { props, on }
