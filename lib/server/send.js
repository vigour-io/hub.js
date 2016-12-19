import bs from 'brisky-stamp'

const toClient = (hub, client, struct, type, subs, tree) => {
  if (!client.inProgress) {
    client.inProgress = {}
    bs.on(() => out(client))
  }
  serialize(hub.id, client, client.inProgress, subs, struct, void 0, 0)
}

const serialize = (id, client, t, subs, struct, val, level) => {
  // id will be client id
  const path = struct.path() // memoize functionality -- good for hubs
  const len = path.length
  const stamp = struct.stamp
  // if (!stamp) cant send it
  // ! till root

  // can be shared
  var s = t
  for (let i = level; i < len; i++) { // add level as well why not? can be handy in some cases
    let t = s[path[i]]
    if (!t) {
      s = s[path[i]] = {}
    } else {
      s = t
    }
  }
  // here we will block some stuff
  if (typeof stamp === 'number') {
    // from server
    s.stamp = bs.create(bs.type(stamp), id, bs.val(stamp))
  } else {
    s.stamp = stamp
  }

  if (val === null) {
    // NEED TO GO ONE UP
    // maybe just on s itself --- this is not so nice
    s.val = null // this will not work -- need to make it work
  } else {
    if (struct.val && struct.val.inherits) {
      s.val = struct.val.path()
      s.val.unshift('@', 'root')
      toClient(id, client, subs, t, struct.val, val, level)
    } else if (struct.val !== void 0) {
      s.val = struct.val
    }
  }
}

// ----- SHARED -------
const out = t => {
  t.socket.send(JSON.stringify(t.inProgress))
  t.inProgress = false
}

export { toClient }
