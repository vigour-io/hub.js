'use strict'
const WebSocketServer = require('uws').Server
const vstamp = require('vigour-stamp')
const offset = require('../../../offset/server') // better name
const client = require('../../../client/downstream')

module.exports = function createServer (hub, port) {
  const server = hub.downstream = new WebSocketServer({ port })
  server.on('connection', (socket) => {
    var combinedData = ''
    socket.on('message', (data) => {
      if (data) {
        // can try catch this (later nice to let it crash)
        combinedData += data
        try {
          data = JSON.parse(combinedData)
          combinedData = ''
        } catch (e) {
          return
        }
        // remove these offset things for now
        if (data.type === 'clock') {
          offset(data, socket)
          return
        }
        // ------------------------
        if (!data.client && !socket.client) {
          hub.emit('error', new Error('no data.client and no socket.client'))
        } else {
          if (data.client) { client(hub, data, socket) }
          const context = socket.context
          context.receive(data)
        }
      } else {
        hub.emit('error', new Error('no payload from incoming message'))
      }
    })
    // also on context switch
    socket.on('close', () => {
      if (socket.client) {
        const stamp = vstamp.create('disconnect')
        socket.client.remove(stamp)
        vstamp.close(stamp)
      }
    })
  })

  return server
}
