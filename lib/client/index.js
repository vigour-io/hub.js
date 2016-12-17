import { w3cwebsocket as WS } from 'websocket'
import bs from 'brisky-stamp'
import { toServer } from '../send'
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
    const stamp = bs.create('connected', hub.id)
    hub.set({ connected: true }, stamp)
    bs.close()
  }

  socket.onmessage = ({ data }) => {
    // const bytes = encodeURI(data).split(/%..|./).length - 1
    // data = JSON.parse(data)
    console.log('incoming:', data)
    // if (data) {
    //   hub.receive(data)
    // }
  }

  socket.onclose = () => {
    console.log('DC')
    const stamp = bs.create('disconnect', hub.id)
    hub.set({ connected: false }, stamp)
    bs.close()
    if (!socket.blockReconnect) {
      reconnect = Math.min((reconnect * 1.5) | 0, 2000)
      hub.reconnect = setTimeout(connect, reconnect, hub, url, reconnect)
    }
  }

  hub.socket = socket
}

const sendToServer = (val, stamp, struct) => {
  const hub = struct.parent(hub => hub.socket && hub)
  if (hub) { toServer(hub, val, stamp, struct) }
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
    connect(hub, val, 50)
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
