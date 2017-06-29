import { puid } from 'brisky-struct'

// 0b100000000000000000000000000000000000000000000
const contextBit = 17592186044416

const cache = (client, struct, hub, stamp) => {
  if (!client.cache) client.cache = {}
  client.cache[puid(struct)] = hub.contextKey === undefined ? stamp
    : stamp | contextBit
}

const isCached = (client, struct, hub, stamp) => client.cache &&
  client.cache[puid(struct)] === hub.contextKey === undefined ? stamp
    : stamp | contextBit

export { cache, isCached }
