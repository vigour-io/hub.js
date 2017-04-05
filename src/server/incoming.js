import parse from '../subscription/parse'
import { subscribe } from 'brisky-struct'
import bs from 'stamp'
import send from './send'
import createClient from '../client/create'
import { removeClient } from './remove'
import { cache } from './cache'

const parsed = {}

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
      } else if (meta.s) {
        if (payload) setPayload(t, payload, client)
        incomingSubscriptions(t, client, meta, client.key)
        bs.close()
      }
    } else {
      create(hub, socket, meta, payload)
    }
  } else if (client) {
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
  if (meta.s) incomingSubscriptions(t, client, meta, id)
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
    }).catch(err => {
      // maybe need to dc the client - at least send some information
      hub.emit('error', err)
    })
  } else {
    if (client) removeClient(client)
    set(meta, socket, t, payload)
  }
}

const incomingSubscriptions = (hub, client, meta, id) => {
  if (!client) return // silent gaurd

  const update = (t, type, subs, tree) => send(hub, client, t, type, subs, tree)

  if (!client.upstreamSubscriptions) client.upstreamSubscriptions = {}

  if (meta.m) {
    for (let key in meta.m) { parsed[key] = meta.m[key] }
  }

  let requestSubs
  let i = meta.s.length
  while (i--) {
    const key = meta.s[i]
    if (!parsed[key]) {
      if (!requestSubs) requestSubs = []
      requestSubs.push(key)
    } else {
      const uid = key + '-' + id
      if (!client.upstreamSubscriptions[uid]) {
        const subs = parse(parsed[key], hub, void 0, client)
        client.upstreamSubscriptions[uid] = subs
        subscribe(hub, subs, update)
        hub.subscriptions[hub.subscriptions.length - 1]._uid_ = id
      }
    }
  }

  if (requestSubs) {
    client.socket.send('#1' + JSON.stringify(requestSubs))
  }
}

// this can become super efficient ofc -- replace client in very smart way -- blueprint $CLIENT -- this is the client id
// could even do something like -- update._uid_ use this as a key
