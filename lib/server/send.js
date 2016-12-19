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

    console.log(client.key, bs.src(stamp), stamp, bs.src(t.tStamp))
    console.log('\n', type, t.path())
    if (type === 'remove') {
      console.log('REMOVE?')
      // console.log()
    } else if (type === 'update' && tree.$t !== t) {
      console.log('SWITCHED')
    }

    console.log(tree.$t && tree.$t.path(), t.path())

    serialize(hub.id, client, client.inProgress, subs, t, void 0, 0)
  }
}

const serialize = (id, client, t, subs, struct, val, level) => {
  const path = struct.path()
  const len = path.length
  const stamp = struct.stamp

  var s = t
  for (let i = level; i < len; i++) {
    let t = s[path[i]]
    if (!t) {
      s = s[path[i]] = {}
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
