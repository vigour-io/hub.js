import bs from 'brisky-stamp'
import { get, getKeys, getType } from 'brisky-struct'

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
        if (!isEmpty) {
          if (client.inProgress.types) {
            for (let i in client.inProgress) {
              if (i === 'types') {
                break
              } else {
                let tmp = client.inProgress[i]
                delete client.inProgress[i]
                client.inProgress[i] = tmp
              }
            }
          }
          // console.log('\n📡 SEND DOWN:', JSON.stringify(client.inProgress, false, 2).slice(0, 400), '\n... 📡')
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
      if (!struct._p[struct.key]) {
        val = null
        if (bs.src(struct._p.tStamp) === client.key) {
          return
        }
      }
    } else if (type === 'update' && tree.$t !== struct) {
      // can also be something else ofc bit heavy but nessecary for now -- change later
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

    // tripple checks not so nice
    // can just send empty objects as well ofc....
    if (get(struct, 'val') !== void 0 || val === null || subs.val === true) {
      serialize(hub._uid_, client, progress(client), subs, struct, val, get(hub, 'serverIndex'), tree)
    }
  }
}

const cache = (client, struct, stamp, level, val) => {
  if (!client.cache) client.cache = {}
  client.cache[struct.path().join('/')] = stamp[0]
}

// dont use uid just use somethign like path this is not enough im affraid
const isCached = (client, struct, stamp) => client.cache &&
  client.cache[struct.path().join('/')] === stamp[0]

// const isCached = () => false

const setStamp = (s, stamp, src, struct, id, client, level) => {
  cache(client, struct, stamp, level)
  s.stamp = !src
    ? bs.create(bs.type(stamp), id, bs.val(stamp))
    : stamp
}

const defStamp = bs.create(void 0, void 0, 0)

// clean the cached up a bit
const serialize = (id, client, t, subs, struct, val, level) => {
  if (!struct.isHub) return

  const stamp = get(struct, 'stamp') || defStamp

  var cached, isType

  // remove this whole src thing here
  if (stamp && (val === null || !(cached = isCached(client, struct, stamp))) || subs.val === true) {
    const src = bs.src(stamp)
    // not a good location move and clean
    let getVal = get(struct, 'val')

    if (
      src != client.key && // eslint-disable-line
      bs.src(t.tStamp) != client.key || // eslint-disable-line
      (isType = struct.key === 'type')
    ) {
      if (subs.type) {
        // simple but will make it better need more checks
        var p = struct
        while (p) {
          if (p.key === 'types') {
            return
          }
          p = p._p
        }
      }

      if (!cached) {
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

        if (isType) { // means its blocked otherwise (could be a set form own client)
          // do need to check cached
          typeSerialize(id, client, t, subs, struct, val, level, false, s, stamp, src)
        } else if ((getVal !== void 0 || val === null)) {
          if (val === null) {
            setStamp(s, stamp, src, struct, id, client, level, val)
            s.val = null
          } else {
            if (struct.key === 'type' || subs.type) {
              typeSerialize(id, client, t, subs, struct, val, level, subs.type, s, stamp, src)
            }
            if (struct.key !== 'type' && val !== null) {
              setStamp(s, stamp, src, struct, id, client, level)
              if (getVal && getVal.inherits) {
                s.val = struct.val.path()
                s.val.unshift('@', 'root')

                serialize(id, client, t, subs, struct.val, val, level)
              } else if (getVal !== void 0) {
                s.val = getVal
              }
            }
          }
        }
      }

      if (subs.val === true) {
        const keys = getKeys(struct)
        if (keys) deepSerialize(keys, id, client, t, subs, struct, val, level)
      }

      // if s === empty dont send shit
    }
  }
}

const typeSerialize = (id, client, t, subs, struct, val, level, fromParent, s, ss, src) => {
  // console.log('\n\n💫 typeSerialize', struct.path().join('/'))
  // console.log(struct)
  if (fromParent) {
    const type = get(struct, 'type')
    if (type.compute() !== 'hub') {
      const stamp = get(type, 'stamp') || defStamp
      if (!isCached(client, type, stamp)) {
        // s.type = {}
        serialize(id, client, t, fromParent, type, val, level)
        // console.log('ok type mi bitch')
      }
    }
  } else {
    const type = struct.compute()
    if (type !== 'hub') {
      setStamp(s, ss, src, struct, id, client, level)
      s.val = struct.compute()
      serialize(id, client, t, subs, getType(struct.parent(2), type), val, level)
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
    // also need it for any....
    for (let i = 0, len = struct._removed.length; i < len; i++) {
      let prop = struct._removed[i]
      serialize(id, client, t, subs, prop, null, level)
    }
  }
}

export default send
