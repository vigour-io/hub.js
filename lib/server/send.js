import bs from 'brisky-stamp'

const send = (hub, client, t, type, subs, tree) => {
  // think abotu context here
  const stamp = t.stamp
  if (stamp && bs.src(stamp) !== client.key && bs.src(t.tStamp) !== client.key) {
    if (!client.inProgress) {
      client.inProgress = {}
      bs.on(() => {
        client.socket.send(JSON.stringify(client.inProgress))
        client.inProgress = false
      })
    }

    // console.log(client.key, bs.src(stamp), stamp, bs.src(t.tStamp))
    // console.log('\n', type, t.path())
    let val = void 0
    if (type === 'remove') {
      // console.log('REMOVE?')
      if (!t._p[t.key]) {
        // console.log('☠️ TRUE REMOVAL ☠️')
        val = null
        if (bs.src(t._p.tStamp) === client.key) {
          return
        }
      }
      // console.log()
    } else if (type === 'update' && tree.$t !== t) {
      // console.log('🔬 SWITCHED 🔬')
      if (tree.$t && tree.$t._p && !tree.$t._p[tree.$t.key]) {
        // console.log('☠️ TRUE REMOVAL ☠️')
        serialize(hub.id, client, client.inProgress, subs, tree.$t, null, 0)
      }
    }
    // console.log(tree.$t && tree.$t.path(), t.path())
    if (t.val !== void 0 || val === null) {
      serialize(hub.id, client, client.inProgress, subs, t, val, 0)
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
    send(id, client, subs, t, struct.val, val, level)
  } else if (struct.val !== void 0) {
    s.val = struct.val
  }
}

export default send
