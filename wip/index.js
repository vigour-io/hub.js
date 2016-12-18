import hub from '../lib'

const client = hub({
  url: 'ws://localhost:6060'
})

client.set({
  blurf: true
})
