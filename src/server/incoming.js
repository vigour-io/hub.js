import parse from '../subscription/parse'
import { subscribe } from 'brisky-struct'
import bs from 'brisky-stamp'
import send from './send'
import createClient from '../client/create'
import { removeClient } from './remove'

export default (hub, socket, data) => {
  const payload = data[0]

  if (payload) {
    console.log('INCOMING PAYLOAD', payload)
  }

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
        if (payload) t.set(payload, false)
        incomingSubscriptions(t, client, meta, client.key)
        bs.close()
      }
    } else {
      t = create(hub, socket, meta, payload)
      client = socket.client
    }
  } else {
    client.parent(2).set(payload, false)
    bs.close()
  }
}

const create = (hub, socket, meta, payload) => {
  const stamp = bs.create('connect')
  const context = meta.context
  const id = meta._uid_
  const t = context ? hub.getContext(context) : hub
  // const ip = socket._socket.remoteAddress
  const client = socket.client = createClient(
    t, id, { socket, context }, stamp, socket.useragent
  )
  if (payload) t.set(payload, false)
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
