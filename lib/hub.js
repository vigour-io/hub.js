import id from './uid'
import { create } from 'brisky-struct'
import * as client from './client'
import * as server from './server'
import * as clients from './clients'
import { context } from './context'

// need to be able to set timestamp mode on bs
// bit harder but lets do it right from the start this time

const hub = create({
  props: {
    default: 'self',
    id: (t, val) => {
      t.set({
        define: { id: val } // mostly for tests so dont bother
        // props: { default: { define: { id: val } } } // do we want this? :X nah
      })
    }
  },
  id: id
})

hub.set({
  types: { hub }, // only wat to make a type of self -- will change later
  inject: [
    client,
    server,
    context,
    clients
  ]
}, false)

export default hub
