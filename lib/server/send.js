import bs from 'brisky-stamp'
import { get, getKeys } from 'brisky-struct'

const progress = (client) => {
  if (!client.inProgress) {
    client.inProgress = {}
    bs.on(() => {
      if (client.val !== null) {
        var isEmpty = true
        for (let i in client.inProgress) { //eslint-disable-line
          isEmpty = false
          break
        }
        if (!isEmpty) client.socket.send(JSON.stringify(client.inProgress))
        client.inProgress = false
      }
    })
  }
  return client.inProgress
}

const send = (hub, client, t, type, subs, tree) => {
  var val
  if (type === 'remove') {
    if (!t._p[t.key]) {
      val = null
      if (bs.src(t._p.tStamp) === client.key) {
        return
      }
    }
  } else if (type === 'update' && tree.$t !== t) {
    if (tree.$t && tree.$t._p && !tree.$t._p[tree.$t.key]) {
      serialize(hub.id, client, progress(client), subs, tree.$t, null, get(hub, 'serverIndex'), tree)
    }
  }
  if (t.val !== void 0 || val === null || subs.val === true) {
    // opt this line
    serialize(hub.id, client, progress(client), subs, t, val, get(hub, 'serverIndex'), tree)
  }
}

const cache = (client, struct, stamp, level, val) => {
  if (!client.cache) client.cache = {}
  // console.log(struct.key, stamp)
  client.cache[struct.uid()] = stamp && stamp[0]
}

const isCached = (client, struct, stamp) => {
  return client.cache && client.cache[struct.uid()] === stamp[0]
}

const setStamp = (s, stamp, src, struct, id, client, level) => {
  cache(client, struct, stamp, level)
  s.stamp = !src
    ? bs.create(bs.type(stamp), id, bs.val(stamp))
    : stamp
}

const serialize = (id, client, t, subs, struct, val, level) => {
  const stamp = get(struct, 'stamp')
  console.log('???', struct.path(), subs)
  var cached
  if ((val === null || !(cached = isCached(client, struct, stamp))) || subs.val === true) {
    const src = bs.src(stamp)
    console.log('??????')
    if (src !== client.key && bs.src(t.tStamp) !== client.key) {
      console.log('hur')
      if (
        client.resolve &&
        client.resolve[src] &&
        bs.val(stamp) >= client.resolve[src]
      ) {
        if (val !== null) {
          if (struct.val !== void 0) cache(client, struct, stamp, level)
          if (subs.val === true) {
            const keys = getKeys(struct)
            if (keys) deepSerialize(keys, id, client, t, subs, struct, val, level)
          }
        }
      } else {
        console.log('???? ok ok ok')
        if (!cached && (struct.val !== void 0 || val === null)) {
          const path = struct.path()
          const len = path.length
          var s = t

          for (let i = level; i < len; i++) {
            let tt = s[path[i]]
            if (!tt) {
              s = s[path[i]] = {}
            } else {
              s = tt
              if (s.val === null) return
            }
          }

          if (val === null) {
            setStamp(s, stamp, src, struct, id, client, level, val)
            s.val = null
          } else {
            setStamp(s, stamp, src, struct, id, client, level)
            if (struct.val && struct.val.inherits) {
              s.val = struct.val.path()
              s.val.unshift('@', 'root')
              serialize(id, client, subs, t, struct.val, val, level)
            } else if (struct.val !== void 0) {
              s.val = struct.val
            }
          }
        } else if (subs.val === true) {
          console.log('YO YO YO')
          const keys = getKeys(struct)
          if (keys) deepSerialize(keys, id, client, t, subs, struct, val, level)
        }
      }
    }
  }
}

const deepSerialize = (keys, id, client, t, subs, struct, val, level) => {
  if (keys) {
    for (let i = 0, len = keys.length; i < len; i++) {
      let prop = get(struct, keys[i])
      if (prop && prop.isHub) serialize(id, client, t, subs, prop, val, level)
    }
  }
  // feels really shacky /w context :/ needs tests
  if (struct._removed) {
    for (let i = 0, len = struct._removed.length; i < len; i++) {
      let prop = struct._removed[i]
      if (prop && prop.isHub) serialize(id, client, t, subs, prop, null, level)
    }
  }
}

export default send
