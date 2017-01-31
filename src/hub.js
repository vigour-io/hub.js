import { set, create, struct } from 'brisky-struct'
import * as client from './client'
import * as server from './server'
import { getContext } from './context'

if (typeof window === 'undefined') {
  // dont do this gets added to client...
  require('source-map-support').install()
}

const types = struct.props.types

const hub = create({
  type: 'hub',
  instances: false,
  define: { isHub: true },
  props: {
    default: 'self',
    getContext: (t, fn) => {
      t.set({
        define: {
          getContext (key) {
            return fn(this, key, getContext)
          }
        }
      })
    },
    _uid_: (t, val) => { t.set({ define: { _uid_: val } }) },
    clients: (t, val, key, stamp) => {
      if (!t.clients) {
        t.clients = create(val, stamp, clients, t, key)
      } else {
        set(t.clients, val, stamp)
      }
    },
    types: types.bind(), // to not interfere with struct type
    type: struct.props.type.bind(),
    client: true
  },
  getContext: (hub, key, context) => context(hub, key)
})

hub.props.types.struct = hub.create({
  props: { default: types.struct.props.default.bind() }
}, false)

hub.props.types.struct.props.default.struct = hub.props.type.struct = hub

hub.set({ types: { hub: 'self' }, inject: [ server, client ] }, false)

hub.types._ks = void 0

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
    }, false)
  }
}, false)

export default hub
