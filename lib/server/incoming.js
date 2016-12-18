import { parse } from '../subscription'
import { subscribe } from 'brisky-struct'
import bs from 'brisky-stamp'
import { toClient } from '../send'
// import chalk from 'chalk'

export default (hub, socket, data) => {
  const payload = data[0]
  const meta = data[1]
  var client = socket.client
  var t

  if (meta) {
    console.log(' \n meta time')
    if (client) {
      console.log('perhaps replace something (e.g. subs or whatever')
    } else {
      t = create(hub, socket, meta)
    }
  } else {
    t = client.parent(2)
  }
  // need to handle .stamp in the data...
  if (payload) {
    // if you have your own upstream you instan send this upstream as well -- not enough -- need to know more like
    t.set(payload)
  }
}

const create = (hub, socket, meta) => {
  const stamp = bs.create('connect')
  console.log('create client')
  const id = meta.id
  var t
  if (meta.context) {
    console.log('got context! go do it!')
  } else {
    t = hub // will also become secured -- default will ofc be IP
  }
  // actually pretty nice to fire this one...
  t.set({ clients: { [id]: { id: id, socket } } }, stamp)
  const client = socket.client = t.clients[id]
  if (meta.subscriptions) {
    incomingSubscriptions(t, client, meta, id)
  }
  bs.close(stamp)
  return t
}

const incomingSubscriptions = (hub, client, meta, id) => {
  const update = (struct, type, subs, tree) =>
    toClient(hub, client, struct, type, subs, tree)

  if (!client.upstreamSubscriptions) {
    client.upstreamSubscriptions = {}
  }

  for (let key in meta.subscriptions) {
    let uid = key + '-' + id
    if (!client.upstreamSubscriptions[uid]) {
      let subs = parse(meta.subscriptions[key])
      client.upstreamSubscriptions[uid] = subs
      subs._ = { id }
      subscribe(hub, subs, update)
    }
  }
}
