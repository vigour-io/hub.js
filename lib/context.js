'use strict'
const vstamp = require('vigour-stamp')

exports.define = {
  getContext (context) {
    const instances = this.instances
    if (instances) {
      for (let i = 0, len = instances.length; i < len; i++) {
        if (instances[i].context.compute() === context) {
          return instances[i]
        }
      }
    }
  }
}

exports.properties = {
  context: {
    val: false,
    sync: false,
    on: {
      data: {
        context (val, stamp) {
          if (this.val !== null) {
            const hub = this.root
            if (hub.client && hub.client.val) {
              if (stamp) {
                vstamp.done(stamp, () => removeClients(hub))
              } else {
                removeClients(hub)
              }
              hub.client.origin().sendMeta()
            }
          }
        }
      }
    }
  }
}

function removeClients (hub) {
  const contextStamp = vstamp.create('context')
  hub.clients.each((client, key) => {
    if (key != hub.id) { //eslint-disable-line
      client.remove(contextStamp) // do we use the stamp name
    }
  })
  vstamp.close(contextStamp)
}
