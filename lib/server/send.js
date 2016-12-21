import bs from 'brisky-stamp'
import { get } from 'brisky-struct'

const send = (hub, client, t, type, subs, tree) => {
  var val
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
}

const serialize = (id, client, t, subs, struct, val, level) => {
  const stamp = struct.stamp
  const uid = struct.uid()
  if (stamp && (!client.cache || client.cache[uid] !== stamp)) {
    const src = bs.src(stamp)
    if (src !== client.key && bs.src(t.tStamp) !== client.key) {
      if (client.resolve && client.resolve[src] && Number(bs.val(stamp) >= client.resolve[src])) {
        if (!client.cache) { client.cache = {} }
        client.cache[uid] = stamp
        deepSerialize(id, client, t, subs, struct, val, level)
        console.log('BLOCK BY RESOLVE', Number(bs.val(stamp)), client.resolve)
      } else {
        const path = struct.path()
        const len = path.length
        var s = t
        var prev = t
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
          deepSerialize(id, client, t, subs, struct, val, level)
          for (let i in s) { return }// eslint-disable-line
          delete prev[path[len - 1]]
        }
      }
    }
  }
}

const deepSerialize = (id, client, t, subs, struct, val, level) => {
  const keys = struct.keys() // use get keys.. faster (expose it)
  for (let i = 0, len = keys.length; i < len; i++) {
    let prop = get(struct, keys[i])
    if (get(prop, 'type') === 'hub') {
      serialize(id, client, t, subs, prop, val, level)
    }
  }
}

export default send
