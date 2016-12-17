import { Server } from 'uws'
// const vstamp = require('vigour-stamp')
// const client = require('../../../client/downstream')
// const close = require('./server/close')

const create = (hub, port) => {
  const server = hub.downstream = new Server({ port })
  server.on('connection', (socket) => {
    // socket.send('???')
    socket.on('message', (data) => {
      if (data) {
        console.log('incoming on server -->', data)
        // ------------------------
        // if (!data.client && !socket.client) {
        //   hub.emit('error', new Error('no data.client and no socket.client'))
        // } else {
        //   // if (data.client) { client(hub, data, socket) }
        //   // const context = socket.context
        //   // context.receive(data)
        // }
      } else {
        // hub.emit('error', new Error('no payload from incoming message'))
      }
    })
    // also on context switch
    socket.on('close', () => {
      if (socket.client) {
        // const stamp = vstamp.create('disconnect')
        // socket.client.remove(stamp)
        // vstamp.close(stamp)
      }
    })
  })
  return server
}

export default {
  props: {
    server: true,
    port: (hub, val) => {
      console.log('set port!')
      if (val !== hub.port) {
        if (hub.server) {
          console.log('NEW SERVER')
        }
        hub.port = val
        hub.server = create(hub, val)
      }
    }
  }
}

// exports.properties = {
//   downstream: true,
//   port: {
//     type: 'observable',
//     noContext: true,
//     on: {
//       data () {
//         const hub = this.cParent()
//         const val = this.compute()
//         if (hub.downstream) {
//           close(hub)
//           hub.downstream = null
//         }
//         if (val) { create(hub, val) }
//       }
//     }
//   }
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
