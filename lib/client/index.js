import bs from 'brisky-stamp'
import { send, meta } from './send'
import WebSocket from './websocket'
import { parse, subscribe } from 'brisky-struct'
import { serialize } from '../subscription'
import hash from 'quick-hash'

const connect = (hub, url, reconnect) => {
  const socket = new WebSocket(url)
  const id = hub.id

  hub.set({ clients: { [id]: { id: id } } }, false)

  const client = hub.clients[id]
  hub.set({ client }, false)
  hub.reconnect = null

  const close = () => {
    const stamp = bs.create('disconnect', hub.id)
    hub.set({ connected: false }, stamp)
    bs.close()
    if (!socket.blockReconnect) {
      reconnect = Math.min((reconnect * 1.5), 2000)
      hub.reconnect = setTimeout(connect, reconnect, hub, url, reconnect)
    }
  }

  // need ot handle better...
  socket.onclose = close

  socket.onerror = () => {
    // 1000 mil double check this -- seems dirty!
    // why not add a close method on uws?
    if (typeof window === 'undefined') {
      close()
    } else {
      socket.close()
    }
  }

  socket.onopen = () => {
    const stamp = bs.create('connected', hub.id)
    meta(hub)
    hub.set({ connected: true }, stamp)
    bs.close()
  }

  socket.onmessage = ({ data }) => {
    const stamp = bs.create('upstream')
    // console.warn(JSON.parse(data), stamp, encodeURI(data).split(/%..|./).length - 1)
    hub.set(JSON.parse(data), stamp)
    bs.close(stamp)
  }

  hub.socket = socket
}

const sendToServer = (val, stamp, struct) => {
  const hub = struct.parent(hub => hub.url && hub)
  if (hub && bs.type(stamp) !== 'upstream') { send(hub, val, stamp, struct) }
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
    if (val === null) {
      // remove all props spwaned from this one
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
  upstreamSubscriptions: true,
  url,
  connected: {
    type: 'struct'
    // on: { data: { } } //clients switching
  }
}

// subscribe -- add unsubscribe later
const stub = () => {}

const define = {
  subscribe (subs, cb, raw, tree) {
    if (!raw) { subs = parse(subs) }
    if (this.url) {
      const parsed = serialize(this, subs)
      if (parsed) {
        const key = hash(JSON.stringify(parsed))
        // why not just add them to client... so much easier
        if (!this.upstreamSubscriptions) {
          this.upstreamSubscriptions = { [key]: parsed }
          meta(this)
        } else if (!this.upstreamSubscriptions[key]) {
          this.upstreamSubscriptions[key] = parsed
          meta(this)
        }
      }
    }
    return subscribe(this, subs, cb || stub, tree)
  }
}

const on = { data: { sendToServer } }

export { props, on, define }
