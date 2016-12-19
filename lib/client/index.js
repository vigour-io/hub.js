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

  socket.onclose = close

  socket.onerror = () => {
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
    console.warn(JSON.parse(data), stamp, (encodeURI(data).split(/%..|./).length - 1) / 1024 + 'kb')
    hub.set(JSON.parse(data), stamp)
    bs.close(stamp)
  }

  hub.socket = socket
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

// very context as well
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

const connected = {
  type: 'struct'
}

const context = (hub, val) => {
  if (val !== hub.clientContext) {
    hub.clientContext = val
    if (hub.connected && hub.connected.compute() === true) {
      console.log('ai need to re-send some stuff')
      console.log('this will tigh in to sendMeta')
      meta(hub)
    }
  }
}

const props = {
  reconnect: true,
  socket: true,
  urlIndex: true,
  upstreamSubscriptions: true,
  url,
  context,
  connected
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

const on = { data: { send } }

export { props, on, define }
