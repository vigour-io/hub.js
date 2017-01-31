import bs from 'brisky-stamp'
import { send, meta } from './send'
import WebSocket from './websocket'
import { create, parse, subscribe, struct } from 'brisky-struct'
import serialize from '../subscription/serialize'
import hash from 'string-hash'
import createClient from './create'

const connect = (hub, url, reconnect) => {
  const socket = new WebSocket(url)
  // t, val, stamp, useragent, id
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

  if (typeof window === 'undefined') {
    socket.hackyOnClose = close
  }

  socket.onerror = typeof window === 'undefined'
    ? close
    : () => socket.close()

  socket.onopen = () => {
    const stamp = bs.create()
    hub.socket = socket
    meta(hub)
    hub.set({ connected: true }, stamp)
    bs.close()
  }

  socket.onmessage = (data) => {
    data = data.data
    // console.warn('INCOMING\n', JSON.parse(data))
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
    console.log('GO GO GOREMOVE', hub.socket._readyState)
    if (hub.connected.compute() === false || !hub.socket._readyState) {
      console.log('hacky!')
      hub.socket.hackyOnClose()
    } else {
      hub.socket.close()
    }
  }
  // hub.socket = false
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
    console.log('😜 ?????')
    return val !== context.compute()
  }
}

const context = (hub, val, key, stamp) => {
  if (!hub.context || contextIsNotEqual(val, hub.context)) {
    console.log('⚽️ fire fire fire FLAME context ⚽️', val, stamp)
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
  subscribe (subs, cb, raw, tree) {
    if (!raw) subs = parse(subs)
    if (!this.receiveOnly) {
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
    }
    return subscribe(this, subs, cb || stub, tree)
  }
}

const on = { data: { send } }

export { props, on, define }
