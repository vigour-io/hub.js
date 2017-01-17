import parse from '../subscription/parse'
import { subscribe } from 'brisky-struct'
import bs from 'brisky-stamp'
import send from './send'
import createClient from '../client/create'
import { removeSubscriptions } from './remove'
import ua from 'vigour-ua'

export default (hub, socket, data) => {
  const payload = data[0]
  const meta = data[1]
  var client = socket.client
  var t
  if (meta) {
    console.log('INCOMING', meta.context, ua(socket.useragent).device, hub.id)
    if (client) {
      t = hub
      if ('context' in meta && client.context != meta.context) { // eslint-disable-line
        console.log('SWITCH CONTEXT --- REMOVE SUBS', meta.context, client.key, client.parent(2).subscriptions.map(val => val.id))
        removeSubscriptions(client.parent(2), client.key)
        console.log('REMOVE SUBS', meta.context, client.key, client.parent(2).subscriptions.map(val => val.id))
        client.set(null)
        // also remove subs
        t = create(hub, socket, meta)
        client = socket.client
      } else if (meta.subscriptions) {
        incomingSubscriptions(t, client, meta, client.id)
        bs.close()
      }
    } else {
      t = create(hub, socket, meta)
      client = socket.client
    }
  } else {
    console.log('GET PARENT')
    t = client.parent(2)
    console.log(t.contextKey)
  }

  if (payload) {
    console.log('INCOMING PAYLOAD', JSON.stringify(payload, false, 2))
    if (meta && meta.resolve) {
      client.resolve = meta.resolve
      t.set(payload, false)
      bs.on(() => { client.resolve = false })
    } else {
      t.set(payload, false)
    }
    bs.close()
  }
}

const create = (hub, socket, meta) => {
  const stamp = bs.create('connect')
  const context = meta.context
  const id = meta.id
  const t = context ? hub.getContext(context) : hub
  // const ip = socket._socket.remoteAddress
  const client = socket.client = createClient(
    t, id, { socket, context }, stamp, socket.useragent
  )
  if (meta.subscriptions) incomingSubscriptions(t, client, meta, id)
  bs.close(stamp)
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
      hub.subscriptions[hub.subscriptions.length - 1].id = id
    }
  }
}
