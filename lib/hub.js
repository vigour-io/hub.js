import id from './uid'
import { c, set, create, struct } from 'brisky-struct'
import * as client from './client'
import * as server from './server'
import * as context from './context'

const types = struct.props.types

const hub = create({
  type: 'hub',
  instances: false,
  define: { isHub: true },
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
    types: types.bind(), // to not interfere with struct type
    type: struct.props.type.bind(),
    client: true
  },
  id
})

hub.props.types.struct = c(hub, {
  props: { default: types.struct.props.default.bind() }
})

hub.props.types.struct.props.default.struct = hub.props.type.struct = hub

hub.set({ types: { hub: 'self' }, inject: [ server, context, client ] }, false)

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
