// this is a target for optmization
import bs from 'brisky-stamp'

const toServer = (id, t, struct, val) => {
  const path = struct.path()
  const len = path.length
  const stamp = struct.stamp

  var s = t
  for (let i = 0; i < len; i++) {
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

export { toServer }
