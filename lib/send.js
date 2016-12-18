import { toServer as serializeToServer } from './serialize'
import bs from 'brisky-stamp'

// this can be rewritten
// maybe add it on client (as before)
export const toServer = (hub, val, stamp, struct) => {
  if (!hub.inProgress) {
    hub.inProgress = { d: {} }
    bs.on(() => { // maybe just use process next tick...
      if (hub.connected.compute() === true) {
        send(hub)
      } else {
        hub.connected.once(true, () => {
          send(hub)
        })
      }
    })
  }
  // struct
  serializeToServer(hub.id, hub.inProgress.d, struct, val)
}

const send = hub => {
  hub.socket.send(JSON.stringify(hub.inProgress))
  hub.inProgress = false
}
