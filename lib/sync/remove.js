'use strict'
const vstamp = require('vigour-stamp')
// tomb stones are still very fragile and new
// this is for later finish it when you really have time for it

exports.properties = {
  tombstones: { type: 'base' },
  tombstone: true
}

exports.tombstone = true

exports.define = {
  extend: {
    remove (method, stamp, noContext, noParent) {
      var created
      if (stamp === void 0) {
        created = true
        stamp = vstamp.create()
      }
      if (this.tombstone && this._parent) {
        if (this.parent.val !== null) {
          this.parent.set({
            tombstones: { [this.key]: stamp }
          }, false)
        }
      }
      const r = method.call(this, stamp, noContext, noParent)
      if (created) {
        vstamp.close(stamp)
      }
      return r
    },
    contextRemove (method, key, stamp) {
      return method.call(this, key, stamp)
    },
    setKey (setKey, key, val, stamp, resolve, noContext) {
      if (!this[key]) {
        if (stamp && this.tombstones && this.tombstones[key]) {
          const p = vstamp.parse(stamp)
          // do some offset right hur
          if (Number(p.val) - 1e3 < Number(vstamp.val(this.tombstones[key]))) {
            return
          }
        }
      }
      return setKey.call(this, key, val, stamp, resolve, noContext)
    }
  }
}
