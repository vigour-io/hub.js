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
  }

  if (payload) {
    // console.log(`\n👾👾👾👾👾  in ${hub.id}  👾👾👾👾👾`)
    // console.log(JSON.stringify(payload, false, 2))
    // var d = Date.now()
    if (meta && meta.resolve) {
      client.resolve = meta.resolve
      t.set(payload, false)
      bs.on(() => { client.resolve = false })
    } else {
      t.set(payload, false)
    }
    bs.close()
    // console.log(`👾👾👾👾👾 ${Date.now() - d} ms 👾👾👾👾👾`)
  }
}

const create = (hub, socket, meta) => {
  const stamp = bs.create('connect')
  const id = meta.id
  // console.log(`\n🐠  create client "${id}" on "${hub.id}"  🐠`)
  var t
  if (meta.context) {
    // console.log('got context! go do it!')
  } else {
    t = hub // will also become secured -- default will ofc be IP
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
      // can also just add the function to the map
      hub.subscriptions[hub.subscriptions.length - 1].id = id // it aint pretty but works...
    }
  }
}
