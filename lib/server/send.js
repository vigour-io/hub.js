import bs from 'brisky-stamp'
import { get } from 'brisky-struct'

const send = (hub, client, t, type, subs, tree) => {
  if (!client.receiving) {
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
  } else if (client.receiving === 'resolve') {
    cache(t, client)
    if (subs.val === true) deepCache(t, client)
  }
}

const cache = (t, client) => {
  const stamp = t.stamp
  const src = bs.src(stamp)
  if (src !== client.key) {
    if (!client.cache) { client.cache = {} }
    client.cache[t.uid()] = stamp
  }
}

const deepCache = (t, client) => {
  t.forEach((prop, key) => {
    if (get(prop, 'type') === 'hub') {
      cache(prop, client)
      deepCache(prop, client)
    }
  })
}

const serialize = (id, client, t, subs, struct, val, level) => {
  const stamp = struct.stamp
  const uid = struct.uid()
  if (stamp && (!client.cache || client.cache[uid] !== stamp)) {
    const src = bs.src(stamp)
    const path = struct.path()
    const len = path.length
    if (src !== client.key && bs.src(t.tStamp) !== client.key) {
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
        if (!client.cache) client.cache = {}
        client.cache[uid] = stamp
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
        deepSubscription(id, client, t, subs, struct, val, level, path, prev, len, s)
      }
    }
  }
}

const deepSubscription = (id, client, t, subs, struct, val, level, path, prev, len, s) => {
  struct.forEach((prop, key) => {
    if (get(prop, 'type') === 'hub') {
      serialize(id, client, t, subs, prop, val, level)
    }
  })
  let empty = true
  for (let i in s) { // eslint-disable-line
    empty = false
    break
  }
  if (empty) { delete prev[path[len - 1]] }
}

export default send
