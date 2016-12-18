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

client.subscribe({
  gurt: true
}, (t) => {
  console.log('INCOMING ON CLIENT', t.path())
})

setTimeout(() => {
  const server2 = hub({ //eslint-disable-line
    port: 6061,
    id: 'server2'
  })

  const server = hub({ //eslint-disable-line
    port: 6060,
    id: 'server',
    gurt: 'its a gurt!'
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
