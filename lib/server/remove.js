export const removeSubscriptions = (t, id) => {
  if (t.subscriptions) {
    let i = t.subscriptions.length
    while (i--) { // clean this up with unsubscribe in struct
      console.log('   -->', i)
      if (t.subscriptions[i].id == id) { //eslint-disable-line
        // console.log('  REMOVE SUBSCRIPTION', id, i)
        t.subscriptions.splice(i, 1)
      }
    }
  }
}

export const removeClient = (client) => {
  const id = client.key
  client.val = null
  const t = client.parent(2)
  console.log('REMOVE', t.contextKey, id, t.subscriptions && t.subscriptions.length, t.subscriptions && t.subscriptions.map(val => val.id))
  removeSubscriptions(t, id)
  console.log('    REMOVE ', id, t.subscriptions && t.subscriptions.length, t.subscriptions && t.subscriptions.map(val => val.id))
  client.set(null)
  // if (client.context && t.clients.keys().length === (t.url ? 1 : 0)) {
  //   t.set(null, stamp)
  // }
}
