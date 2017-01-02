import { contextProperty, get, c, set, create } from 'brisky-struct'
// same for connected

/*
import { get } from './get'
import { addKey } from './keys'
import { create, set } from './manipulate'
import { contextProperty } from './context'

const property = (t, val, key, stamp, struct) => {
  var changed
  const result = get(t, key)
  if (result && result.inherits) {
    if (result.context) {
      contextProperty(t, val, stamp, key, result)
    } else {
      set(result, val, stamp)
      changed = val === null
    }
  } else {
    changed = true
    addKey(t, key)
    create(struct, val, stamp, t, key)
  }
  return changed
}
*/

const client = {
  type: 'hub',
  props: {
    cache: true,
    upstreamSubscriptions: true,
    // isUpstream: true,
    // myupstream subs
    resolve: true,
    socket: true // only nessecary for downstream clients
  }
}

const clients = create({
  props: { default: client }
})

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
