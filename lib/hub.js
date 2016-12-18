import id from './uid'
import { create } from 'brisky-struct'
import * as client from './client'
import * as server from './server'

// need to be able to set timestamp mode on bs
// bit harder but lets do it right from the start this time
const hub = create({
  type: 'hub',
  props: {
    default: 'self',
    id: (t, val) => {
      t.set({
        define: { id: val } // mostly for tests so dont bother
        // props: { default: { define: { id: val } } } // do we want this? :X nah
      })
    }
  },
  id: id,
  inject: [
    client,
    server
  ]
})

export default hub
