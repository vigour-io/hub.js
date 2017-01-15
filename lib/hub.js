import id from './uid'
import { c, set, create, struct } from 'brisky-struct'
import * as client from './client'
import * as server from './server'
import * as context from './context'

const type = struct.props.type
const types = struct.props.types

const hub = create({
  type: 'hub',
  instances: false,
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
    types: (t, val, key, stamp, isNew, original) =>
      types(t, val, key, stamp, isNew, original),
    type: (t, val, key, stamp, isNew, original) =>
      type(t, val, key, stamp, isNew, original),
    client: true
  },
  id
})

hub.props.type.struct = hub

const typeDefault = types.struct.props.default

hub.props.types.struct = c(types.struct, {
  define: { isHub: true },
  props: {
    default: (t, val, key, stamp, isNew, original) =>
      typeDefault(t, val, key, stamp, isNew, original)
  }
})

hub.props.types.struct.props.default.struct = hub

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
