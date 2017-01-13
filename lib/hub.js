import id from './uid'
import { c, set, create, struct } from 'brisky-struct'
import * as client from './client'
import * as server from './server'
import * as context from './context'

const type = struct.props.type

const hub = create({
  type: 'hub',
  instances: false,
  types: { hub: 'self' },
  define: { isHub: true },
  props: {
    default: 'self',
    // lets make type into a hub
    id: (t, val) => { t.set({ define: { id: val } }) },
    clients: (t, val, key, stamp) => {
      if (!t.clients) {
        t.clients = c(clients, val, stamp, t, key)
      } else {
        set(t.clients, val, stamp)
      }
    },
    type: (t, val, key, stamp, isNew, original) =>
      type(t, val, key, stamp, isNew, original),
    client: true
  },
  id,
  inject: [ server, context, client ]
})

hub.props.type.struct = hub

// console.log(hub.props.type === struct.props.type)

const clients = create({
  props: {
    default: hub.create({
      props: {
        cache: true,
        upstreamSubscriptions: true,
        resolve: true,
        socket: true,
        context: true
      }
    })
  }
})

export default hub
