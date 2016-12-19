import bs from 'brisky-stamp'

// setImmediate shim for browser
if (typeof setImmediate === 'undefined') {
  global.setImmediate = fn => setTimeout(fn)
}

const serialize = (id, t, struct, val, level) => {
  const path = struct.path() // memoize functionality -- good for hubs
  const len = path.length
  const stamp = struct.stamp
  // if (!stamp) cant send it

  // make this into a shared function
  var s = t
  for (let i = level; i < len; i++) {
    let t = s[path[i]]
    if (!t) {
      s = s[path[i]] = {}
    } else {
      s = t
    }
  }

  if (typeof stamp === 'number') {
    s.stamp = bs.create(bs.type(stamp), id, bs.val(stamp))
  } else {
    s.stamp = stamp
  }

  if (val === null) {
    // NEED TO GO ONE UP
    // maybe just on s itself --- this is not so nice
    s.val = null // this will not work -- need to make it work
  } else {
    if (struct.val && struct.val.inherits) {
      s.val = struct.val.path()
      s.val.unshift('@', 'root')
      send(id, t, struct.val)
    } else if (struct.val !== void 0) {
      s.val = struct.val
    }
  }
}

const inProgress = (t, tick) => {
  if (!t.inProgress) {
    t.inProgress = [{}]
    tick(() => { // maybe just use process next tick
      if (t.connected.compute() === true) {
        out(t)
      } else {
        t.connected.once(true, () => out(t))
      }
    })
  }
  return t.inProgress
}

const meta = hub => {
  const store = inProgress(hub, setImmediate)
  store[1] = {
    context: hub.clientContext,
    id: hub.id,
    // maybe dont resend them all the time do that later :/
    subscriptions: hub.upstreamSubscriptions
  }
}

const send = (hub, val, stamp, struct) =>
  serialize(hub.id, inProgress(hub, bs.on)[0], struct, val, hub.urlIndex)

// this can also be shared
const out = t => {
  t.socket.send(JSON.stringify(t.inProgress))
  t.inProgress = false
}

export { meta, send }
