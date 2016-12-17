import hub from '../lib'

const client = hub({
  url: 'ws://localhost:6060'
})

setTimeout(() => {
  const server = hub({ port: 6060 })
}, 100)

client.set({
  hello: true
})
