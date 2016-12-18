// this is a target for optmization
import bs from 'brisky-stamp'

const toServer = (id, t, struct, val, level) => {
  const path = struct.path() // memoize functionality -- good for hubs
  const len = path.length
  const stamp = struct.stamp
  // if (!stamp) cant send it
  // ! till root
  // make htis into a function
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
    // NEED TO GO ONE UP
    // maybe just on s itself --- this is not so nice
    s.val = null // this will not work -- need to make it work
  } else {
    if (struct.val && struct.val.inherits) {
      s.val = struct.val.path()
      s.val.unshift('@', 'root')
      toServer(id, t, struct.val)
    } else if (struct.val !== void 0) {
      s.val = struct.val
    }
  }
}

// subs is only for deep

// hub.id, client, subs, struct, 0
// hub.id, client, client.inProgress, subs, struct, void 0, 0
const toClient = (id, client, t, subs, struct, val, level) => {
  // id will be client id

  const path = struct.path() // memoize functionality -- good for hubs
  const len = path.length
  const stamp = struct.stamp
  // if (!stamp) cant send it
  // ! till root
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
      console.log('go go go', s.val)
      toClient(id, client, subs, t, struct.val, val, level)
    } else if (struct.val !== void 0) {
      s.val = struct.val
    }
  }
}

export { toServer, toClient }
