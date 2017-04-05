const hub = require('../../')

const h = hub({
  url: 'ws:localhost:6060'
})

global.h = h

h.subscribe({ monkeyballs: true }, t => {
  console.log('hello', t.path())
})

console.log('🌺🌺🌺🌺🌺')
