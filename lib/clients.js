// import { struct } from 'brisky-struct'

const clientHub = {
  type: 'hub',
  props: {
    cache: true,
    src: true,
    upstreamSubscriptions: true,
    socket: true // only nessecary for downstream clients
  }
}

const props = {
  clients: { // need to exclude on context
    props: {
      default: clientHub
    }
  },
  client: true // test if you can subscribe to it
}

export { props }
