'use strict'
// need to use a function for sync -- in the funciton will recieve true if up or somethign
// addhere to play state content api -- add down / up

// this will be default behaviour for child: 'Constructor'
// if its allready the case and its own dont change it

exports.properties = {
  syncUpIsFn: true,
  syncDownIsFn: true,
  syncUp (val) {
    if (!this.hasOwnProperty('child')) {
      this.set({ child: { child: 'Constructor' } }, false)
    }
    if (typeof val === 'function') {
      this.child.prototype.syncUpIsFn = this.syncUpIsFn = true
      val = resolveState(val, this)
    } else {
      this.child.prototype.syncUpIsFn = this.syncUpIsFn = false
    }
    this.child.prototype.syncUp = this.syncUp = val
  },
  syncDown (val) {
    if (!this.hasOwnProperty('child')) {
      this.set({ child: { child: 'Constructor' } }, false)
    }
    if (typeof val === 'function') {
      this.child.prototype.syncDownIsFn = this.syncDownIsFn = true
      val = resolveState(val, this)
    } else {
      this.child.prototype.syncDownIsFn = this.syncDownIsFn = false
    }
    this.child.prototype.syncDown = this.syncDown = val
  },
  sync (val) {
    return this.set({
      syncUp: val,
      syncDown: val
    }, false)
  }
}

function resolveState (val, spawned) {
  return (state) => {
    if (state && state.key !== spawned.key) {
      let found
      while (state && !found) {
        if (
          state.sid() === spawned.sid() ||
          (spawned._Constructor && state instanceof spawned._Constructor)
        ) {
          found = true
        } else {
          state = state.parent
        }
      }
    }
    return val(state)
  }
}

exports.syncUp = true
exports.syncDown = true
