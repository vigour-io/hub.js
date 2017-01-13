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
      val: 'gur',
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
    console.log(scraper.bla.serialize())
    console.log(!!client.bla, client.bla.type.val)
  }, 100)

  t.end()
})
