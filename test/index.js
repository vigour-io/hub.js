import hub from '../lib'

const client = hub({
  url: 'ws://localhost:6060',
  id: 'client',
  nested: {
    field: {
      id: 'client',
      url: 'ws://localhost:6061'
    }
  }
})

setTimeout(() => {
  const server2 = hub({ //eslint-disable-line
    port: 6061,
    id: 'server2'
  })

  const server = hub({ //eslint-disable-line
    port: 6060,
    id: 'server'
  })
}, 100)

client.set({
  hello: true, // to server 1
  nested: {
    field: {
      haha: true // will be send to server2
    }
  }
})
