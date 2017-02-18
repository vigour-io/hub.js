const hub = require('../')
const test = require('tape')

test('context', { timeout: 2000 }, t => {
  const server = hub({
    _uid_: 'server',
    port: 6060,
    somefield: 'somefield!',
    clients: {
      props: {
        default: {
          ha: true,
          blurf: 'HA!'
        }
      }
    }
  })

  const client = hub({
    _uid_: 'client',
    url: 'ws://localhost:6060'
  })

  const client2 = hub({
    _uid_: 'client2',
    url: 'ws://localhost:6060'
  })

  client.subscribe({
    client: {
      ha: true
    },
    clients: {
      $any: {
        $keys: (keys, state) => keys.filter(val => val !== state.root().client.key),
        blurf: true
      }
    }
  })

  Promise.all([
    client.get([ 'client', 'ha' ], {}).once(true),
    client.get([ 'clients', 'client2', 'blurf' ], {}).once('HA!')
  ]).then(() => {
    console.log('ok rdy')
    client.set(null)
    client2.set(null)
    server.set(null)
    t.end()
  })
})
