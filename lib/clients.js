import { struct } from 'brisky-struct'

const client = {
  props: {
    socket: true // only nessecary for downstream clients
  }
}

export default {
  props: {
    client: {
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
    },
    clients: { // need to exclude on context
      props: {
        default: { client }
      }
    }
  }
}
