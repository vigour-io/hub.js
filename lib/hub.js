import id from './uid'
import { create } from 'brisky-struct'
import * as client from './client'
import * as server from './server'
import * as clients from './clients'
import { context } from './context'

// need to be able to set timestamp mode on bs
// bit harder but lets do it right from the start this time

const hub = create({
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
