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
    console.log('\n👾👾👾👾  in  👾👾👾👾')
    var d = Date.now()
    // console.log(JSON.stringify(payload, false, 2))
    // if you have your own upstream you instan send this upstream as well -- not enough -- need to know more like
    t.set(payload, false)
    bs.close()
    console.log(`👾👾👾👾👾 ${Date.now() - d} ms 👾👾👾👾👾`)
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
  const update = (t, type, subs, tree) => {
    if (!t.path || typeof t.path !== 'function') {
      console.log('---------------->', t, type, subs, tree)
      throw Error('WRONG no path')
    }
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
