import bs from 'stamp'
import { get, getRefVal, getKeys, getType, getVal } from 'brisky-struct'
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
      client.inProgress[1].remove = client.contextSwitched
      delete client.contextSwitched
    }
    bs.on(() => {
      if (client.val !== null) {
        const p = client.inProgress[0]
        if (client.inProgress[1].remove || !isEmpty(p)) {
          if (p.types) {
            // order hack!
            for (let i in p) {
              // order is still important since setting types after the fact is still broken
              // this will be a big update
              // test if it works now since switch-inheritance update
              if (i === 'types') {
                break
              } else {
                let tmp = p[i]
                delete p[i]
                p[i] = tmp
              }
            }
          }
          // console.log('SERVER SEND: %j', p)
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
  if (!struct) {
    console.log('NO STRUCT FISHY IN SERVER SERIALIZE --- BUG')
    return
  }
  const stamp = get(struct, 'stamp') || 1 // remove the need for this default (feels wrong)
  struct._rc = struct._c
  const val = isRemoved ? null : getRefVal(struct)

  if (val !== void 0 && stamp && !isCached(client, struct, stamp)) {
    global.subscnt++

    // val === null -- double check if this is necessary
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
        serialize(client, t, subs, getType(struct, val), level)
        // allways need a stamp!
      }

      if (typeof val === 'object' && val !== null && val.inherits) {
        s.val = val.path()
        s.val.unshift('@', 'root')
        serialize(client, t, subs, val, level)
      } else if (val !== void 0) {
        s.val = val
      }
    }
  } else if (val && typeof val === 'object' && val.inherits) {
    if (val.__tmp__ !== true) {
      // can send a bit too much data when val: true and overlapping keys
      val.__tmp__ = true
      serialize(client, t, subs, val, level, false)
      delete val.__tmp__
    }
  }

  if (subs.val === true && !isRemoved && !struct.__tmp__) {
    struct.__tmp__ = true
    deepSerialize(getKeys(struct), client, t, subs, struct, level)
    delete struct.__tmp__
  }
}

const getOrigin = (t, key, noContext) => {
  if (t) {
    let result = get(t, key, noContext)
    if (result !== void 0 && result !== null) {
      result._rc = result._rc || t._rc
      if (t._rc) {
        t._rc = null
      }
      return result
    }
  }
}

const deepSerialize = (keys, client, t, subs, struct, level) => {
  var type
  if ((type = get(struct, 'type')) && type.compute() !== 'hub') {
    serialize(client, t, subs, type, level)
  }
  if (keys) {
    for (let i = 0, len = keys.length; i < len; i++) {
      let prop = getOrigin(struct, keys[i])
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

export { progress, send }
