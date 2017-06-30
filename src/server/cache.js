import { puid } from 'brisky-struct'

const cache = (client, struct, hub, stamp) => {
  if (!client.cache) client.cache = {}
//  client.cache[puid(struct)] = hub.contextKey === undefined ? stamp
//    : stamp | contextBit
  client.cache[puid(struct)] = stamp
}

//  const isCached = (client, struct, hub, stamp) => client.cache &&
//    client.cache[puid(struct)] === hub.contextKey === undefined ? stamp
//    : stamp | contextBit

const isCached = (client, struct, stamp) => client.cache &&
  client.cache[puid(struct)] === stamp

export { cache, isCached }
