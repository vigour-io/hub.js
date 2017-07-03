import { puid } from 'brisky-struct'

const contextBit = 0b100000000000000000000000000000000000000000000
const contextBitNegative = 0b1100000000000000000000000000000000000000000000
const pathList = {}

const cache = (client, struct, stamp) => {
  if (!client.cache) client.cache = {}
  const uid = puid(struct)
  if (!pathList[uid]) {
    pathList[uid] = struct.path()
  }
  client.cache[uid] = struct._c ? stamp
    : stamp < 0 ? -stamp | contextBitNegative
    : stamp | contextBit
}

const isCached = (client, struct, stamp) => {
  return client.cache &&
    client.cache[puid(struct)] === (struct._c ? stamp
      : stamp < 0 ? -stamp | contextBitNegative
      : stamp | contextBit)
}

export { cache, isCached }
