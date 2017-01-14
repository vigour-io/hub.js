const hub = require('../')
const test = require('tape')

test('types', t => {
  const scraper = hub({
    id: 'scraper',
    port: 6060,
    somefield: 'somefield!',
    types: {
      rick: { hello: true },
      blurf: { bye: true, x: true }
    },
    bla: {
      // setting val will not sync fields when using val: true this is a limit currently in the hub -- can be changed
      type: 'rick'
    }
  })

  const client = hub({
    id: 'client',
    url: 'ws://localhost:6060'
  })

  client.subscribe({ bla: { val: true, type: true } }, t => {
    console.log('--->', t.path())
  })

  console.log(client.upstreamSubscriptions)

  setTimeout(() => {
    console.log('scraper bla keys:', scraper.bla.keys())
    console.log('client bla keys:', client.bla.keys(), client.bla.type.val)
    // client.set({ bla: { type: 'blurf' } }) -- brings extra complexity (recursive update of nested fields using a type thats does not exist yet)
    // console.log('client bla keys (after switch)', client.bla.keys(), client.bla.type.val)
    // setTimeout(() => {
    //   console.log('???', scraper.bla.keys(), scraper.bla.type.val)
    //   console.log(client.bla.keys())
    // }, 100)
  }, 100)

  t.end()
})
