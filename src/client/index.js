import bs from 'stamp'
import { send, meta, sendSubscriptions } from './send'
import WebSocket from './websocket'
import { create, parse, subscribe, struct, emitterProperty } from 'brisky-struct'
import serialize from '../subscription/serialize'
import hash from 'string-hash'
import createClient from './create'
import { receiveLarge } from '../size'
// import merge from '../merge'

var getStringMemorySize = function (_string) {
  var codePoint,
    accum = 0
  for (var stringIndex = 0, endOfString = _string.length; stringIndex < endOfString; stringIndex++) {
    codePoint = _string.charCodeAt(stringIndex)
    if (codePoint < 0x100) {
      accum += 1
      continue
    }
    if (codePoint < 0x10000) {
      accum += 2
      continue
    }
    if (codePoint < 0x1000000) {
      accum += 3
    } else {
      accum += 4
    }
  }
  return accum * 2
}

const isNode = typeof window === 'undefined'

// const next = isNode
//   ? fn => setTimeout(fn, 18)
//   : global.requestAnimationFrame

const connect = (hub, url, reconnect) => {
  // use outside function non anon since its slower (according to uws)

  const socket = new WebSocket(url)
  const client = hub.client || createClient(hub, {}, false)
  // var inProgress, queue

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

  socket.onerror = isNode ? close : () => socket.close()

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

  /*
    MESSAGE CODES
    1: send full subscription
  */

  // 2: error logging in
  // need a way to add context switch

  socket.onmessage = (data) => {
    data = data.data
    if (
      typeof data !== 'string' &&
      (data instanceof ArrayBuffer ||
        (!isNode &&
          ((('Blob' in global) && data instanceof Blob) || // eslint-disable-line
          (('WebkitBlob' in global) && data instanceof WebkitBlob)) // eslint-disable-line
        )
      )
    ) {
      receiveLarge(data, set)
    } else if (data[0] === '#') {
      if (data[1] === '1') {
        sendSubscriptions(socket, JSON.parse(data.slice(2)), hub)
      } else {
        hub.emit('error', JSON.parse(data.slice(1)))
      }
    } else {
      set(data)
    }
  }

  const set = data => {
    var d = Date.now()
    console.log('incoming', getStringMemorySize(data) / 1024, 'kb')
    data = JSON.parse(data) // maybe add a try catch to be sure...
    console.log('parsing json', Date.now() - d, 'ms')

    d = Date.now()
    recieve(hub, data)
    console.log('handeling data (updating)', Date.now() - d, 'ms')
  }
}

const recieve = (hub, data) => {
  if (!hub.receiveOnly) {
    hub.receiveOnly = true
    hub.set(data, hub._incomingStamp = bs.create())
    hub.receiveOnly = null
    bs.close()
  } else {
    hub.set(data, hub._incomingStamp = bs.create())
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
        return true
      }
    }
  } else {
    return val !== context.compute()
  }
}

const context = (hub, val, key, stamp) => {
  if ((!hub.context && val) || (hub.context && contextIsNotEqual(val, hub.context))) {
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
