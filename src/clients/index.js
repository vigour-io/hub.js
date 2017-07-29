import { set, create, struct, getType, emit } from 'brisky-struct'
import uid from '../client/uid'

const emitClientUpstream = (t, type, val) => {
  if (t.root().client) {
    console.log('emit: use root.client (upstream)')
    if (!t.root().socket) {
      console.log('emit: 💗 wait until connected')
    } else {
      t.root().socket.send(JSON.stringify([null, {
        emit: {
          broadcast: {
            [t.key]: {
              [type]: val
            }
          }
        }
      }]))
    }
  }
}

export default {
  types: {
    clients: {
      type: 'struct',
      instances: false,
      props: {
        default: {
          type: 'hub',
          instances: false,
          props: {
            cache: true,
            upstreamSubscriptions: true,
            resolve: true,
            socket: true,
            context: true
          },
          define: {
            // event system
            emit (type, val, stamp, dontSend) {
              let sendval = val
              if (val instanceof Error) {
                console.log('ok lets pack it')
                sendval = {
                  _$isError: true,
                  message: val.message,
                  stack: val.stack,
                  from:
                    val.from ||
                    this.root().client && this.root().client.key ||
                    this.root()._uid_ ||
                    'server'
                }
              } else if (val && typeof val === 'object' && val._$isError) {
                const msg = (val.from ? 'from "' + val.from + '": ' : '') +
                  val.message
                const err = new Error()
                err.from = val.from
                err.message = msg
                err.stack = val.stack
                val = err
              }
              if (!dontSend) {
                if (this.socket) {
                  console.log('emit:: has own socket', this.key)
                  // use more unified system -- export progress
                  this.socket.send(JSON.stringify([null, {
                    emit: { [type]: sendval }
                  }]))
                } else {
                  console.log('emit:: does not have own socket', this.key)
                  emitClientUpstream(this, type, sendval)
                }
              }
              if (this.root().client === this) {
                emit(this.root(), type, val, stamp)
              }
              emit(this, type, val, stamp)
            }
          }
        }
      }
    }
  },
  props: {
    clients: (t, val, key, stamp) => {
      if (!t.clients) {
        const clients = getType(t, key)
        t.clients = create(val, stamp, clients, t, key)
      } else {
        set(t.clients, val, stamp)
      }
    }
  },
  define: {
    broadcast (type, val, stamp) {
      console.log('hub', this._uid_, 'broadcast to all clients within context')
      const h = this
      if (h.clients) {
        h.clients.forEach(client => {
          if (client !== h) {
            console.log('emit to client', type)
            client.emit(type, val, stamp)
          }
        })
      }
      // if on master broadcasts to all clients in context - same
      // only within context
    }
  }
}