import bs from 'brisky-stamp'
import { send, meta } from './send'
import WebSocket from './websocket'
import { create, parse, subscribe, struct, emitterProperty } from 'brisky-struct'
import serialize from '../subscription/serialize'
import hash from 'string-hash'
import createClient from './create'

const connect = (hub, url, reconnect) => {
  const socket = new WebSocket(url)
  const client = hub.client || createClient(hub, {}, false)

  hub.set({ client }, false)

  hub.reconnect = null

  const close = () => {
    const stamp = bs.create()
    hub.socket = false
    hub.set({ connected: false }, stamp)
    bs.close()
    if (!socket.blockReconnect && hub._url_) {
      reconnect = Math.min((reconnect * 1.5), 2000)
      hub.reconnect = setTimeout(connect, reconnect, hub, url, reconnect)
    }
  }

  socket.onclose = close

  socket.onerror = typeof window === 'undefined'
    ? close
    : () => socket.close()

  socket.onopen = () => {
    const stamp = bs.create()
    hub.socket = socket
    if (hub.emitters && hub.emitters.incoming) {
      enableIncomingListener(socket, hub)
    }
    meta(hub)
    hub.set({ connected: true }, stamp)
    bs.close()
  }

  // use outside function non anon since its slowe apprantly
  socket.onmessage = (data) => {
    data = data.data
    if (!hub.receiveOnly) {
      hub.receiveOnly = true
      hub.set(JSON.parse(data), false)
      hub.receiveOnly = null
    } else {
      hub.set(JSON.parse(data), false)
    }
    bs.close()
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
  hub.socket = false
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
        create({
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
        }, stamp, struct, hub, key)
      }
      if (/^https?/.test(val)) val = val.replace(/^http/, 'ws')
      hub.url.set(val, stamp)
    }
  }
}

const removeClients = (hub, stamp) => {
  const clients = hub.clients
  if (clients && clients.keys().length > 1) {
    clients.forEach((client, key) => {
      if (
        client.val !== null &&
        client !== hub.client
      ) {
        client.set(null, stamp)
        delete clients[key]
      }
    })
  }
}

const connected = {
  type: 'struct',
  on: {
    data: {
      removeClients: (val, stamp, t) => {
        if (t.compute() === false) {
          // all instances! -- fix this
          removeClients(t._p, stamp)
        }
      }
    }
  }
}

const contextStruct = struct.create({
  props: {
    default: {
      on: {
        data: {
          updateParent: (val, stamp, t) => {
            console.log('👻 GO UPDATE PARENT!!! 👻')
            t.parent().emit('data', val, stamp)
          }
        }
      }
    }
  }
})

const contextIsNotEqual = (val, context) => {
  if (val && typeof val === 'object') {
    for (let field in val) {
      if (!context[field] || val[field] !== context[field].compute()) {
        console.log('😜', field)
        return true
      }
    }
  } else {
    return val !== context.compute()
  }
}

const context = (hub, val, key, stamp) => {
  if ((!hub.context && val) || (hub.context && contextIsNotEqual(val, hub.context))) {
    // console.log('⚽️ fire fire fire FLAME context ⚽️', val, stamp)
    if (!hub.context) {
      create(val, stamp, contextStruct, hub, key)
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
  subscribe (subs, cb, raw, tree, forceUpstream) {
    if (!raw) subs = parse(subs)
    if (!this.receiveOnly || forceUpstream) {
      const parsed = serialize(this, subs)
      if (parsed) {
        if (forceUpstream) {
          parsed.__force__ = true
        }
        // why not keep it stringified? -- saves lots of speed
        const key = hash(JSON.stringify(parsed))
        if (!this.upstreamSubscriptions) {
          this.upstreamSubscriptions = {}
          this.upstreamSubscriptions[key] = parsed
          if (this.url) meta(this)
        } else if (!this.upstreamSubscriptions[key]) {
          this.upstreamSubscriptions[key] = parsed
          if (this.url) meta(this)
        }
      }
    }
    return subscribe(this, subs, cb || stub, tree)
  }
}

const enableIncomingListener = (socket, hub) => {
  if (!socket.incomingOverride) {
    socket.incomingOverride = true
    const field = typeof window === 'undefined' ? 'internalOnMessage' : 'onmessage'
    const msg = hub.socket[field]
    socket[field] = (data) => {
      hub.emit('incoming', data)
      msg(data)
    }
  }
}

const on = {
  data: { send },
  props: {
    incoming: (t, val, key, stamp) => {
      const hub = t._p
      if (hub.socket) enableIncomingListener(hub.socket, hub)
      return emitterProperty(t, val, key, stamp)
    }
  }
}

export { props, on, define }
