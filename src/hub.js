import { set, create, struct, getType } from 'brisky-struct'
import * as client from './client'
import context from './context'
import server from './server'

const types = struct.props.types

const hub = create({
  type: 'hub',
  instances: false,
  define: { isHub: true },
  props: {
    default: 'self',
    _uid_: (t, val) => { t.set({ define: { _uid_: val } }) },
    types: types.bind(), // to not interfere with struct type
    type: struct.props.type.bind(),
    client: true
  }
})

hub.props.types.struct = hub.create({
  props: { default: types.struct.props.default.bind() }
}, false)

hub.props.types.struct.props.default.struct = hub.props.type.struct = hub

hub.set({
  types: {
    hub: 'self',
    clients: {
      type: 'struct',
      instances: false,
      props: {
        default: hub.create({
          instances: false,
          props: {
            cache: true,
            upstreamSubscriptions: true,
            resolve: true,
            socket: true,
            context: true
          }
        }, false)
      }
    }
  },
  props: {
    clients: (t, val, key, stamp) => {
      if (!t.clients) {
        const clients = getType(t, key)
        t.clients = create(val, stamp, clients, t, key)
      } else {
        set(t.clients, val, stamp)
      }
    }
  },
  inject: [ server, client, context ]
}, false)

hub.types._ks = void 0

export default hub
