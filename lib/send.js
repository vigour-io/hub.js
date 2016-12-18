import { toServer as serialize } from './serialize'
import bs from 'brisky-stamp'

// --- completely for up -----
const inProgress = (t, tick) => {
  if (!t.inProgress) {
    t.inProgress = { d: {} }
    tick(() => { // maybe just use process next tick
      if (t.connected.compute() === true) {
        send(t)
      } else {
        t.connected.once(true, () => {
          send(t)
        })
      }
    })
  }
  return t.inProgress
}

// setImmediate shim for browser

const sendMeta = hub => {
  const store = inProgress(hub, setImmediate)
  store.context = hub.clientContext
  store.id = hub.id
  // store.subscriptions = hub.subscriptions
}

const toServer = (hub, val, stamp, struct) =>
  serialize(hub.id, inProgress(hub, bs.on).d, struct, val, hub.urlIndex)

// so yeah can just add it to the client perhaps -- more parity
const send = t => {
  t.socket.send(JSON.stringify(t.inProgress))
  t.inProgress = false
}

export { sendMeta, toServer }
