import bs from 'brisky-stamp'

const next = typeof window === 'undefined'
  ? process.nextTick
  : global.requestAnimationFrame

// will remove the meta tag src for sure
// prob will remove type as well from stamps -- make it lean and mean
const parse = (stamp, hub, t) => !bs.src(stamp)
  ? bs.create(bs.type(stamp), hub._uid_, bs.val(stamp))
  : stamp

const serialize = (hub, t, struct, val, level) => {
  const path = struct.path()
  if (struct.key === 'clients' && (!struct._p || struct._p.key !== 'clients')) return
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

    s.stamp = parse(struct.stamp, hub, t)

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
  const store = inProgress(hub, bs.inProgress ? bs.on : next)
  if (!store[1]) store[1] = {}
  if (hub.context) {
    store[1].context = hub.context.compute() || false
  }
  store[1]._uid_ = hub._uid_
  store[1].subscriptions = hub.upstreamSubscriptions
}

const send = (val, stamp, struct) => {
  if (bs.type(stamp) !== 'upstream') {
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
        if (struct.key !== hub._uid_) {
          return
        }
      }
      serialize(hub, inProgress(hub, bs.on), struct, val, hub.urlIndex)
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
