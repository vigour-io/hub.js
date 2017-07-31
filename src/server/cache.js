import { puid } from 'brisky-struct'

// Get local root
const getRoot = t => {
  while (t._p) {
    t = t._p
  }
  return t
}

const cache = (client, struct, stamp) => {
  if (!client.cache) client.cache = { master: {}, branch: {} }
  const uid = puid(struct)
  if (getRoot(struct).contextKey) {
    delete client.cache.master[uid]
    client.cache.branch[uid] = stamp
    // console.log('branch cache', struct.path(), getRoot(struct).contextKey)
  } else {
    delete client.cache.branch[uid]
    client.cache.master[uid] = stamp
    // console.log('master cache', struct.path())
  }
}

const isCached = (client, struct, stamp) => client.cache &&
  (getRoot(struct).contextKey ? client.cache.branch[puid(struct)] === stamp
    : client.cache.master[puid(struct)] === stamp)

const reuseCache = (client) => {
  if (!client.cache) return void 0

  return {
    cache: {
      master: client.cache.master,
      branch: {}
    },
    remove: client.cache.branch
  }
}

export { cache, isCached, reuseCache }
