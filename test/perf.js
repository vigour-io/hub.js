const h = require('../')
const { create } = require('brisky-struct')
const pid = h.pid

const a = create()
const a2 = a.create()
let j = 100
while (j--) {
  a.set({ a: { b: { c: { [j]: j } } } })
}

j = 100
while (j--) {
  a2.get([ 'a', 'b', 'c', j ])
}

var d = Date.now()
let i = 1e7

while (i--) {
  pid(a.a.b.c[(i / 100000) | 0])
}

console.log(Date.now() - d, 'ms')
