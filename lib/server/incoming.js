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
      // switch etc
      console.log('perhaps replace something (e.g. subs or whatever')
      src(client, meta)
      t = hub
    } else {
      t = create(hub, socket, meta)
    }
  } else {
    t = client.parent(2)
  }

  if (payload) {
    console.log(`\n👾👾👾👾👾  in  👾👾👾👾👾`)
    var d = Date.now()
    t.set(payload, false)
    bs.close()
    console.log(`👾👾👾👾👾 ${Date.now() - d} ms 👾👾👾👾👾`)
  }
}

const src = (client, meta) => {
  if (meta.src) {
    if (!client.src) {
      client.src = {}
    }
    for (let i in meta.src) {
      if (meta.src[i] === null) {
        if (client.src[i]) {
          delete client.src[i]
        }
      } else {
        client.src[i] = meta.src
      }
    }
  }
}

const create = (hub, socket, meta) => {
  console.log('\n👾👾👾👾  create client  👾👾👾👾')
  const stamp = bs.create('connect')
  const id = meta.id
  var t
  if (meta.context) {
    // console.log('got context! go do it!')
  } else {
    t = hub // will also become secured -- default will ofc be IP
  }
  t.set({ clients: { [id]: { id: id, socket } } }, stamp)
  const client = socket.client = t.clients[id]
  src(client, meta)
  if (meta.subscriptions) {
    incomingSubscriptions(t, client, meta, id)
  }
  bs.close(stamp)
  return t
}

const incomingSubscriptions = (hub, client, meta, id) => {
  const update = (t, type, subs, tree) => {
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
      // subs._ = { id }
      subscribe(hub, subs, update)
      // can also just add the function to the map
      hub.subscriptions[hub.subscriptions.length - 1].id = id // it aint pretty but works...
    }
  }
}
