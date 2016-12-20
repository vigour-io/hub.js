import bs from 'brisky-stamp'

// make a bs in progress
const next = typeof window === 'undefined'
  ? process.nextTick
  : global.requestAnimationFrame

const parse = (stamp, id) => {
  const src = bs.src(stamp)
  if (!src) {
    // so now we allways manipulate stamps -- bad times
    // so do need some tinkering here...
    // need to know if a client is from the server else bouncing
    return bs.create(bs.type(stamp), id, bs.val(stamp), true)
  } else {
    return stamp
  }
}

const serialize = (id, t, struct, val, level) => {
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

    s.stamp = parse(struct.stamp, id)

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
  if (bs.type(stamp) !== 'upstream') {
    let hub
    let p = struct
    while (p) {
      if (p.url && !p.context) { hub = p }
      p = p.parent() // needs to walk over context (for multi server)
    }
    if (hub && !hub.receiveOnly && struct.key !== 'clients') {
      console.log('✍️ go send --->', hub.id, struct.path(), '✍️', val)
      // allways ignore a few keys -- like other clients then your own
      serialize(hub.id, inProgress(hub, bs.on), struct, val, hub.urlIndex)
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
