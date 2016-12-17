'use stirct'
const vstamp = require('vigour-stamp')
const isObj = require('vigour-util/is/obj')

exports.define = {
  extend: {
    set (method, val, stamp, nocontext, isNew) {
      const hub = this.root
      const incoming = hub.incoming
      const obj = isObj(val)
      var s

      // we need to have a better way to id that its incoming

      // we need an extra argument for set to passon if it came from incoming
      if (incoming) {
        stamp = false
        s = this.stamp
      }

      if (obj) {
        if (val.stamp) {
          stamp = val.stamp
          delete val.stamp
          if (incoming && !incoming[stamp]) {
            incoming[stamp] = true
          }
        }
      }

      if (stamp && this.stamp) {
        if (Number(vstamp.val(stamp)) < Number(vstamp.val(this.stamp))) {
          if (!obj) {
            return
          } else if (val.val) {
            delete val.val
            stamp = false
          }
        }
      }

      const changed = method.call(this, val, stamp, nocontext, isNew)

      if (incoming && changed && this.stamp === s && this.val !== null) {
        if (!incoming.force) { incoming.force = {} }
        force(this, incoming.force)
      }

      return changed
    }
  }
}

function force (target, obj) {
  while (target) {
    obj[target.sid()] = target.path().join('.') || true
    if (target._emitters._data.base) {
      // make tests for this line
      target._emitters._data.base.each(p => force(p, obj))
    }
    target = target.parent
  }
}
