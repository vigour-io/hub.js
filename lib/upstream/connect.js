'use strict'
// call this client -- use the uws client for node when its done
// rename this to index -- just one file upstrea, its not only connect
// rename!
// clocksy really needs to be fixed / replaced...
// needs system for incoming

const WsClient = require('websocket').w3cwebsocket // client but no server
const vstamp = require('vigour-stamp')
const { ClocksyClient } = require('clocksy')
const incomingOffset = require('../offset/client').incoming
// need to find a really good way to offset from a source
module.exports = function connect (hub, url, reconnect) {
  const socket = new WsClient(url)
  const id = hub.id
  hub.set({ clients: { [id]: { id: id, socket } } }, false)
  const client = hub.clients[id]
  hub.set({ client }, false)
  client.sendMeta()
  hub.reconnect = null
  // find a good determinator for clock
  // need to find a way to correct queues
  // move this to offset as well
  // move all fofset stuff here to offset
  // remove all offset for now
  const clocksy = new ClocksyClient({
    sendRequest: (req) => socket.send(JSON.stringify({
      type: 'clock', data: req
    }))
  })
  socket.onerror = () => socket.close()

  var combinedData = ''
  socket.onmessage = (data) => {
    // const bytes = encodeURI(data.data).split(/%..|./).length - 1
    combinedData += data.data
    try {
      data = JSON.parse(combinedData)
      combinedData = ''
    } catch (e) {
      return
    }
    if (data) {
      if (data.type === 'clock') {
        incomingOffset(hub, socket, data, clocksy)
      } else {
        // var d = Date.now()
        hub.receive(data)
        // d = Date.now() - d
        // console.info(`hub ${hub.id}: recieved from upstream ${(bytes / 1024).toFixed(2)}kb processed in ${d}ms`)
      }
    }
  }
  socket.onopen = () => {
    delete socket.offset
    clocksy.start()
  }
  socket.onclose = () => {
    clocksy.stop()
    if (vstamp.offsetConnection === socket) {
      delete vstamp.offsetConnection
    }
    if (hub.connected) {
      // blocking own src is a bit weird...
      const stamp = vstamp.create('disconnect', hub.id)
      hub.set({ connected: false }, stamp)
      vstamp.close(stamp)
      if (!socket.blockReconnect) {
        reconnect = Math.min((reconnect * 1.5) | 0, 2000)
        hub.reconnect = setTimeout(connect, reconnect, hub, url, reconnect)
      }
    }
  }
  hub.upstream = socket
}

