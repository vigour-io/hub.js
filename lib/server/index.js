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

const props = {
  server: true,
  port: (hub, val) => {
    // hub.on((val, stamp, t) => {
    //   if (val === null) {
    //     removeUrl(hub)
    //     removeSocket(hub)
    //   }
    // }, 'url$')
    console.log('set port!')
    if (val !== hub.port) {
      if (hub.server) {
        console.log('NEW SERVER KILL OLD ONE')
      }
      hub.port = val
      hub.server = create(hub, val)
    }
  }
}

export { props }

// exports.properties = {
//   downstream: true,
// }

// exports.on = {
//   remove: {
//     port () {
//       if (this.port && this.hasOwnProperty('port')) {
//         this.port.set(null)
//       }
//     }
//   }
// }

// module.exports = function closeServer (hub) {
//   const server = hub.downstream
//   const instances = hub.instances
//   closeConnections(hub)
//   for (let i = 0, len = instances && instances.length; i < len; i++) {
//     closeConnections(instances[i])
//   }
//   server.httpServer.close()
// }

// function closeConnections (hub) {
//   const clients = hub.clients
//   const id = hub.id
//   // 1000x double check this
//   clients.each((client) => {
//     if (client.upstream && client.upstream.compute() === id) {
//       client.socket.close()
//     }
//   })
// }
