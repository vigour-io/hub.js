'use strict'

module.exports = function serialize (data, state, type, stamp, subs, client) {
  const isUpstream = client === (state.root.client && state.root.client.origin())
  if (
    isUpstream ||
    (
      state.syncDown && (!state.syncDownIsFn || state.syncDown(state)) &&
      (client.cache[(state._sid || state.sid())] !== state.stamp)
    )
  ) {
    const path = state.realPath(false, true)
    const len = path.length
    var s = data
    for (let i = 0; i < len; i++) {
      let t = s[path[i]]
      if (!t) {
        s = s[path[i]] = {}
      } else {
        s = t
      }
    }
    s.stamp = state.stamp
    if (!isUpstream) {
      client.cache[state._sid] = state.stamp // clean up
    }

    if (state.val === null) {
      if (!isUpstream) {
        delete client.cache[state._sid] // clean this up
      }
      s.val = null
    } else {
      if (state.val && state.val.isBase) {
        s.val = '$root.' + state.val.realPath(false, true).join('.')
        serialize(data, state.val, type, stamp, false, client)
      } else if (state.val !== void 0) {
        s.val = state.val
      }
      if (subs && subs.val === true) {
        state.each((field, key) => {
          serialize(data, field, type, stamp, subs, client)
        })
      }
    }
  }
}
