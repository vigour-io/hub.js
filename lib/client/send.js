import bs from 'brisky-stamp'

const next = typeof window === 'undefined'
  ? process.nextTick
  : global.requestAnimationFrame

const serialize = (id, t, struct, val, level) => {
  const path = struct.path()
  const len = path.length
  const stamp = struct.stamp

  if (typeof struct.val !== void 0 || val === null) {
    var s = t
    for (let i = level; i < len; i++) {
      let t = s[path[i]]
      if (val === null && i === len - 1) {
        s[path[i]] = null
        return
      } else {
        if (!t) {
          s = s[path[i]] = {}
        } else {
          s = t
        }
      }
    }

    if (typeof stamp === 'number') {
      s.stamp = bs.create(bs.type(stamp), id, bs.val(stamp))
    } else {
      s.stamp = stamp
    }

    if (struct.val && struct.val.inherits) {
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
    serialize(hub.id, inProgress(hub, bs.on)[0], struct, val, hub.urlIndex)
  }
}

const inProgress = (t, tick) => {
  if (!t.inProgress) {
    t.inProgress = [{}]
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
