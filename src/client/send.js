import bs from 'brisky-stamp'

const next = typeof window === 'undefined'
  ? process.nextTick
  : global.requestAnimationFrame

const serialize = (hub, t, struct, val, level) => {
  if (struct.key === 'clients' || (struct._p && struct._p.key === 'clients')) {
    return
  }

  const path = struct.path() // cached version (later)
  const len = path.length

  if (struct.val !== void 0 || val === null) {
    var s = t[0] || (t[0] = {})

    for (let i = level; i < len; i++) {
      let t = s[path[i]]
      if (!t) {
        s = s[path[i]] = {}
      } else {
        s = t
        if (s.val === null) { return }
      }
    }

    s.stamp = struct.stamp

    if (val === null) {
      for (let key in s) {
        if (key !== 'stamp') {
          delete s[key]
        }
      }
      s.val = null
    } else if (struct.val && struct.val.inherits) {
      // make a bit more secure...
      // if (!s.val) {
      s.val = struct.val.path()
      s.val.unshift('@', 'root')
      // if allrdy serialized stop it!
      serialize(hub, t, struct.val, val, level)
      // }
    } else if (struct.val !== void 0) {
      s.val = struct.val
    }
  }
}

const meta = hub => {
  if (!hub.receiveOnly) {
    const store = inProgress(hub, bs.inProgress ? bs.on : next)
    if (!store[1]) store[1] = {}
    if (hub.context) {
      if (hub.context.keys().length > 0) {
        store[1].context = hub.context.compute() ? hub.context.serialize() : false
      } else {
        store[1].context = hub.context.compute() || false
      }
    }
    store[1].id = hub.client.key
    store[1].subscriptions = hub.upstreamSubscriptions
  }
}

const send = (val, stamp, struct) => {
  // -1 means upsteam (floats for extra speed)
  let hub
  let p = struct
  while (p) {
    if (p._url_ && !p._c) hub = p
    p = p.parent() // needs to walk over context (for multi server)
  }

  if (hub && !hub.receiveOnly) {
    if (struct === hub) {
      if (val === null) {
        return
      }
    } else if (struct._p.key === 'clients') {
      if (struct.key !== hub.client.key) {
        return
      }
    }
    serialize(hub, inProgress(hub, bs.on), struct, val, hub.urlIndex)
  }
}

const inProgress = (hub, tick) => {
  if (!hub.inProgress) {
    hub.inProgress = []
    tick(() => {
      if (hub.connected.compute() === true) {
        out(hub)
      } else {
        hub.connected.once(true, () => out(hub))
      }
    })
  }
  return hub.inProgress
}

const out = t => {
  t.socket.send(JSON.stringify(t.inProgress))
  t.inProgress = false
}

export { meta, send }
