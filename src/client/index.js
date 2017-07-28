import bs from 'stamp'
import { send, meta, sendSubscriptions } from './send'
import WebSocket from './websocket'
import {
  create,
  parse,
  subscribe,
  struct,
  emitterProperty,
  puid,
  getKeys
} from 'brisky-struct'
import serialize from '../subscription/serialize'
import hash from 'string-hash'
import createClient from './create'
import { receiveLarge } from '../size'
import hub from '../hub'

const isNode = typeof window === 'undefined'

// want to use for upsteream
const next = isNode
  ? fn => setTimeout(fn, 18)
  : global.requestAnimationFrame

// const cancel = isNode
//   ? clearTimeout
//   : global.cancelAnimationFrame

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
    hub.socket = socket
    if (hub.emitters && hub.emitters.incoming) {
      enableIncomingListener(socket, hub)
    }
  }

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
    // just use array! remove this nonsense
    } else if (data[0] === '#') {
      if (data[1] === '1') {
        // same here
        sendSubscriptions(socket, JSON.parse(data.slice(2)), hub)
      } else {
        // call it events -- emit {} etc
        // need to fix this on send used in phoenix else it breaks
        // [ 1 ] emit: { [type]: [], }
        // [ 1 ] subscriptions: { [type]: [] }
        hub.emit('error', JSON.parse(data.slice(1)))
      }
    } else {
      // the result of a context switch
      set(data)
    }
  }

  const set = data => receive(hub, JSON.parse(data)[0], JSON.parse(data)[1])
}

const ownListeners = struct => struct !== hub && (struct.emitters || (ownListeners(struct.inherits)))

const removePaths = (struct, list, stamp, data) => {
  var keep = true
  const keys = getKeys(struct)
  if (keys) {
    let i = keys.length
    keep = i
    while (i--) {
      if (removePaths(struct.get(keys[i]), list, stamp, data && data[keys[i]])) {
        keep--
      }
    }
  }
  if (struct.val !== void 0) {
    const removeStamp = list[puid(struct)]
    if (removeStamp && removeStamp >= struct.stamp && (!data || data.val === void 0)) {
      if ((keys && keep) || ownListeners(struct)) {
        // console.log('soft removing', struct.path())
        delete struct.val
        struct.emit('data', null, stamp)
        struct.stamp = 0
      } else {
        // console.log('hard removing', struct.path())
        struct.set(null, stamp, void 0, true)
        return true
      }
    } else {
      struct.stamp = 0
    }
  } else if (!keep && !ownListeners(struct)) {
    // console.log('hard removing', struct.path())
    struct.set(null, stamp, void 0, true)
    return true
  } else {
    struct.stamp = 0
  }
}

// raf
const receive = (hub, data, info) => {
  bs.setOffset(bs.offset + (info.stamp | 0) - (bs.create() | 0))

  if (info && info.connect) {
    hub.set({ connected: true }, bs.create())
    meta(hub)
    bs.close()
  }
  // hub._receiving =  handle this!
  // this will help /w heavy computation on incoming
  if (data) {
    next(() => {
      const stamp = bs.create()
      if (!hub.receiveOnly) {
        hub.receiveOnly = true
        if (info.remove) {
          removePaths(hub, info.remove, stamp, data)
        }
        hub.set(data, stamp, void 0, !!info.remove)
        hub.receiveOnly = null
      } else {
        if (info.remove) {
          removePaths(hub, info.remove, stamp, data)
        }
        hub.set(data, stamp, void 0, !!info.remove)
      }
      bs.close()
    })
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
  if (val === void 0) {
    throw Error('setting hub.url to "undefined", are you missing an environment variable?')
  }
  if (!val) val = null
  if ((!hub.url && val) || ((hub.url && hub.url.compute()) !== val)) {
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
        client.set(null, -stamp)
        delete clients[key]
      }
    })
  }
}

const connectedStruct = create({
  on: {
    data: {
      removeClients: (val, stamp, t) => {
        if (t.compute() === false) {
          removeClients(t._p, stamp)
        }
      }
    }
  }
})

const connected = (hub, val, key, stamp) => {
  if (!hub.connected) {
    create(val, stamp, connectedStruct, hub, key)
  } else {
    hub.connected.set(val, stamp)
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
      if (!context[field] || (context[field].compute && context[field].compute()) !== val[field]) {
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
    const field = typeof window === 'undefined'
      ? 'internalOnMessage'
      : 'onmessage'
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
