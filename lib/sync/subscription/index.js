'use strict'
const subscribe = require('vigour-state/subscribe')
const serialize = require('./serialize')
const parse = require('./parse')
const vstamp = require('vigour-stamp')
const dummy = () => {}
const hash = require('quick-hash')

exports.define = {
  subscribe (subs, update, tree, stamp, client, id) {
    const hub = this.root
    if (!update) { update = dummy }
    if (client && client.isClient) {
      id = client.id.compute() + id
      subs = parse(subs, hub)
      update = (state, type, subsStamp, subs, tree, sType) => {
        if (state && (type !== 'remove' || state.val === null)) {
          const stamp = state.stamp
          if (stamp) {
            const src = vstamp.src(stamp)
            if (client.key !== src) {
              client.send(state, type, subsStamp, subs)
            }
          }
        }
      }
      tree = { _: { client } }
    }

    // add re-use subscription (use same tree for same subs will handle this in state)
    // console.log(hub.stamp)
    tree = subscribe(this, subs, update, tree, stamp, client, id)
    if (!client || !client.isClient) {
      let hubSubs = hub.subscriptions
      if (!hubSubs) { hubSubs = hub.subscriptions = {} }
      const path = this.realPath(false, true)
      if (path.length > 0) {
        console.log('subs -- need to resolve path -- do a bit later -- deeper subs are currently not supported')
        // FIX THIS
      } else {
        const serialized = serialize(this, subs)
        if (!id) { id = hash(JSON.stringify(serialized)) }
        hubSubs[id] = serialized
      }
      if (hub.client) { hub.client.origin().sendMeta() }
    }
    // tree re-use over multiple clients if they have the same subs
    // totally possible just hash the incoming
    return tree
  }
}
