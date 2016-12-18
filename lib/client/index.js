import bs from 'brisky-stamp'
import { toServer, sendMeta } from '../send'
import WebSocket from './websocket'

const connect = (hub, url, reconnect) => {
  const socket = new WebSocket(url)
  const id = hub.id

  hub.set({ clients: { [id]: { id: id } } }, false)
  // bit weird to make the socket different...

  const client = hub.clients[id]
  hub.set({ client }, false)
  hub.reconnect = null

  const close = () => {
    hub.socket = null
    const stamp = bs.create('disconnect', hub.id)
    hub.set({ connected: false }, stamp)
    bs.close()
    if (!socket.blockReconnect) {
      reconnect = Math.min((reconnect * 1.5) | 0, 2000)
      hub.reconnect = setTimeout(connect, reconnect, hub, url, reconnect)
    }
  }

  socket.onclose = close
  socket.onerror = () => close()

  socket.onopen = () => {
    const stamp = bs.create('connected', hub.id)
    sendMeta(hub)
    hub.set({ connected: true }, stamp)
    bs.close()
  }

  socket.onmessage = data => {
    // const bytes = encodeURI(data).split(/%..|./).length - 1
    // data = JSON.parse(data)
    // can check for handshake
    console.log('incoming:', data)
    // if (data) {
    //   hub.receive(data)
    // }
  }

  hub.socket = socket
}

const sendToServer = (val, stamp, struct) => {
  const hub = struct.parent(hub => hub.url && hub)
  if (hub) { toServer(hub, val, stamp, struct) }
}

const url = (hub, val, stamp) => {
  if (val !== hub.url) {
    if (hub.socket) {
      if (hub.reconnect) {
        clearTimeout(hub.reconnect)
        hub.reconnect = null
      }
      hub.socket.blockReconnect = true
      hub.socket.close()
    }
    let i = -1
    hub.parent(() => { i++ })
    hub.urlIndex = i
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

const props = {
  reconnect: true,
  socket: true,
  urlIndex: true,
  url,
  // dont send it down!
  connected: {
    type: 'struct'
    // on: { data: { } }
  }
}

const on = { data: { sendToServer } }

export { props, on }
