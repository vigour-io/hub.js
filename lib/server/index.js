import { Server } from 'uws'
import incoming from './incoming'
import bs from 'brisky-stamp'

const create = (hub, port) => {
  const server = new Server({ port })
  server.on('connection', (socket) => {
    socket.on('message', (data) => {
      data = JSON.parse(data)
      if (data) {
        console.log(' \nincoming on server id = ' + hub.id + ' -->  \n', data)
        incoming(hub, socket, data)
      }
    })

    const close = () => {
      if (socket.client) {
        const stamp = bs.create('disconnect')
        socket.client.set(null, stamp)
        bs.close()
      }
    }

    socket.on('close', close)
    socket.on('error', () => close())
  })
  return server
}

const props = {
  server: true,
  port: (hub, val) => {
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
