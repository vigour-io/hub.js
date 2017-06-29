import bs from 'stamp'

const next = typeof window === 'undefined'
  ? process.nextTick
  : global.requestAnimationFrame

const serialize = (hub, t, struct, val, level) => {
  if (!struct.isHub || struct.key === 'clients' || (struct._p && struct._p.key === 'clients')) {
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
      s.val = struct.val.path()
      s.val.unshift('@', 'root')
      serialize(hub, t, struct.val, val, level)
    } else if (struct.val !== void 0) {
      s.val = struct.val
    }
  }
}

const meta = hub => {
  if (!hub.receiveOnly) {
    const store = inProgress(hub, bs.inProgress ? bs.on : next)

    let keys = hub.client.keys()
    if (keys) {
      let i = keys.length
      while (i--) {
        hub.client.forEach((val, key) => {
          if (
            key !== 'device' &&
            key !== 'ua' &&
            key !== 'platform' &&
            key !== 'browser' &&
            key !== 'version' &&
            key !== 'prefix' &&
            key !== 'webview'
          ) {
            serialize(hub, store, val, void 0, hub.urlIndex)
          }
        })
      }
    }

    if (!store[1]) store[1] = {}
    if (hub.context) {
      if (hub.context.keys().length > 0) {
        store[1].context = hub.context.compute() ? hub.context.serialize() : false
      } else {
        store[1].context = hub.context.compute() || false
      }
    }
    store[1].id = hub.client.key
    if (hub.upstreamSubscriptions) {
      store[1].s = Object.keys(hub.upstreamSubscriptions)
    }
  } else if (hub.upstreamSubscriptions) {
    let override
    for (let key in hub.upstreamSubscriptions) {
      if (hub.upstreamSubscriptions[key].__force__) {
        if (!override) override = []
        override.push(key)
      }
    }
    if (override) {
      const store = inProgress(hub, bs.inProgress ? bs.on : next)
      if (!store[1]) store[1] = {}
      const obj = {}
      let i = override.length
      while (i--) {
        obj[override[i]] = hub.upstreamSubscriptions[override[i]]
      }
      store[1].s = Object.keys(obj)
    }
  }
}

const send = (val, stamp, struct) => {
  // also check for removal
  if (stamp < 0 && val === null && struct.parent(t => {
    if (t.key === 'clients') {
      // console.log('🎋🎋🎋🎋', struct.val, val)
      return true
    }
  })) {
    return
  }
  let hub
  let p = struct
  while (p) {
    if (p._url_ && !p._c) hub = p
    p = p.parent() // needs to walk over context (for multi server)
  }

  if (hub) {
    if (!hub.receiveOnly) {
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
}

// need to know if created by myself
// else starts correcting wrong stamps
const applyDifference = (val, diff) => {
  for (let key in val) {
    if (typeof val[key] === 'object') {
      applyDifference(val[key], diff)
    } else if (key === 'stamp') {
      val[key] = val[key] + diff
    }
  }
}

const inProgress = (hub, tick) => {
  if (!hub.inProgress) {
    hub.inProgress = []
    tick(() => {
      if (hub.connected.compute() === true) {
        out(hub)
      } else {
        var offset = bs.offset
        hub.connected.once(true, () => {
          if (bs.offset && Math.abs(bs.offset - offset) > 1000) {
            applyDifference(hub.inProgress[0], bs.offset - offset)
          }
          out(hub)
        })
      }
    })
  }
  return hub.inProgress
}

const out = t => {
  // if (typeof window !== 'undefined') {
    // console.log('SEND', JSON.stringify(t.inProgress, false, 2))
  // }
  t.socket.send(JSON.stringify(t.inProgress))
  t.inProgress = false
}

const sendSubscriptions = (socket, subs, hub) => {
  let i = subs.length
  const m = {}
  while (i--) {
    const key = subs[i]
    m[key] = hub.upstreamSubscriptions[key]
  }
  const payload = []
  payload[1] = { s: subs, m }
  socket.send(JSON.stringify(payload))
}

export { meta, send, sendSubscriptions }
