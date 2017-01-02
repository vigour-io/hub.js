import id from './uid'
import { create } from 'brisky-struct'
import * as client from './client'
import * as server from './server'
import * as clients from './clients'
import * as context from './context'
// need to be able to set timestamp mode on bs -- allways fo ts on bs

const hub = create({
  type: 'hub',
  instances: false,
  types: { hub: 'self' },
  props: {
    default: 'self',
    id: (t, val) => { t.set({ define: { id: val } }) }
  },
  id: id,
  inject: [
    client,
    server,
    context,
    clients
  ]
})

export default hub
