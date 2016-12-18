// import bs from 'brisky-stamp'
import { sendMeta } from './send'

// make this into a function dont use method
const get = (t, val) => { // expose it
  console.log('get dat context!', val)
  // val can be an object as well!
  // add security etc as well
  // else make it? -- thats nice and efficient
  // const instances = this.instances
  // if (instances) {
  //   for (let i = 0, len = instances.length; i < len; i++) {
  //     if (instances[i].context.compute() === context) {
  //       return instances[i]
  //     }
  //   }
  // }
}

const context = {
  props: {
    context: (hub, val) => {
      if (val !== hub.clientContext) {
        hub.clientContext = val
        if (hub.connected && hub.connected.compute() === true) {
          console.log('ai need to re-send some stuff')
          console.log('this will tigh in to sendMeta')
          sendMeta(hub)
        }
      }
    }
  }
}

export { get, context }

// exports.properties = {
//   context: {
//     val: false,
//     sync: false,
//     on: {
//       data: {
//         context (val, stamp) {
//           if (this.val !== null) {
//             const hub = this.root
//             if (hub.client && hub.client.val) {
//               if (stamp) {
//                 vstamp.done(stamp, () => removeClients(hub))
//               } else {
//                 removeClients(hub)
//               }
//               hub.client.origin().sendMeta()
//             }
//           }
//         }
//       }
//     }
//   }
// }

// function removeClients (hub) {
//   const contextStamp = vstamp.create('context')
//   hub.clients.each((client, key) => {
//     if (key != hub.id) { //eslint-disable-line
//       client.remove(contextStamp) // do we use the stamp name
//     }
//   })
//   vstamp.close(contextStamp)
// }
