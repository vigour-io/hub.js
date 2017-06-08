import bs from 'stamp'
import { get, getKeys, getType, getVal } from 'brisky-struct'
import { cache, isCached } from './cache'
import { sendLarge } from '../size'

const isEmpty = obj => {
  for (let i in obj) { //eslint-disable-line
    return false
  }
  return true
}

const progress = (client) => {
  if (!client.inProgress) {
    client.inProgress = [ {}, { stamp: bs.create() } ]
    if (client.contextSwitched) {
      client.inProgress[1].reset = true
      delete client.contextSwitched
    }
    bs.on(() => {
      if (client.val !== null) {
        const p = client.inProgress[0]
        if (!isEmpty(p)) {
          if (p.types) {
            // order hack!
            for (let i in p) {
              // order is still important since setting types after the fact is still broken
              // this will be a big update
              // test if it works now since switchinheritance update
              if (i === 'types') {
                break
              } else {
                let tmp = p[i]
                delete p[i]
                p[i] = tmp
              }
            }
          }
          const raw = JSON.stringify(client.inProgress)
          if (!sendLarge(raw, client)) {
            if (client.blobInProgress) {
              client.blobInProgress.push(raw)
            } else {
              client.socket.send(raw)
            }
          }
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
            serialize(client, progress(client), subs, prop, hub, get(hub, 'serverIndex'), true)
          }
          prop = previous
          previous = previous._p
        }
      }
    }
    serialize(client, progress(client), subs, struct, hub, get(hub, 'serverIndex'), isRemoved)
  }
}

const serialize = (client, t, subs, struct, hub, level, isRemoved) => {
  if (!struct) {
    console.log('NO STRUCT FISHY IN SERVER SERIALIZE --- BUG')
    return
  }
  const stamp = get(struct, 'stamp') || 1 // remove the need for this default (feels wrong)
  const val = isRemoved ? null : getVal(struct)

  if (val !== void 0 && stamp && !isCached(client, struct, stamp)) {
    // val === null -- double chck if this is nessecary
    const path = struct.path()
    const len = path.length
    let s = t[0]
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
      cache(client, struct, hub, stamp)
      s.stamp = stamp
      s.val = val
    } else {
      if (subs.type) {
        const type = get(struct, 'type') // make getType (fast)
        if (getVal(type) !== 'hub') {
          serialize(client, t, subs.type, type, hub, level)
        }
      }

      cache(client, struct, hub, stamp)
      s.stamp = stamp
      if (struct.key === 'type') {
        if (val === 'hub') return
        serialize(client, t, subs, getType(struct, val), hub, level)
      // allways need a stamp!
      }

      if (typeof val === 'object' && val !== null && val.inherits) {
        s.val = val.path()
        s.val.unshift('@', 'root')
        serialize(client, t, subs, val, hub, level)
      } else if (val !== void 0) {
        s.val = val
      }
    }
  } else if (val && typeof val === 'object' && val.inherits) {
    if (val.__tmp__ !== true) {
    // can send a bit too much data when val: true and overlapping keys
      val.__tmp__ = true
      serialize(client, t, subs, val, hub, level, false)
      delete val.__tmp__
    }
  }

  if (subs.val === true && !isRemoved && !struct.__tmp__) {
    struct.__tmp__ = true
    deepSerialize(getKeys(struct), client, t, subs, struct, hub, level)
    delete struct.__tmp__
  }
}

const deepSerialize = (keys, client, t, subs, struct, hub, level) => {
  var type
  if ((type = get(struct, 'type')) && type.compute() !== 'hub') {
    serialize(client, t, subs, type, level)
  }
  if (keys) {
    for (let i = 0, len = keys.length; i < len; i++) {
      let prop = get(struct, keys[i])
      if (prop && prop.isHub) serialize(client, t, subs, prop, hub, level)
    }
  }
  if (struct._removed) {
    for (let i = 0, len = struct._removed.length; i < len; i++) {
      let prop = struct._removed[i]
      serialize(client, t, subs, prop, hub, level, true)
    }
  }
}

export default send
