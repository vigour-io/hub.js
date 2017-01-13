const hub = require('../')
const test = require('tape')

test('types', t => {
  const scraper = hub({
    id: 'scraper',
    port: 6060,
    somefield: 'somefield!',
    types: {
      rick: { hello: true }
    },
    bla: {
      type: 'rick'
    }
  })

  const client = hub({
    id: 'client',
    url: 'ws://localhost:6060'
  })

  client.subscribe({ bla: { val: true, type: true } }, (t) => {
    console.log('--->', t.path())
  })

  setTimeout(() => {
    console.log(scraper.bla.keys())
    console.log(!!client.bla, client.bla.keys())
  }, 100)

  t.end()
})
