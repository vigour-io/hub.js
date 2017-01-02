import parse from '../subscription/parse'
import { subscribe } from 'brisky-struct'
import bs from 'brisky-stamp'
import send from './send'

export default (hub, socket, data) => {
  const payload = data[0]
  const meta = data[1]
  var client = socket.client
  var t
  if (meta) {
    if (client) {
      t = hub
      // switch etc
      if (meta.subscriptions) {
        incomingSubscriptions(t, client, meta, client.id)
        bs.close()
      }
      // console.log('perhaps replace something (e.g. subs or whatever')
    } else {
      t = create(hub, socket, meta)
      client = socket.client
    }
  } else {
    t = client.parent(2)
    console.log('--->', t.contextKey)
  }

  if (payload) {
    if (meta && meta.resolve) {
      client.resolve = meta.resolve
      t.set(payload, false)
      bs.on(() => { client.resolve = false })
    } else {
      console.log('SET', payload)
      t.set(payload, false)
    }
    bs.close()
  }
}

const create = (hub, socket, meta) => {
  const stamp = bs.create('connect')
  const id = meta.id
  var t
  if (meta.context) {
    t = hub.getContext(meta.context)
  } else {
    t = hub
  }
  t.set({ clients: { [id]: { socket } } }, stamp)
  const client = socket.client = t.clients[id]
  if (meta.subscriptions) {
    incomingSubscriptions(t, client, meta, id)
  }
  bs.close(stamp)
  return t
}

const incomingSubscriptions = (hub, client, meta, id) => {
  const update = (t, type, subs, tree) => {
    console.log('UPDATE', hub.contextKey, t.path())
    send(hub, client, t, type, subs, tree)
  }

  if (!client.upstreamSubscriptions) {
    client.upstreamSubscriptions = {}
  }

  for (let key in meta.subscriptions) {
    let uid = key + '-' + id
    if (!client.upstreamSubscriptions[uid]) {
      let subs = parse(meta.subscriptions[key], hub)
      client.upstreamSubscriptions[uid] = subs
      subscribe(hub, subs, update)
      hub.subscriptions[hub.subscriptions.length - 1].id = id // it aint pretty but works...
    }
  }
}
