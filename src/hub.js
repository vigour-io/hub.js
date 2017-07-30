import { create, struct } from 'brisky-struct'
import * as client from './client'
import context from './context'
import server from './server'
import clients from './clients'

const types = struct.props.types

const hub = create({
  type: 'hub',
  instances: false,
  define: {
    isHub: true,
    listen (port) {
      this.set({ port })
      return this
    },
    connect (url) {
      this.set({ url })
      return this
    }
  },
  props: {
    default: 'self',
    _uid_: (t, val) => { t.set({ define: { _uid_: val } }) },
    _forceHeartbeat_: true,
    types: types.bind(), // to not interfere with struct type
    type: struct.props.type.bind(),
    client: true
  }
})

hub.props.types.struct = hub.create({
  props: { default: types.struct.props.default.bind() }
}, false)

hub.props.types.struct.props.default.struct = hub.props.type.struct = hub

// make a clients folder (client is pretty un clear now...)
hub.set({
  types: { hub: 'self' },
  inject: [ clients, server, client, context ]
}, false)

hub.types._ks = void 0

export default hub
