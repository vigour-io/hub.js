import bs from 'brisky-stamp'

const send = (hub, client, t, type, subs, tree) => {
  const stamp = t.stamp

  if (stamp && bs.src(stamp) !== client.key && bs.src(t.tStamp) !== client.key) {
    if (!client.inProgress) {
      client.inProgress = {}
      bs.on(() => {
        client.socket.send(JSON.stringify(client.inProgress))
        client.inProgress = false
      })
    }

    let val = void 0
    if (type === 'remove') {
      if (!t._p[t.key]) {
        val = null
        if (bs.src(t._p.tStamp) === client.key) {
          return
        }
      }
    } else if (type === 'update' && tree.$t !== t) {
      if (tree.$t && tree.$t._p && !tree.$t._p[tree.$t.key]) {
        serialize(hub.id, client, client.inProgress, subs, tree.$t, null, hub.serverIndex)
      }
    }
    if (t.val !== void 0 || val === null) {
      serialize(hub.id, client, client.inProgress, subs, t, val, hub.serverIndex)
    }
  }
}

const serialize = (id, client, t, subs, struct, val, level) => {
  const path = struct.path()
  const len = path.length
  const stamp = struct.stamp

  var s = t
  for (let i = level; i < len; i++) {
    let t = s[path[i]]
    if (val === null && i === len - 1) {
      s[path[i]] = val
      return
    }
    if (!t) {
      if (t === null) {
        return
      } else {
        s = s[path[i]] = {}
      }
    } else {
      s = t
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
    serialize(id, client, subs, t, struct.val, val, level)
  } else if (struct.val !== void 0) {
    s.val = struct.val
  }
}

export default send
