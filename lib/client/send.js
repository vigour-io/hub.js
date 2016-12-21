import bs from 'brisky-stamp'

// make a bs in progress (done!)
const next = typeof window === 'undefined'
  ? process.nextTick
  : global.requestAnimationFrame

const parse = (stamp, hub, t) => {
  const src = bs.src(stamp)
  if (!src) {
    return bs.create(bs.type(stamp), hub.id, bs.val(stamp), true)
  } else {
    const val = Number(bs.val(stamp))
    if (!t[1]) t[1] = {}
    const meta = t[1]
    if (!meta.resolve) meta.resolve = {}
    const resolve = meta.resolve[src]
    if (!resolve || val < resolve) meta.resolve[src] = val
    return stamp
  }
}

const serialize = (hub, t, struct, val, level) => {
  const path = struct.path()
  const len = path.length

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

    s.stamp = parse(struct.stamp, hub, t)

    if (val === null) {
      for (let key in s) {
        if (key !== 'stamp') {
          delete s[key]
        }
      }
      s.val = null
    } else if (struct.val && struct.val.inherits) {
      // this can be greatly optimized
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
  store[1].context = hub.clientContext
  store[1].id = hub.id
  store[1].subscriptions = hub.upstreamSubscriptions
}

const send = (val, stamp, struct) => {
  if (bs.type(stamp) !== 'upstream') {
    let hub
    let p = struct
    while (p) {
      if (p.url && !p.context) { hub = p }
      p = p.parent() // needs to walk over context (for multi server)
    }
    if (hub && !hub.receiveOnly && struct.key !== 'clients') {
      console.log('✍️ go send --->', hub.id, struct.path(), '✍️', val)
      if (struct === hub) {
        if (val === null) {
          return
        }
      } else if (struct._p.key === 'clients') {
        if (struct.key !== hub.id) {
          return
        }
      }
      serialize(hub, inProgress(hub, bs.on), struct, val, hub.urlIndex)
    }
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
