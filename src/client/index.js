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
  const id = hub._uid_
  const client = createClient(hub, id, {}, false)

  hub.set({ client }, false)

  hub.reconnect = null

  const close = () => {
    const stamp = bs.create('disconnect', hub._uid_)
    hub.socket = false
    hub.set({ connected: false }, stamp)
    bs.close()
    if (!socket.blockReconnect && hub._url_) {
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
    const stamp = bs.create('connected', hub._uid_)
    hub.socket = socket
    meta(hub)
    hub.set({ connected: true }, stamp)
    bs.close()
  }

  // once incoming and make a check for it in the handler itself
  socket.onmessage = ({ data }) => {
    const stamp = bs.create('upstream')
    console.error('INCOMING!', JSON.parse(data))
    const d = JSON.parse(data)
    if (d.page && d.page.things && d.page.things.list && d.page.things.list.items) {
      hub.set(JSON.parse(data), stamp)
    } else {
      hub.set(JSON.parse(data), stamp)
    }
    bs.close(stamp)
  }
}

const removeUrl = hub => {
  hub.url = hub._url_ = hub.urlIndex = null
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

const url = (hub, val, key, stamp) => {
  hub.on((val, stamp, t) => {
    if (val === null && !t._c && t === hub) {
      hub.subscriptions = []
      removeUrl(hub)
      removeSocket(hub)
    }
  }, 'url$')

  if (!val) val = null
  if ((!hub.url && val) || (hub.url.compute() !== val)) {
    removeSocket(hub)
    if (!val) {
      hub.set({ connected: false }, stamp)
      hub._url_ = null
      if (hub.url) hub.url.set(null, stamp)
    } else {
      if (!hub.url) {
        c(struct, {
          on: {
            data: {
              url: (val, stamp, struct) => {
                val = struct.compute()
                if (val) {
                  hub.set({ connected: false }, stamp)
                  let i = -1
                  if (hub.key) i++
                  hub.parent(() => { i++ })
                  hub.urlIndex = i // use this for checks
                  hub._url_ = val
                  connect(hub, val, 50)
                } else {
                  hub._url_ = null
                }
              }
            }
          }
        }, stamp, hub, key)
      }
      hub.url.set(val, stamp)
    }
  }
}

const removeClients = (hub, stamp) => {
  const clients = hub.clients
  if (clients && clients.keys().length > 1) {
    clients.forEach(client => {
      if (
        client.val !== null &&
        client.key != hub._uid_ // eslint-disable-line
      ) {
        client.set(null, stamp)
      }
    })
  }
}

const connected = { type: 'struct' }

const context = (hub, val, key, stamp) => {
  if (!hub.context || val !== hub.context.compute()) {
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
