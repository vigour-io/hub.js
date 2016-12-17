'use strict'
const connect = require('./connect')

exports.properties = {
  upstream: true,
  reconnect: true,
  queue: true,
  url: {
    // this makes the client
    sync: false,
    on: {
      data: {
        connect (data, stamp) {
          const hub = this.cParent()
          const val = this.compute()
          if (hub.upstream) {
            if (hub.reconnect) {
              clearTimeout(hub.reconnect)
              hub.reconnect = null
            }
            hub.upstream.blockReconnect = true
            hub.upstream.close()
          }
          hub.set({ connected: false }, stamp)
          if (val) { connect(hub, val, 50) }
        }
      }
    }
  },
  connected: {
    sync: false,
    on: {
      data: {
        clients (val, stamp) {
          const hub = this.cParent()
          if (this.compute() === false && hub.upstream) {
            // put this in clients (the file)
            const clients = hub.clients
            if (clients && clients.keys().length > 1) {
              clients.each((client) => {
                if (
                  client.val !== null &&
                  !client.socket &&
                  client.key != hub.id // eslint-disable-line
                ) {
                  client.remove(stamp)
                }
              })
            }
          }
        }
      }
    }
  }
}
