import bs from 'brisky-stamp'

const send = (hub, client, struct, type, subs, tree) => {
  if (!client.inProgress) {
    client.inProgress = {}
    bs.on(() => {
      client.socket.send(JSON.stringify(client.inProgress))
      client.inProgress = false
    })
  }
  serialize(hub.id, client, client.inProgress, subs, struct, void 0, 0)
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

  if (val === null) {
    s.val = null
  } else {
    if (struct.val && struct.val.inherits) {
      s.val = struct.val.path()
      s.val.unshift('@', 'root')
      send(id, client, subs, t, struct.val, val, level)
    } else if (struct.val !== void 0) {
      s.val = struct.val
    }
  }
}

export default send
