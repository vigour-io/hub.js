// needs a crazy speed up....
const cache = (client, struct, stamp) => {
  if (!client.cache) client.cache = {}
  // uid is horror
  // when doing stamp sanitation (prob do it in struct itself) x < y etc

  // make uid

  client.cache[struct.path().join('/')] = stamp
}

// auto clear cache -- make 2 of them
// every 1e3 or somehting lets see
// dont use uid just use somethign like path this is not enough im affraid
const isCached = (client, struct, stamp) => client.cache &&
  client.cache[struct.path().join('/')] === stamp

export { cache, isCached }
