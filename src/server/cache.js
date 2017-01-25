
// needs a crazy speed up....
const cache = (client, struct, stamp) => {
  if (!client.cache) client.cache = {}
  client.cache[struct.path().join('/')] = stamp
}

// dont use uid just use somethign like path this is not enough im affraid
const isCached = (client, struct, stamp) => client.cache &&
  client.cache[struct.path().join('/')] === stamp

export { cache, isCached }
