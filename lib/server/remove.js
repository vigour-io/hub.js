export const removeSubscriptions = (t, id) => {
  if (t.subscriptions) {
    let i = t.subscriptions.length
    while (i--) { // clean this up with unsubscribe in struct
      if (t.subscriptions[i].id == id) t.subscriptions.splice(i, 1) //eslint-disable-line
    }
  }
}
