const hub = require('../')
const test = require('tape')

test('types', t => {
  const scraper = hub({
    id: 'scraper',
    port: 6060,
    somefield: 'somefield!',
    types: {
      rick: { val: 'rick', hello: true },
      james: {
        val: 'james',
        a: {
          b: {
            c: 'c!'
          }
        }
      },
      blurf: { bye: true, x: true, y: true, z: true }
    },
    blax: {
      type: 'james'
    },
    bla: {
      type: 'rick'
    },
    blurf: {
      type: 'james'
    }
  })

  const client = hub({
    id: 'client',
    url: 'ws://localhost:6060',
    blurf: {
      on: {
        data: (val, stamp, t) => {
          console.log('????', t.compute(), val)
        }
      }
    }
  })

  client.subscribe({
    bla: { val: true, type: true },
    blurf: {
      a: { b: { c: true } },
      type: true
    }
  }, () => {
    // console.log('????', client.serialize())
  })

  console.log('after subs')

  client.get('blurf', {}).once('james').then(() => {
    console.log('gold!')
  })

  // setTimeout(() => {
  //   console.log('scraper bla keys:', scraper.bla.keys())
  //   console.log('client bla keys:', client.bla.keys(), client.bla.type.val)
  //   client.set({ bla: { type: 'blurf' } }) // -- brings extra complexity (recursive update of nested fields using a type thats does not exist yet)
  //   console.log('client bla keys (after switch)', client.bla.keys(), client.bla.type.val)
  //   setTimeout(() => {
  //     console.log('???', scraper.bla.keys(), scraper.bla.type.val)
  //     console.log(client.bla.keys())
  //   }, 100)
  // }, 100)

  t.end()
})
