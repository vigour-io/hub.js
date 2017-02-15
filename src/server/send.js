import bs from 'brisky-stamp'
import { get, getKeys, getType, getVal } from 'brisky-struct'
import { cache, isCached } from './cache'

const isEmpty = obj => {
  for (let i in obj) { //eslint-disable-line
    return false
  }
  return true
}

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
  if (struct.isHub && client.val !== null) {
    let isRemoved
    if (type === 'remove') {
      if (!struct._p || !struct._p[struct.key]) isRemoved = true
    } else if (type === 'update' && tree.$t !== struct) {
      if (tree.$t && tree.$t._p && !tree.$t._p[tree.$t.key]) {
        let previous = tree.$t
        let prop = previous
        while (previous) {
          if (previous._p && previous._p[previous.key]) {
            // think of something fast for level...
            serialize(client, progress(client), subs, prop, get(hub, 'serverIndex'), true)
          }
          prop = previous
          previous = previous._p
        }
      }
    }
    serialize(client, progress(client), subs, struct, get(hub, 'serverIndex'), isRemoved)
  }
}

const serialize = (client, t, subs, struct, level, isRemoved) => {
  const stamp = get(struct, 'stamp') || 1 // remove the need for this default (feels wrong)
  const val = isRemoved ? null : getVal(struct)

  if (val !== void 0 && stamp && !isCached(client, struct, stamp)) {
    // val === null -- double chck if this is nessecary
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

    if (isRemoved) {
      cache(client, struct, stamp)
      s.stamp = stamp
      s.val = val
    } else {
      if (subs.type) {
        const type = get(struct, 'type') // make getType (fast)
        if (getVal(type) !== 'hub') {
          serialize(client, t, subs.type, type, level)
        }
      }

      cache(client, struct, stamp)
      s.stamp = stamp
      if (struct.key === 'type') {
        if (val === 'hub') return
        serialize(client, t, subs, getType(struct.parent(2), val), level)
      // allways need a stamp!
      }

      if (typeof val === 'object' && val.inherits) {
        s.val = val.path()
        s.val.unshift('@', 'root')
        serialize(client, t, subs, val, level)
      } else if (val !== void 0) {
        s.val = val
      }
    }
  } else if (val && typeof val === 'object' && val.inherits) {
    // can send a bit too much data when val: true and overlapping keys
    serialize(client, t, subs, val, level)
  }

  if (subs.val === true && !isRemoved) {
    deepSerialize(getKeys(struct), client, t, subs, struct, level)
  }
}

const deepSerialize = (keys, client, t, subs, struct, level) => {
  if (struct.get('type') && struct.get('type').compute() !== 'hub') {
    serialize(client, t, subs, struct.get('type'), level)
  }
  if (keys) {
    for (let i = 0, len = keys.length; i < len; i++) {
      let prop = get(struct, keys[i])
      if (prop && prop.isHub) serialize(client, t, subs, prop, level)
    }
  }
  if (struct._removed) {
    for (let i = 0, len = struct._removed.length; i < len; i++) {
      let prop = struct._removed[i]
      serialize(client, t, subs, prop, level, true)
    }
  }
}

export default send
