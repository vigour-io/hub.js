import { puid } from 'brisky-struct'

const cache = (client, struct, stamp) => {
  if (!client.cache) client.cache = { master: {}, branch: {} }
  const uid = puid(struct)
  if (struct._c) {
    delete client.cache.branch[uid]
    client.cache.master[uid] = stamp
    // console.log('master cache', struct.path())
  } else {
    delete client.cache.master[uid]
    client.cache.branch[uid] = stamp
    // console.log('branch cache', struct.path(), getRoot(struct).contextKey)
  }
}

const isCached = (client, struct, stamp) => client.cache &&
  (struct._c ? client.cache.master[puid(struct)] === stamp
    : client.cache.branch[puid(struct)] === stamp)

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
