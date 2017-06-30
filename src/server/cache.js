import { puid } from 'brisky-struct'

const contextBit = 0b100000000000000000000000000000000000000000000
const contextBitNegative = 0b1100000000000000000000000000000000000000000000

const cache = (client, struct, hub, stamp) => {
  if (!client.cache) client.cache = {}
  client.cache[puid(struct)] = hub.contextKey === undefined ? stamp
    : stamp < 0 ? -stamp | contextBitNegative
    : stamp | contextBit
}

const isCached = (client, struct, hub, stamp) => client.cache &&
  client.cache[puid(struct)] === hub.contextKey === undefined ? stamp
    : stamp < 0 ? -stamp | contextBitNegative
    : stamp | contextBit

export { cache, isCached }
