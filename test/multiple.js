import hub from '../lib'
import test from 'tape'

test('client - multiple', t => {
  const server = hub({
    key: 'server',
    port: 6060,
    id: 'server'
  })

  server.subscribe({
    val: true
  }, (t, type) => {
    console.log('server', t.path(), type)
  })

  const hybrid = hub({
    key: 'hybrid',
    port: 6061,
    url: 'ws://localhost:6060',
    id: 'hybrid'
  })

  hybrid.subscribe({
    val: true
  }, (t, type) => {
    console.log('hybrid', t.path(), type)
  })

  const client = hub({
    key: 'client',
    url: 'ws://localhost:6061'
  })

  client.subscribe({
    val: true
  }, (t, type) => {
    console.log('client', t.path(), type)
  })

  setTimeout(() => {
    client.set('hello')
  }, 100)
})
