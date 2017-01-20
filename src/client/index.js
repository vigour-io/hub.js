import bs from 'brisky-stamp'
import { send, meta } from './send'
import WebSocket from './websocket'
import { c, parse, subscribe, struct } from 'brisky-struct'
import serialize from '../subscription/serialize'
import hash from 'string-hash'
import createClient from './create'

// const useragent = typeof window !== 'undefined' && global.navigator.userAgent

const connect = (hub, url, reconnect) => {
  const socket = new WebSocket(url)
  const id = hub.id
  const client = createClient(hub, id, {}, false)

  hub.set({ client }, false)

  hub.reconnect = null

  const close = () => {
    const stamp = bs.create('disconnect', hub.id)
    hub.socket = false
    hub.set({ connected: false }, stamp)
    bs.close()
    if (!socket.blockReconnect && hub.url) {
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
    hub.socket = socket
    meta(hub)
    hub.set({ connected: true }, stamp)
    bs.close()
  }

  // once incoming and make a check for it in the handler itself
  socket.onmessage = ({ data }) => {
    const stamp = bs.create('upstream')
    // console.log('incoming:', JSON.stringify(JSON.parse(data), false, 2))
    hub.set(JSON.parse(data), stamp)
    bs.close(stamp)
  }
}

const removeUrl = hub => {
  hub.url = hub.urlIndex = null
  hub.emitters.set({ data: { url$: null } }, false)
}

const removeSocket = hub => {
  if (hub.reconnect) {
    clearTimeout(hub.reconnect)
    hub.reconnect = null
  }
  if (hub.socket) {
    hub.socket.blockReconnect = true
    hub.socket.close()
  }
}

const url = (hub, val, stamp) => {
  hub.on((val, stamp, t) => {
    if (val === null && !t._c && t === hub) {
      hub.subscriptions = []
      removeUrl(hub)
      removeSocket(hub)
    }
  }, 'url$')
  if (!val) val = null
  if (val !== hub.url) {
    removeSocket(hub)
    hub.set({ connected: false }, stamp)
    if (!val) {
      removeUrl(hub)
    } else {
      let i = -1
      if (hub.key) i++
      hub.parent(() => { i++ })
      hub.urlIndex = i
      hub.url = val
      connect(hub, val, 50)
    }
  }
}

// very context as well
const removeClients = (hub, stamp) => {
  const clients = hub.clients
  if (clients && clients.keys().length > 1) {
    clients.forEach(client => {
      if (
        client.val !== null &&
        // !client.socket &&
        client.key != hub.id // eslint-disable-line
      ) {
        client.set(null, stamp)
      }
    })
  }
}

const connected = { type: 'struct' }

const context = (hub, val, key, stamp) => {
  if (!hub.context || val !== hub.context.compute()) {
    // can also add a listener
    if (!hub.context) {
      c(struct, val, stamp, hub, key)
    } else {
      removeClients(hub, stamp)
      hub.context.set(val, stamp)
    }
    if (hub.connected && hub.connected.compute() === true) meta(hub)
  }
}

const props = {
  reconnect: true,
  socket: true,
  urlIndex: true,
  upstreamSubscriptions: true,
  receiveOnly: true,
  url,
  context,
  connected
}

const stub = () => {}

const define = {
  subscribe (subs, cb, raw, tree) {
    if (!raw) subs = parse(subs)
    const parsed = serialize(this, subs)
    if (parsed) {
      const key = hash(JSON.stringify(parsed))
      if (!this.upstreamSubscriptions) {
        this.upstreamSubscriptions = { [key]: parsed }
        if (this.url) meta(this)
      } else if (!this.upstreamSubscriptions[key]) {
        this.upstreamSubscriptions[key] = parsed
        if (this.url) meta(this)
      }
    }
    return subscribe(this, subs, cb || stub, tree)
  }
}

const on = { data: { send } }

export { props, on, define }