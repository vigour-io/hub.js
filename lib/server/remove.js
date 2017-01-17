export const removeSubscriptions = (t, id) => {
  if (t.subscriptions) {
    let i = t.subscriptions.length
    while (i--) { // clean this up with unsubscribe in struct
      if (t.subscriptions[i].id == id) t.subscriptions.splice(i, 1) //eslint-disable-line
    }
  }
}

export const removeClient = (client, stamp) => {
  const id = client.key
  client.val = null
  const t = client.parent(2)
  removeSubscriptions(t, id)
  client.set(null, stamp)
  // if (client.context && t.clients.keys().length === (t.url ? 1 : 0)) {
  //   t.set(null, stamp)
  // }
}
