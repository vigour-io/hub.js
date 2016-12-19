import bs from 'brisky-stamp'

const next = typeof window === 'undefined'
  ? process.nextTick
  : global.requestAnimationFrame

const serialize = (id, t, struct, val, level) => {
  const path = struct.path()
  const len = path.length
  const stamp = struct.stamp

  if (struct.val !== void 0 || val === null) {
    var s = t[0] || (t[0] = {})
    for (let i = level; i < len; i++) {
      let t = s[path[i]]
      if (!t) {
        s = s[path[i]] = {}
      } else {
        s = t
        if (s.val === null) {
          return
        }
      }
    }

    console.log('------->', bs.val(stamp))
    if (!isNaN(Number(bs.val(stamp)))) {
      console.log('go')
      s.stamp = bs.create(bs.type(stamp), id, bs.val(stamp), true)
    } else {
      s.stamp = stamp
    }

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
      send(id, t, struct.val)
    } else if (struct.val !== void 0) {
      s.val = struct.val
    }
  }
}

const meta = hub => {
  const store = inProgress(hub, next)
  store[1] = {
    context: hub.clientContext,
    id: hub.id,
    subscriptions: hub.upstreamSubscriptions
  }
}

const send = (val, stamp, struct) => {
  const hub = struct.parent(hub => hub.url && hub)
  if (hub && bs.type(stamp) !== 'upstream') {
    serialize(hub.id, inProgress(hub, bs.on), struct, val, hub.urlIndex)
  }
}

const inProgress = (t, tick) => {
  if (!t.inProgress) {
    t.inProgress = []
    tick(() => {
      if (t.connected.compute() === true) {
        out(t)
      } else {
        t.connected.once(true, () => out(t))
      }
    })
  }
  return t.inProgress
}

const out = t => {
  t.socket.send(JSON.stringify(t.inProgress))
  t.inProgress = false
}

export { meta, send }
