import { parse } from '../subscription'
import { subscribe } from 'brisky-struct'
import chalk from 'chalk'

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
  console.log('create client')
  const id = meta.id
  var t
  if (meta.context) {
    console.log('got context! go do it!')
  } else {
    // will also become secured
    t = hub
  }
  t.set({ clients: { [id]: { id: id, socket } } }, false)
  const client = socket.client = t.clients[id]
  if (meta.subscriptions) {
    incomingSubscriptions(t, client, meta, id)
  }
  return t
}

const incomingSubscriptions = (t, client, meta, id) => {
  if (!client.upstreamSubscriptions) {
    client.upstreamSubscriptions = {}
  }
  for (let key in meta.subscriptions) {
    // can use this to send subs higher up (can batch pretty easy by using the key)
    let uid = key + '-' + id
    if (!client.upstreamSubscriptions[uid]) {
      console.log(' go parse subs', key)
      let subs = parse(meta.subscriptions[key])
      client.upstreamSubscriptions[uid] = subs
      subs._ = { id }
      console.log(chalk.cyan('   >>>>>'), subs, t.keys())
      subscribe(t, subs, update)
    }
  }
}

const update = (t, type) => {
  console.log('------------', chalk.green('UPDATE'))
}
