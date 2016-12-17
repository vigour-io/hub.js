'use strict'
const create = require('./server/create')
const close = require('./server/close')

exports.properties = {
  downstream: true,
  port: {
    type: 'observable',
    noContext: true,
    on: {
      data () {
        const hub = this.cParent()
        const val = this.compute()
        if (hub.downstream) {
          close(hub)
          hub.downstream = null
        }
        if (val) { create(hub, val) }
      }
    }
  }
}

exports.on = {
  remove: {
    port () {
      if (this.port && this.hasOwnProperty('port')) {
        this.port.set(null)
      }
    }
  }
}
