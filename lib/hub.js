import id from './uid'
import { create } from 'brisky-struct'
import * as client from './client'
import * as server from './server'

// bit harder but lets do it right from the start this time
const hub = create({
  type: 'hub',
  props: {
    default: 'self',
    id: (t, val) => {
      t.set({ define: { id: val } })
    }
  },
  id: id,
  inject: [
    client,
    server
  ]
})

export default hub
