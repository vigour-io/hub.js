import { struct } from 'brisky-struct'

const clientHub = {
  type: 'hub',
  props: {
    socket: true // only nessecary for downstream clients
  }
}

const props = {
  clients: { // need to exclude on context
    type: 'struct',
    props: {
      default: clientHub
    }
  }
}

const client = {
  type: 'struct',
  define: {
    set (val, stamp) {
      console.log('lets set client! --->')
      if (this.val) {
        this.val.set(val, stamp)
      } else {
        struct.set.call(this, val, stamp)
      }
    }
  }
}

export { client, props }
