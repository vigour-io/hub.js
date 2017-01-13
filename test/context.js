const hub = require('../')
// const test = require('tape')

const test = (label, fn) => {
  var cnt = 0
  var x = {
    pass: (val) => console.log(val),
    end: () => {
      cnt++
      console.log('\n\n\n\n-----------------------------\ncompleted cycle --- next!', cnt)
      fn(x)
    }
  }
  fn(x)
}

test('context', t => {
  const scraper = hub({
    id: 'scraper',
    port: 6060,
    somefield: 'somefield!'
  })

  const hybrid = hub({
    id: 'hybrid',
    url: 'ws://localhost:6060',
    port: 6061
  })

  hybrid.subscribe(true)

  const client1 = hub({
    id: 'client1',
    context: 'pavel',
    url: 'ws://localhost:6061'
  })

  const client2 = hub({
    id: 'client2',
    context: 'pavel',
    url: 'ws://localhost:6061'
  })

  const client3 = hub({
    id: 'client3',
    url: 'ws://localhost:6061'
  })

  const client4 = hub({
    id: 'client4',
    url: 'ws://localhost:6060'
  })

  client1.subscribe(true)
  client2.subscribe(true)
  client3.subscribe(true)

  Promise.all([
    client2.get('blurf', {}).once('hello'),
    client2.get('somefield', {}).once('somefield!'),
    client1.get('somefield', {}).once('somefield!')
  ]).then(() => {
    t.pass('client2 recieves correct value')
    t.pass('client2 receives server-1 somefield!')
    client3.set({ somefield: 'hahaha' })
  })

  Promise.all([
    client1.get('somefield', {}).once('hahaha'),
    client2.get('somefield', {}).once('hahaha')
  ]).then(() => {
    t.pass('client1 & client2 receive context updates')
    // console.log(hybrid.getContext('pavel').keys())
    console.log('\n\n\n🐼  🐤  🐼')
    client4.set({ smurf: true })
  })

  // client1.get('smurf', {}).once(true).then(() => console.log(1))
  // client2.get('smurf', {}).once(true).then(() => console.log(2))
  // client3.get('smurf', {}).once(true).then(() => console.log(3))
  // hybrid.get('smurf', {}).once(true).then(() => console.log('hybrid'))
  // scraper.get('smurf', {}).once(true).then(() => console.log('scraper'))

  Promise.all([
    client1.get('smurf', {}).once(true),
    client2.get('smurf', {}).once(true),
    client3.get('smurf', {}).once(true)
  ]).then(() => {
    t.pass('client1 & client2 & client3 receive updates')
    client3.get('blurf', {}).once('hello').then(() => {
      t.pass('client3 receives updates after switching context')
      client1.set({ context: false })
      hybrid.getContext('pavel').clients.once(t => {
        console.log('??????', t.keys())
        return t.keys().length === 2
      })
      .then(() => {
        t.pass('removed client from hybrid')
        client1.set(null)
        client2.set(null)
        client3.set(null)
        client4.set(null)
        hybrid.getContext('pavel').on(val => {
          if (val === null) {
            t.pass('removed context when there are no clients')
            hybrid.set(null)
            scraper.set(null)
            t.end()
          }
        })
      })
    })
    client3.set({ context: 'pavel' })
  })

  client1.set({ blurf: 'hello' })
})
