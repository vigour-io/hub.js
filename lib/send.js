import {
  toServer as serializeToServer,
  toClient as serializeToClient
} from './serialize'
import bs from 'brisky-stamp'
// just add serialize in these files dont rly need to split up
// this way you can jsut have 2 files here

// --- UPSTREAM -----
const inProgress = (t, tick) => {
  if (!t.inProgress) {
    t.inProgress = [{}]
    tick(() => { // maybe just use process next tick
      if (t.connected.compute() === true) {
        send(t)
      } else {
        t.connected.once(true, () => send(t))
      }
    })
  }
  return t.inProgress
}

// setImmediate shim for browser
const sendMeta = hub => {
  const store = inProgress(hub, setImmediate)
  store[1] = {
    context: hub.clientContext,
    id: hub.id,
    // maybe dont resend them all the time do that later :/
    subscriptions: hub.upstreamSubscriptions
  }
}

// serialize will go into this file
const toServer = (hub, val, stamp, struct) =>
  serializeToServer(hub.id, inProgress(hub, bs.on)[0], struct, val, hub.urlIndex)

// --- DOWNSTREAM -----
// same thing you can have servers on multiple entry points (multi server object)
// const toClient = (id, client, subs, t, struct, val, level) => {

const toClient = (hub, client, struct, type, subs, tree) => {
  if (!client.inProgress) {
    client.inProgress = {}
    bs.on(() => send(client))
  }
  // lots need to happen remove especialy

  serializeToClient(hub.id, client, client.inProgress, subs, struct, void 0, 0)
}

// ----- SHARED -------
const send = t => {
  t.socket.send(JSON.stringify(t.inProgress))
  t.inProgress = false
}

export { sendMeta, toServer, toClient }
