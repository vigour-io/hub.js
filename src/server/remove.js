const removeSubscriptions = (t, id) => {
  if (t.subscriptions) {
    let i = t.subscriptions.length
    while (i--) { // clean this up with unsubscribe in struct
      if (t.subscriptions[i]._uid_ == id) { //eslint-disable-line
        t.subscriptions.splice(i, 1)
      }
    }
  }
}

const removeClient = client => {
  const id = client.key
  client.val = null
  if (client.socket) {
    client.socket.client = null
    client.socket = null
  }
  const t = client.parent(2)
  removeSubscriptions(t, id)
  client.set(null)
}

export { removeSubscriptions, removeClient }
