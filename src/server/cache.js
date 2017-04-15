import { puid } from 'brisky-struct'

const cache = (client, struct, stamp) => {
  if (!client.cache) client.cache = {}
  client.cache[puid(struct)] = stamp
}

const isCached = (client, struct, stamp) => client.cache &&
  client.cache[puid(struct)] === stamp

export { cache, isCached }
