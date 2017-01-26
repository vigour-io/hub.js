import hash from 'string-hash'

const pid = t => {
  var id = 5381
  var p = t
  while (p) {
    let key = p.key
    if (key !== void 0) {
      id = id * 33 ^ (hash(key))
      p = p._cLevel === 1 ? p._c : p._p
    } else {
      return id >>> 0
    }
  }
  return id >>> 0
}

// const pid = t => t.path().join('')

const cache = (client, struct, stamp) => {
  if (!client.cache) client.cache = {}
  client.cache[pid(struct)] = stamp
}

const isCached = (client, struct, stamp) => client.cache &&
  client.cache[pid(struct)] === stamp

// const isCached = () => false

export { cache, isCached, pid }
