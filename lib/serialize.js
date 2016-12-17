// this is a target for optmization

const serialize = (t, struct, val) => {
  const path = struct.path()
  const len = path.length
  var s = t
  for (let i = 0; i < len; i++) {
    let t = s[path[i]]
    if (!t) {
      s = s[path[i]] = {}
    } else {
      s = t
    }
  }
  s.stamp = struct.stamp
  if (val === null) {
    // maybe just on s itself --- this is not so nice
    s.val = null
  } else {
    if (struct.val && struct.val.inherits) {
      s.val = struct.val.path()
      s.val.unshift('@', 'root')
      serialize(t, struct.val)
    } else if (struct.val !== void 0) {
      s.val = struct.val
    }
  }
}

export default serialize
