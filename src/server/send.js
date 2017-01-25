import bs from 'brisky-stamp'
import { get, getKeys, getType } from 'brisky-struct'
import { cache, isCached } from './cache'

const isEmpty = obj => {
  for (let i in obj) { //eslint-disable-line
    return false
  }
  return true
}

// good idea -- no stamp means no sync

const progress = (client) => {
  if (!client.inProgress) {
    client.inProgress = {}
    bs.on(() => {
      if (client.val !== null) {
        if (!isEmpty(client.inProgress)) {
          if (client.inProgress.types) {
            for (let i in client.inProgress) {
              // order is still important since settign types after the facts is still broken
              // this will be a big update
              if (i === 'types') {
                break
              } else {
                let tmp = client.inProgress[i]
                delete client.inProgress[i]
                client.inProgress[i] = tmp
              }
            }
          }
          client.socket.send(JSON.stringify(client.inProgress))
        }
        client.inProgress = false
      }
    })
  }
  return client.inProgress
}

const send = (hub, client, struct, type, subs, tree) => {
  if (client.val !== null) {
    var val
    if (type === 'remove') {
      if (!struct._p[struct.key]) val = null
    } else if (type === 'update' && tree.$t !== struct) {
      if (tree.$t && tree.$t._p && !tree.$t._p[tree.$t.key]) {
        let p = tree.$t
        let l = p
        while (p) {
          if (p._p && p._p[p.key]) {
            serialize(hub._uid_, client, progress(client), subs, l, null, get(hub, 'serverIndex'), tree)
          }
          l = p
          p = p._p
        }
      }
    }
    if (get(struct, 'val') !== void 0 || val === null || subs.val === true) {
      serialize(hub._uid_, client, progress(client), subs, struct, val, get(hub, 'serverIndex'), tree)
    }
  }
}

const serialize = (id, client, t, subs, struct, val, level) => {
  if (!struct.isHub) return
  const stamp = get(struct, 'stamp') || (struct.stamp = bs.create()) // remove this-- things without a stamp cannot be synced
  var cached = isCached(client, struct, stamp)
  let getVal = get(struct, 'val')

  if (!cached) { // val === null -- double chck if this is nessecary
    const path = struct.path()
    const len = path.length
    let s = t
    for (let i = level; i < len; i++) {
      let tt = s[path[i]]
      if (!tt) {
        s = s[path[i]] = {}
      } else {
        s = tt
        if (s.val === null) return
      }
    }

    if (getVal !== void 0 || val === null) {
      if (val === null) {
        cache(client, struct, stamp, level)
        s.stamp = stamp
        s.val = null
      } else {
        if (subs.type) {
          const type = get(struct, 'type')
          if (type.compute() !== 'hub') {
            serialize(id, client, t, subs.type, type, val, level)
          }
        }

        if (val !== null) {
          cache(client, struct, stamp, level)
          s.stamp = stamp
          if (struct.key === 'type') {
            serialize(id, client, t, subs, getType(struct.parent(2), getVal), val, level)
          }

          if (typeof getVal === 'object' && getVal.inherits) {
            s.val = getVal.path()
            s.val.unshift('@', 'root')
            serialize(id, client, t, subs, getVal, val, level)
          } else if (getVal !== void 0) {
            s.val = getVal
          }
        }
      }
    }
  } else if (typeof getVal === 'object' && getVal.inherits) {
    serialize(id, client, t, subs, getVal, val, level)
  }

  if (subs.val === true) {
    const keys = getKeys(struct)
    if (keys) deepSerialize(keys, id, client, t, subs, struct, val, level)
  }
}

const deepSerialize = (keys, id, client, t, subs, struct, val, level) => {
  if (keys) {
    for (let i = 0, len = keys.length; i < len; i++) {
      let prop = get(struct, keys[i])
      if (prop && prop.isHub) serialize(id, client, t, subs, prop, val, level)
    }
  }
  if (struct._removed) {
    for (let i = 0, len = struct._removed.length; i < len; i++) {
      let prop = struct._removed[i]
      serialize(id, client, t, subs, prop, null, level)
    }
  }
}

export default send
