import bs from 'brisky-stamp'

const send = (hub, client, t, type, subs, tree) => {
  // const stamp = t.stamp

  // from this point nothing can be send
  // if (stamp && bs.src(stamp) !== client.key && bs.src(t.tStamp) !== client.key) { // && bs.src(stamp) !== client.key &&
  // console.log('🍵 ok send something ---> ?', t.path(), client.key)

  if (!client.inProgress) {
    client.inProgress = {}
    bs.on(() => {
      var isEmpty = true
      for (let i in client.inProgress) { //eslint-disable-line
        isEmpty = false
        break
      }
      if (!isEmpty) {
        client.socket.send(JSON.stringify(client.inProgress))
      }
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
  if (t.val !== void 0 || val === null || subs.val === true) {
    serialize(hub.id, client, client.inProgress, subs, t, val, hub.serverIndex)
  }
  // }
}

const serialize = (id, client, t, subs, struct, val, level) => {
  const stamp = struct.stamp
  const uid = struct.uid()
  if (stamp && (!client.cache || client.cache[uid] !== stamp)) {
    const src = bs.src(stamp)
    const path = struct.path()
    const len = path.length

    console.log('?????', id, client.src)

    if ((src !== client.key && bs.src(t.tStamp) !== client.key) && (!client.src || !client.src[src])) {
      var s = t
      var prev = s
      for (let i = level; i < len; i++) {
        prev = s
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

      if (struct.val !== void 0) {
        if (!client.cache) { client.cache = {} }
        client.cache[struct.uid()] = stamp
        if (!src) {
          s.stamp = bs.create(bs.type(stamp), id, bs.val(stamp))
        } else {
          s.stamp = stamp
        }
      }

      if (struct.val && struct.val.inherits) {
        s.val = struct.val.path()
        s.val.unshift('@', 'root')
        serialize(id, client, subs, t, struct.val, val, level)
      } else if (struct.val !== void 0) {
        s.val = struct.val
      } else if (subs.val === true) {
        struct.forEach((prop, key) => {
          if (prop.get('type') === 'hub') {
            // console.log('go send', key, prop.path())
            // (id, client, t, subs, struct, val, level)
            serialize(id, client, t, subs, prop, val, level)
          }
        })
        let empty = true
        for (let i in s) { // eslint-disable-line
          empty = false
          break
        }
        if (empty) {
          // console.log('====>', path[len - 1], prev)
          delete prev[path[len - 1]]
          // console.log('XXXXXXXX', prev)
        }
      }
    }
  }
}

export default send
