import uid from './uid'
import { create } from 'brisky-struct'
import client from './client'
import server from './server'

// bit harder but lets do it right from the start this time
const hub = create({
  type: 'hub',
  define: { uid },
  props: {
    default: 'self'
  },
  inject: [
    client,
    server
  ]
})

export default hub
