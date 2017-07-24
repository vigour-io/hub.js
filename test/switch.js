const hub = require('../')
const test = require('tape')

test('switch - basic', { timeout: 1e3 }, t => {
  console.log('wtf!')
  t.plan(1)

  const server = hub({
    _uid_: 'server',
    port: 6061,
    items: {
      bla: {
        vvvvv: 'bla!'
      },
      blax: 'hello'
    },
    itemsA: {
      a: {
        title: { val: [ '@', 'root', 'items', 'bla' ], GGGGG: 'xxx' },
        hello: [ '@', 'root', 'items', 'blax' ]
      }
    }
  })

  const client = hub({
    url: 'ws://localhost:6061',
    _uid_: 'client',
    context: 'hello',
    ref: [ '@', 'root', 'itemsA' ]
  })

  var first = false

  client.subscribe({
    ref: {
      $switch: t => {
        return t.origin().key === 'itemsA' ? { a: { val: true } }
        : { b: { val: true } }
      }
    }
  }, (s) => {
    console.log('gurrrr ---- 👙', s.path(), JSON.stringify(client.serialize(), false, 2))
    if (!first) {
      first = true
      setImmediate(() => {
        console.log('were setting something comeon! 👢👢👢👢👢')
        client.set({
          items: {
            bla: {
              vvvvv: '!!!!!'
            }
          }
        })

        setTimeout(() => {
          console.log('GO AND SWITCH CONTEXT GO GO GO')
          client.set({
            context: 'blabla'
          })
        }, 100)

      })
    }
  })

  client.connected.once(true).then(() => {
    console.log('👖')
  })
})

// test('switch', { timeout: 1e3 }, t => {
//   t.plan(11)

//   const server = hub({
//     _uid_: 'server',
//     port: 6061,
//     pageA: {
//       itemsA: {
//         itemA1: {
//           val: ['@', 'root', 'items', 'item1'],
//           rField: 'rVal'
//         },
//         itemA2: ['@', 'root', 'items', 'item2']
//       }
//     },
//     pageB: {
//       itemsB: {
//         itemB1: ['@', 'root', 'items', 'item3']
//       }
//     },
//     items: {
//       item1: {
//         field1: 'val1'
//       },
//       item2: {
//         field2: 'val2'
//       },
//       item3: {
//         field3: 'val3'
//       }
//     }
//   })

//   const client = hub({
//     url: 'ws://localhost:6061',
//     _uid_: 'client',
//     context: 'first',
//     ref: ['@', 'parent', 'pageA']
//   })

//   client.subscribe({
//     ref: {
//       $switch: t => {
//         return t.origin().key === 'pageA' ? { itemsA: { val: true } }
//         : { itemsB: { val: true } }
//       }
//     }
//   }, (val, type) => {
//     console.log('dirty dirt boy', val, type)
//     if ((type === 'new' || type === 'update') && val.key === 'itemsA') {
//       if (val.get(['itemA1', 'focus'])) {
//         t.same(val.serialize(), {
//           itemA1: {
//             val: ['@', 'root', 'items', 'item1'],
//             rField: 'rVal',
//             focus: true
//           },
//           itemA2: ['@', 'root', 'items', 'item2']
//         }, 'itemsA fired correctly with focus')
//       } else {
//         t.same(val.serialize(), {
//           itemA1: { rField: 'rVal', val: ['@', 'root', 'items', 'item1'] },
//           itemA2: ['@', 'root', 'items', 'item2']
//         }, 'itemsA fired correctly without focus')
//       }
//     } else if (type === 'new' && val.key === 'itemsB') {
//       t.same(
//         val.serialize(), { itemB1: ['@', 'root', 'items', 'item3'] },
//         'itemsB fired correctly'
//       )
//     }
//   })

//   client.get(['items', 'item1', 'field1'], {}).once('val1')
//     .then(() => {
//       t.equals(
//         client.get(['ref', 'itemsA', 'itemA1', 'rField', 'compute']), 'rVal',
//         'itemA1 got rField'
//       )
//       t.equals(
//         client.get(['ref', 'itemsA', 'itemA1', 'field1', 'compute']), 'val1',
//         'itemA1 got field1'
//       )
//       t.equals(
//         client.get(['ref', 'itemsA', 'itemA2', 'field2', 'compute']), 'val2',
//         'itemA2 got field2'
//       )

//       client.set({
//         pageA: {
//           itemsA: {
//             itemA1: {
//               focus: {
//                 val: true
//               }
//             }
//           }
//         }
//       })

//       client.set({ context: 'second' })

//       setTimeout(() => {
//         client.set({ ref: [ '@', 'parent', 'pageB' ] })
//       }, 50)

//       return client.get(['items', 'item3', 'field3'], {}).once('val3')
//     })
//     .then(() => {
//       t.equals(
//         client.get(['ref', 'itemsB', 'itemB1', 'field3', 'compute']), 'val3',
//         'itemB1 got field3'
//       )

//       client.set({ ref: [ '@', 'parent', 'pageA' ] })

//       return client.get(['pageA', 'itemsA', 'itemA1', 'field1']).once('val1')
//     })
//     .then(() => {
//       t.equals(
//         client.get(['ref', 'itemsA', 'itemA1', 'rField', 'compute']), 'rVal',
//         'itemA1 got rField'
//       )
//       t.equals(
//         client.get(['ref', 'itemsA', 'itemA1', 'field1', 'compute']), 'val1',
//         'itemA1 got field1'
//       )
//       t.equals(
//         client.get(['ref', 'itemsA', 'itemA2', 'field2', 'compute']), 'val2',
//         'itemA2 got field2'
//       )

//       server.set(null)
//       client.set(null)
//     })
// })
