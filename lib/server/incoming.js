export default (hub, socket, data) => {
  const payload = data[0]
  const meta = data[1]
  var client = socket.client
  var t

  if (meta) {
    console.log(' \n meta time')
    if (client) {
      console.log('perhaps replace something (e.g. subs or whatever')
    } else {
      t = create(hub, socket, meta)
    }
  } else {
    t = client.parent(2)
  }

  // need to handle .stamp in the data...
  if (payload) { t.set(payload) }
}

const create = (hub, socket, meta) => {
  console.log('create client')
  const id = meta.id
  var t
  if (meta.context) {
    console.log('got context!')
  } else {
    t = hub
  }
  t.set({ clients: { [id]: { id: id, socket } } }, false)
  socket.client = t.clients[id]
  return t
}
