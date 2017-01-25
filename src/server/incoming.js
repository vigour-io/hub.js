import parse from '../subscription/parse'
import { subscribe } from 'brisky-struct'
import bs from 'brisky-stamp'
import send from './send'
import createClient from '../client/create'
import { removeClient } from './remove'
import { cache } from './cache'

export default (hub, socket, data) => {
  const payload = data[0]
  const meta = data[1]
  var client = socket.client

  if (meta) {
    let t
    if (client) {
      t = hub
      if ('context' in meta && client.context != meta.context) { // eslint-disable-line
        removeClient(client)
        t = create(hub, socket, meta, payload)
        client = socket.client
      } else if (meta.subscriptions) {
        if (payload) setPayload(t, payload, client)
        incomingSubscriptions(t, client, meta, client.key)
        bs.close()
      }
    } else {
      t = create(hub, socket, meta, payload)
      client = socket.client
    }
  } else {
    setPayload(client.parent(2), payload, client)
    bs.close()
  }
}

const addToCache = (client, hub, payload) => {
  if (typeof payload === 'object') {
    for (let key in payload) {
      if (key !== 'val' && key !== 'stamp') {
        addToCache(client, hub[key], payload[key])
      }
    }
    if (payload.val !== void 0 && payload.stamp) {
      cache(client, hub, payload.stamp)
    }
  }
}

const setPayload = (hub, payload, client) => {
  hub.set(payload, false)
  addToCache(client, hub, payload)
}

const create = (hub, socket, meta, payload) => {
  const stamp = bs.create('connect')
  const context = meta.context
  const id = meta.id
  const t = context ? hub.getContext(context) : hub
  // const ip = socket._socket.remoteAddress
  const client = socket.client = createClient(
    t, { socket, context }, stamp, socket.useragent, id
  )
  if (payload) setPayload(t, payload, client)
  if (meta.subscriptions) incomingSubscriptions(t, client, meta, id)
  bs.close()
  return t
}

const incomingSubscriptions = (hub, client, meta, id) => {
  const update = (t, type, subs, tree) => send(hub, client, t, type, subs, tree)
  if (!client.upstreamSubscriptions) client.upstreamSubscriptions = {}
  for (let key in meta.subscriptions) {
    let uid = key + '-' + id
    if (!client.upstreamSubscriptions[uid]) {
      let subs = parse(meta.subscriptions[key], hub)
      client.upstreamSubscriptions[uid] = subs
      subscribe(hub, subs, update)
      hub.subscriptions[hub.subscriptions.length - 1]._uid_ = id
    }
  }
}
