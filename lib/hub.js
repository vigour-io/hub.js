import id from './uid'
import { get, c, set, create } from 'brisky-struct'
import * as client from './client'
import * as server from './server'
import * as context from './context'

const hub = create({
  type: 'hub',
  instances: false,
  types: { hub: 'self' },
  props: {
    default: 'self',
    id: (t, val) => { t.set({ define: { id: val } }) },
    clients: (t, val, key, stamp) => {
      if (!t.clients) {
        t.clients = c(clients, val, stamp, t, key)
      } else {
        set(t.clients, val, stamp)
      }
    },
    client: true
  },
  id,
  inject: [
    server,
    context,
    client
  ]
})

const clients = create({
  props: {
    default: hub.create({
      props: {
        cache: true,
        upstreamSubscriptions: true,
        resolve: true,
        socket: true
      }
    })
  }
})

// const props = {
//   clients: (t, val, key, stamp) => {
//     if (!t.clients) {
//       t.clients = c(clients, val, stamp, t, key)
//       console.log('make clients', t.clients.client1 && t.clients.client1.get('type'))
//     } else {
//       set(t.clients, val, stamp)
//     }
//   },
//   client: true
// }


export default hub
