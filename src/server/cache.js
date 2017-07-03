import { puid } from 'brisky-struct'

const cache = (client, struct, stamp) => {
  if (!client.cache) client.cache = { master: {}, branch: {} }
  if (struct._c) {
    client.cache.master[puid(struct)] = stamp
  } else {
    client.cache.branch[puid(struct)] = stamp
  }
}

const isCached = (client, struct, stamp) => client.cache &&
  (struct._c ? client.cache.master[puid(struct)] === stamp
    : client.cache.branch[puid(struct)] === stamp)

const reuseCache = (client) => {
  if (!client.cache) return void 0

  for (let uid in client.cache.branch) {
    client.cache.branch[uid] = true
  }

  return {
    cache: {
      master: client.cache.master,
      branch: {}
    },
    remove: client.cache.branch
  }
}

export { cache, isCached, reuseCache }
