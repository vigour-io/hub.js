import uws from 'uws'
import incoming from './incoming'
import bs from 'brisky-stamp'

const Server = uws.Server

const create = (hub, port) => {
  const server = new Server({ port })
  server.on('connection', (socket) => {
    socket.on('message', (data) => {
      data = JSON.parse(data)
      if (data) { incoming(hub, socket, data) }
    })

    const close = () => {
      const client = socket.client
      if (client) {
        const stamp = bs.create('disconnect')
        const id = client.key
        console.log(`CLIENT DC ${hub.id} - REMOVE THE CLIENT CONTEXT (missing)`)
        const t = client.parent(2)
        let i = t.subscriptions ? t.subscriptions.length : 0
        while (i--) { // clean this up with system in struct
          if (t.subscriptions[i].id === id) {
            t.subscriptions.splice(i, 1)
          }
        }
        client.set(null, stamp)
        bs.close()
      }
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
  hub.server = null
}

const closeConnections = hub => {
  const clients = hub.clients
  const id = hub.id // to exclude the client (not nessecary)
  if (clients) {
    clients.forEach(client => {
      if (client.socket && client.key !== id) {
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
    if (val === null && !t.context && t === hub) {
      console.log('☠️ REMOVE server ☠️')
      removeServer(hub)
      removePort(hub)
    }
  }, 'port$')
  if (!val) val = null
  if (val !== hub.port) {
    if (hub.server) {
      console.log('🚀 SWITCH SERVER 🚀')
      removeServer(hub)
    }
    if (!val) {
      removePort(hub)
    } else {
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
      if (val === null && (!struct.context || struct.contextLevel === 1)) {
        console.log('10 double check')

        let p = struct
        let hub
        while (p) {
          if (p.port && !p.context) { hub = p }
          p = p.parent()
        }
        if (hub) {
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
            struct._p._removed.push(struct)
          }
        }
      }
    }
  }
}

export { props, on }
