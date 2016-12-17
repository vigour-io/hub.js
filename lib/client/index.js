import { w3cwebsocket as WS } from 'websocket'
import bs from 'brisky-stamp'

// use default for browser
// import { create, property } from 'brisky-struct'

const connect = (hub, url, reconnect) => {
  console.log('CONNECT')
  const socket = new WS(url)
  // const uid = hub.uid
  // hub.set({ clients: { [id]: { id: id, socket } } }, false)
  // const client = hub.clients[id]
  // hub.set({ client }, false)
  // client.sendMeta()
  hub.reconnect = null
  socket.onerror = () => {
    console.log('error on connect')
    socket.close()
  }

  socket.onopen = () => {
    console.log('connect!')
  }

  socket.onmessage = ({ data }) => {
    // const bytes = encodeURI(data.data).split(/%..|./).length - 1
    data = JSON.parse(data)
    console.log('incoming:', data)
    // if (data) {
    //   hub.receive(data)
    // }
  }
  socket.onclose = () => {
    // if (hub.connected) {
    const stamp = bs.create('disconnect', hub.id)
    hub.set({ connected: false }, stamp)
    bs.close()
    if (!socket.blockReconnect) {
      reconnect = Math.min((reconnect * 1.5) | 0, 2000)
      hub.reconnect = setTimeout(connect, reconnect, hub, url, reconnect)
    }
    // }
  }
  return socket
}

const sendToServer = (val, stamp, hub) => {
  // if ! incoming --> do this
  const socket = hub.parent(hub => hub.socket)
  if (socket) {
    // will make this stamp work for icoming etx
    console.log('lets queue it! -- wil reuse serialize', hub.path(), val, stamp)
    // setTimeout(() => {
    //   // socket.send(JSON.stringify(hub.serialize()))
    // }, 1e3)
    // socket.send(hub.serialize())
    // queue
  }
}

const url = (hub, val, stamp) => {
  console.log('lullz setting url', val)
  if (val !== hub.url) {
    if (hub.socket) {
      if (hub.reconnect) {
        clearTimeout(hub.reconnect)
        hub.reconnect = null
      }
      hub.socket.blockReconnect = true
      hub.socket.close()
    }
    hub.url = val
    hub.set({ connected: false }, stamp)
    hub.socket = connect(hub, val, 50)
  }
}

// const clients => (val, stamp) {
//   const hub = this.cParent()
//   if (this.compute() === false && hub.upstream) {
//     // put this in clients (the file)
//     const clients = hub.clients
//     if (clients && clients.keys().length > 1) {
//       clients.each((client) => {
//         if (
//           client.val !== null &&
//           !client.socket &&
//           client.key != hub.id // eslint-disable-line
//         ) {
//           client.remove(stamp)
//         }
//       })
//     }
//   }
// }

export default {
  props: {
    reconnect: true,
    socket: true,
    url,
    // dont send it down!
    connected: {
      type: 'struct'
      // on: { data: { } }
    }
  },
  on: { data: { sendToServer } }
}

// exports.props = {
//   upstream: true,
//   reconnect: true,
//   queue: true,
//   url: {
//     // this makes the client
//     sync: false,
//     on: {
//       data: {
//         connect (data, stamp) {
//           const hub = this.cParent()
//           const val = this.compute()
//           if (hub.upstream) {
//             if (hub.reconnect) {
//               clearTimeout(hub.reconnect)
//               hub.reconnect = null
//             }
//             hub.upstream.blockReconnect = true
//             hub.upstream.close()
//           }
//           hub.set({ connected: false }, stamp)
//           if (val) { connect(hub, val, 50) }
//         }
//       }
//     }
//   },
//   connected: {
//     sync: false,
//     on: {
//       data: {
//         clients (val, stamp) {
//           const hub = this.cParent()
//           if (this.compute() === false && hub.upstream) {
//             // put this in clients (the file)
//             const clients = hub.clients
//             if (clients && clients.keys().length > 1) {
//               clients.each((client) => {
//                 if (
//                   client.val !== null &&
//                   !client.socket &&
//                   client.key != hub.id // eslint-disable-line
//                 ) {
//                   client.remove(stamp)
//                 }
//               })
//             }
//           }
//         }
//       }
//     }
//   }
// }
