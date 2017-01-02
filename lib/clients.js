import { get, c, set, create } from 'brisky-struct'

const client = {
  type: 'hub',
  props: {
    cache: true,
    upstreamSubscriptions: true,
    resolve: true,
    socket: true
  }
}

const clients = create({ props: { default: client } })

const props = {
  clients: (t, val, key, stamp) => {
    if (!t.clients) {
      t.clients = c(clients, val, stamp, t, key)
    } else {
      set(t.clients, val, stamp)
    }
  },
  client: true // test if you can subscribe to it
}

export { props }
