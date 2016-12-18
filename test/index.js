import hub from '../lib'

const client = hub({
  url: 'ws://localhost:6060',
  id: 'client',
  nested: {
    field: {
      url: 'ws://localhost:6061'
    }
  }
})

setTimeout(() => {
  const server2 = hub({
    port: 6061,
    id: 'server2'
  })

  const server = hub({
    port: 6060,
    id: 'server'
  })
}, 100)

client.set({
  hello: true
})

client.nested.field.set({
  haha: true
})