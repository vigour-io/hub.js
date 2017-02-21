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
        create(hub, socket, meta, payload, client)
      } else if (meta.subscriptions) {
        if (payload) setPayload(t, payload, client)
        incomingSubscriptions(t, client, meta, client.key)
        bs.close()
      }
    } else {
      create(hub, socket, meta, payload)
    }
  } else {
    setPayload(client.parent(2), payload, client)
    bs.close()
  }
}

const addToCache = (client, hub, payload) => {
  if (typeof payload === 'object' && payload) {
    for (let key in payload) {
      if (key !== 'val' && key !== 'stamp') {
        let struct = hub[key]
        if (struct && struct.isHub) {
          addToCache(client, hub[key], payload[key])
        }
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

const set = (meta, socket, t, payload) => {
  const stamp = bs.create()
  const id = meta.id
  const context = meta.context
  // const ip = socket._socket.remoteAddress
  const client = socket.client = createClient(
    t, { socket, context }, stamp, socket.useragent, id
  )
  if (payload) setPayload(t, payload, client)
  if (meta.subscriptions) incomingSubscriptions(t, client, meta, id)
  bs.close()
}

const create = (hub, socket, meta, payload, client) => {
  const t = meta.context ? hub.getContext(meta.context, socket) : hub
  if (!t.inherits && t.then) {
    t.then((t) => {
      if (socket.external !== null) {
        console.log('client connected and found informations')
        if (client) removeClient(client)
        set(meta, socket, t, payload)
      } else {
        console.log('client discconected when logging in')
      }
    }).catch(err => hub.emit('error', err))
  } else {
    if (client) removeClient(client)
    set(meta, socket, t, payload)
  }
}

const incomingSubscriptions = (hub, client, meta, id) => {
  const update = (t, type, subs, tree) => send(hub, client, t, type, subs, tree)
  if (!client.upstreamSubscriptions) client.upstreamSubscriptions = {}
  for (let key in meta.subscriptions) {
    const uid = key + '-' + id
    if (!client.upstreamSubscriptions[uid]) {
      const subs = parse(meta.subscriptions[key], hub, void 0, client)
      client.upstreamSubscriptions[uid] = subs
      subscribe(hub, subs, update)
      hub.subscriptions[hub.subscriptions.length - 1]._uid_ = id
    }
  }
}
