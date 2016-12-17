'use strict'
const vstamp = require('vigour-stamp')
const serialize = require('../serialize')
const chunkExp = /[\s\S]{1,1048576}/g

exports.define = {
  sendMeta () {
    const hub = this.root
    const id = hub.id
    const progress = send(this, void 0, id)
    const client = progress.$client || (progress.$client = { id })
    if (hub.subscriptions) {
      client.subscriptions = hub.subscriptions
    }
    client.context = hub.context ? hub.context.compute() : false
    send(this, void 0, id)
  },
  send (state, type, stamp, subs, force) {
    // should not need subs.val
    if (this.val !== null) {
      // if (this.val === null) {
      //   throw new Error('CLIENT IS REMOVED! and trying to send hub.id: ' + this.root.id + ' context: ' + this.root.context)
      // }
      if (state.stamp && vstamp.type(state.stamp) !== 'context') {
        const id = this.id.compute()
        serialize(send(this, stamp, id), state, type, stamp, subs, this)
      }
    }
  }
}

function send (client, stamp, id) {
  const hub = client.root
  if (!hub.inprogress[hub.id]) {
    hub.inprogress[hub.id] = {}
  }
  const inprogress = hub.inprogress[hub.id]
  if (!inprogress[id]) {
    inprogress[id] = {}
    const rdy = () => {
      const hub = client.root
      inprogress[id].stamp = hub.stamp // remove client stamp
      // need ot do for ofc when it your own

      if (client.val === null) {
        delete inprogress[id]
        return
      }
      if (client.val !== null) {
        if (
          hub.id != client.id.compute() || // eslint-disable-line
          hub.connected && hub.connected.compute() === true
        ) {
          socketSend(client, inprogress, id)
          delete inprogress[id]
        } else {
          inprogress.offset = vstamp.offset
          hub.connected.is(true, () => {
            const offsetDiff = vstamp.offset - inprogress.offset
            if (offsetDiff && Math.abs(offsetDiff) > 10) {
              cleanStamps(hub, inprogress[id], id, offsetDiff)
            }
            socketSend(client, inprogress, id)
            delete inprogress[id]
          })
        }
      } else {
        delete inprogress[id]
      }
    }
    // if (!stamp) {
    process.nextTick(rdy)
    // } else {
    //   vstamp.done(stamp, rdy)
    // }
  }
  return inprogress[id]
}

function socketSend (client, inprogress, id) {
  if (client.val !== null) {
    if (inprogress[id]._force) { delete inprogress[id]._force }
    const payload = { state: inprogress[id] }
    // temp measure really not enough -- add shit loads of test cases
    if (client.socket.context && client.socket.context.context) {
      payload.context = client.socket.context.context.compute()
    }
    if (inprogress[id].$client) {
      payload.client = inprogress[id].$client
      delete inprogress[id].$client
    }
    let pass
    if (payload.state) {
      for (var i in payload.state) {
        if (i !== 'stamp') {
          pass = true
        }
      }
    }

    if (!pass) {
      delete payload.state
    }
    const string = JSON.stringify(payload)
    const parts = string.match(chunkExp)
    parts && parts.forEach(p => client.socket.send(p))
  }
}

function cleanStamps (state, inprogress, source, diff) {
  const oldStamp = inprogress.stamp
  if (oldStamp) {
    const parsed = vstamp.parse(oldStamp)
    if (parsed.src === source) {
      const stateStamp = state.stamp
      if (stateStamp === oldStamp) {
        const newStamp = vstamp.create(parsed.type, source, Number(parsed.val) + diff)
        inprogress.stamp = newStamp
        state.stamp = newStamp
      } else {
        const p = vstamp.parse(stateStamp)
        state.stamp = vstamp.create(p.type, p.source, Number(p.val) + diff)
        delete inprogress.stamp
      }
    }
  }
  for (let key in inprogress) {
    if (key[0] !== '$') { // TODO: clean this?
      let nestedInprogress = inprogress[key]
      if (nestedInprogress && typeof nestedInprogress === 'object') {
        cleanStamps(state[key], nestedInprogress, source, diff)
      }
    }
  }
}
