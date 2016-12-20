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
        const id = client.id
        // need to do more ofcourse...
        // make upstream and downstream client so listeners are shared
        console.log(`CLIENT DC ${hub.id} - REMOVE SUBSCRIPTION`)
        console.log(`CLIENT DC ${hub.id} - MAYBE REMOVE THE CLIENT CONTEXT`)
        const t = client.parent(2)
        let i = t.subscriptions ? t.subscriptions.length : 0
        while (i--) {
          console.log(t.subscriptions[i].id)
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
  const id = hub.id // (to exclude the client)
  if (clients) {
    clients.forEach(client => {
      if (client.socket && client.key !== id) {
        client.socket.close()
      }
    })
  }
}

const port = (hub, val) => {
  hub.on((val, stamp, t) => {
    if (val === null && !t.context && t === hub) {
      console.log('☠️ REMOVE server ☠️')
      removeServer(hub)
      hub.port = null
    }
  }, 'port$')
  if (!val) val = null
  if (val !== hub.port) {
    if (hub.server) {
      console.log('🚀 SWITCH SERVER 🚀')
      removeServer(hub)
    }
    if (!val) {
      hub.port = null
    } else {
      hub.port = val
      hub.server = create(hub, val)
    }
  }
}

const props = {
  server: true,
  port
}

export { props }
