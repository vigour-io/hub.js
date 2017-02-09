
 // FILE: external-brisky-struct
var $1084818551 = require('brisky-struct')
 // FILE: external-brisky-stamp
var $2379534587 = require('brisky-stamp')
 // FILE: /Users/youzi/dev/hub.js/src/client/send.js

var $4125568599_next = typeof window === 'undefined'
  ? process.nextTick
  : global.requestAnimationFrame

var $4125568599_serialize = function (hub, t, struct, val, level) {
  if (!struct.isHub || struct.key === 'clients' || (struct._p && struct._p.key === 'clients')) {
    return
  }

  var path = struct.path() // cached version (later)
  var len = path.length

  if (struct.val !== void 0 || val === null) {
    var s = t[0] || (t[0] = {})

    for (var i = level; i < len; i++) {
      var t$1 = s[path[i]]
      if (!t$1) {
        s = s[path[i]] = {}
      } else {
        s = t$1
        if (s.val === null) { return }
      }
    }

    s.stamp = struct.stamp

    if (val === null) {
      for (var key in s) {
        if (key !== 'stamp') {
          delete s[key]
        }
      }
      s.val = null
    } else if (struct.val && struct.val.inherits) {
      // make a bit more secure...
      // if (!s.val) {
      s.val = struct.val.path()
      s.val.unshift('@', 'root')
      // if allrdy serialized stop it!
      $4125568599_serialize(hub, t, struct.val, val, level)
      // }
    } else if (struct.val !== void 0) {
      s.val = struct.val
    }
  }
}

var $4125568599_meta = function (hub) {
  if (!hub.receiveOnly) {
    var store = $4125568599_inProgress(hub, $2379534587.inProgress ? $2379534587.on : $4125568599_next)
    if (!store[1]) { store[1] = {} }
    if (hub.context) {
      if (hub.context.keys().length > 0) {
        store[1].context = hub.context.compute() ? hub.context.serialize() : false
      } else {
        store[1].context = hub.context.compute() || false
      }
    }
    store[1].id = hub.client.key
    store[1].subscriptions = hub.upstreamSubscriptions
  }
}

var $4125568599_send = function (val, stamp, struct) {
  // -1 means upsteam (floats for extra speed)
  var hub
  var p = struct
  while (p) {
    if (p._url_ && !p._c) { hub = p }
    p = p.parent() // needs to walk over context (for multi server)
  }

  if (hub && !hub.receiveOnly) {
    if (struct === hub) {
      if (val === null) {
        return
      }
    } else if (struct._p.key === 'clients') {
      if (struct.key !== hub.client.key) {
        return
      }
    }
    $4125568599_serialize(hub, $4125568599_inProgress(hub, $2379534587.on), struct, val, hub.urlIndex)
  }
}

var $4125568599_inProgress = function (hub, tick) {
  if (!hub.inProgress) {
    hub.inProgress = []
    tick(function () {
      if (hub.connected.compute() === true) {
        $4125568599_out(hub)
      } else {
        hub.connected.once(true, function () { return $4125568599_out(hub); })
      }
    })
  }
  return hub.inProgress
}

var $4125568599_out = function (t) {
  t.socket.send(JSON.stringify(t.inProgress))
  t.inProgress = false
}



var $4125568599_$ALL$ = {
  meta: $4125568599_meta,
  send: $4125568599_send
}
 // FILE: external-websocket
var $4063337664 = require('websocket')
 // FILE: /Users/youzi/dev/hub.js/src/client/websocket/index.js
// import WebSocket from 'uws'
// export default WebSocket

var $2878564687 = $4063337664.w3cwebsocket

 // FILE: /Users/youzi/dev/hub.js/src/subscription/serialize.js
var $2711378567_isEmpty = function (t) {
  for (var i in t) { return false }
  return true
}

// function merge (a, b) {
//   for (let i in b) {
//     if ((!a[i] || typeof a[i] !== 'object')) {
//       a[i] = b[i]
//     } else {
//       merge(a[i], b[i])
//     }
//   }
// }

var $2711378567_parse = function (struct, obj, key, root) {
  var result = {}
  if (!root) { root = result }
  // need to be done before the rest of subs to sync correctly
  if (obj.type) { result.type = $2711378567_parse(struct, obj.type, 'type') }
  for (var i in obj) {
    if (i !== '_' && i !== 'type') {
      // @todo more resolve for parent and client
      // need more just use client (since milti hub)
      if (i === 'client') { // && (!key || key === 'root' || key === 'parent')
        // console.log('CLIENT NEED TO HANDLE MORE SPECIAL THEN JUST ROOT')
        // let id = state._uid_
        // if (!root.clients) { root.clients = {} }
        // if (!root.clients[id]) { root.clients[id] = {} }
        // merge(root.clients[id], parse(obj.client, i, root, state))
      } else if (typeof obj[i] === 'function') {
        var val = obj[i].toString()
        if (!/^(function|\()/.test(val)) {
          if (/^.+=>/.test(val)) {
            if (!/^(\(){0, 1}.+(\)){0, 1} +=>/.test(val)) {
              val = val.replace(/^(.*?)( +=>)/, '($1)$2')
            }
            if (!/^(.*?)+=> +{(.*?)}$/.test(val) && val.indexOf('return ') === -1) {
              val = val.replace(/^(.+=> *?)(.*?)/, '$1 { return $2') + ' }'
            }
            val = val.replace('=>', '')
          }
          val = 'function ' + val
        }
        result['$fn|' + i] = val
        // also here we need to rewrite client to use client id
      } else if (typeof obj[i] !== 'object') {
        // sync later!
        // if (obj._ && obj._.sync) {
        //   if (obj._.sync !== true) { result[i] = obj._.sync }
        // } else {
        result[i] = obj[i]
        // }
      } else {
        // empty objects are very uninteresetting maybe just skip them
        var parsed = $2711378567_parse(struct, obj[i], i, root)

        // if (i === 'root' || i === 'parent') {
        //   if (isEmpty(parsed)) {
        //     parsed = void 0
        //   }
        // }

        // does disable the weird bla: {} construct

        if (parsed !== void 0) { result[i] = parsed }
      }
    }
  }
  // if result is empty ignore -- may not be a good idea
  return $2711378567_isEmpty(result) ? void 0 : result
}

// can be one less fn...
var $2711378567 = $2711378567_parse

 // FILE: external-string-hash
var $3794736159 = require('string-hash')
 // FILE: external-vigour-ua
var $1807313084 = require('vigour-ua')
 // FILE: /Users/youzi/dev/hub.js/src/client/uid/index.js
var $1123050690_uniq = process.pid
var $1123050690 = function () { return $3794736159(("b-" + (Date.now()) + "-" + ((Math.random() * 10000) | 0) + "-" + $1123050690_uniq)); }

 // FILE: /Users/youzi/dev/hub.js/src/client/create.js

var $3376394415 = function (t, val, stamp, useragent, id) {
  if (!id) { id = t._uid_ || $1123050690() }
  $1807313084(useragent, val)
  t.set({ clients: ( obj = {}, obj[id] = val, obj ) }, stamp)
  var obj;
  return t.clients[id]
}

 // FILE: /Users/youzi/dev/hub.js/src/client/index.js

var $48594293_connect = function (hub, url, reconnect) {
  var socket = new $2878564687(url)
  // t, val, stamp, useragent, id
  var client = hub.client || $3376394415(hub, {}, false)

  hub.set({ client: client }, false)

  hub.reconnect = null

  var close = function () {
    var stamp = $2379534587.create()
    hub.socket = false
    hub.set({ connected: false }, stamp)
    $2379534587.close()
    if (!socket.blockReconnect && hub._url_) {
      reconnect = Math.min((reconnect * 1.5), 2000)
      hub.reconnect = setTimeout($48594293_connect, reconnect, hub, url, reconnect)
    }
  }

  socket.onclose = close

  if (typeof window === 'undefined') {
    socket.hackyOnClose = close
  }

  socket.onerror = typeof window === 'undefined'
    ? close
    : function () { return socket.close(); }

  socket.onopen = function () {
    var stamp = $2379534587.create()
    hub.socket = socket
    $4125568599_meta(hub)
    hub.set({ connected: true }, stamp)
    $2379534587.close()
  }

  socket.onmessage = function (data) {
    data = data.data
    // console.warn('INCOMING\n', JSON.parse(data))
    if (!hub.receiveOnly) {
      hub.receiveOnly = true
      hub.set(JSON.parse(data), false)
      hub.receiveOnly = null
    } else {
      hub.set(JSON.parse(data), false)
    }
    $2379534587.close()
  }
}

var $48594293_removeUrl = function (hub) {
  hub.url = hub._url_ = hub.urlIndex = null
  hub.emitters.set({ data: { url$: null } }, false)
}

var $48594293_removeSocket = function (hub) {
  if (hub.reconnect) {
    clearTimeout(hub.reconnect)
    hub.reconnect = null
  }
  if (hub.socket) {
    hub.socket.blockReconnect = true
    console.log('GO GO GOREMOVE', hub.socket._readyState)
    if (hub.connected.compute() === false || !hub.socket._readyState) {
      console.log('hacky!')
      hub.socket.hackyOnClose()
    } else {
      hub.socket.close()
    }
  }
  // hub.socket = false
}

var $48594293_url = function (hub, val, key, stamp) {
  hub.on(function (val, stamp, t) {
    if (val === null && !t._c && t === hub) {
      hub.subscriptions = []
      $48594293_removeUrl(hub)
      $48594293_removeSocket(hub)
    }
  }, 'url$')

  if (!val) { val = null }
  if ((!hub.url && val) || (hub.url.compute() !== val)) {
    $48594293_removeSocket(hub)
    if (!val) {
      hub.set({ connected: false }, stamp)
      hub._url_ = null
      if (hub.url) { hub.url.set(null, stamp) }
    } else {
      if (!hub.url) {
        $1084818551.create({
          on: {
            data: {
              url: function (val, stamp, struct) {
                val = struct.compute()
                if (val) {
                  hub.set({ connected: false }, stamp)
                  var i = -1
                  if (hub.key) { i++ }
                  hub.parent(function () { i++ })
                  hub.urlIndex = i // use this for checks
                  hub._url_ = val
                  $48594293_connect(hub, val, 50)
                } else {
                  hub._url_ = null
                }
              }
            }
          }
        }, stamp, $1084818551.struct, hub, key)
      }
      hub.url.set(val, stamp)
    }
  }
}

var $48594293_removeClients = function (hub, stamp) {
  var clients = hub.clients
  if (clients && clients.keys().length > 1) {
    clients.forEach(function (client, key) {
      if (
        client.val !== null &&
        client !== hub.client
      ) {
        client.set(null, stamp)
        delete clients[key]
      }
    })
  }
}

var $48594293_connected = {
  type: 'struct',
  on: {
    data: {
      removeClients: function (val, stamp, t) {
        if (t.compute() === false) {
          // all instances! -- fix this
          $48594293_removeClients(t._p, stamp)
        }
      }
    }
  }
}

var $48594293_contextStruct = $1084818551.struct.create({
  props: {
    default: {
      on: {
        data: {
          updateParent: function (val, stamp, t) {
            console.log('👻 GO UPDATE PARENT!!! 👻')
            t.parent().emit('data', val, stamp)
          }
        }
      }
    }
  }
})

var $48594293_contextIsNotEqual = function (val, context) {
  if (val && typeof val === 'object') {
    for (var field in val) {
      if (!context[field] || val[field] !== context[field].compute()) {
        console.log('😜', field)
        return true
      }
    }
  } else {
    console.log('😜 ?????')
    return val !== context.compute()
  }
}

var $48594293_context = function (hub, val, key, stamp) {
  if (!hub.context || $48594293_contextIsNotEqual(val, hub.context)) {
    console.log('⚽️ fire fire fire FLAME context ⚽️', val, stamp)
    if (!hub.context) {
      $1084818551.create(val, stamp, $48594293_contextStruct, hub, key)
    } else {
      $48594293_removeClients(hub, stamp)
      hub.context.set(val, stamp)
    }
    if (hub.connected && hub.connected.compute() === true) { $4125568599_meta(hub) }
  }
}

var $48594293_props = {
  reconnect: true,
  socket: true,
  urlIndex: true,
  upstreamSubscriptions: true,
  receiveOnly: true,
  url: $48594293_url,
  context: $48594293_context,
  connected: $48594293_connected
}

var $48594293_stub = function () {}

var $48594293_define = {
  subscribe: function subscribe (subs, cb, raw, tree) {
    if (!raw) { subs = $1084818551.parse(subs) }
    if (!this.receiveOnly) {
      var parsed = $2711378567(this, subs)
      if (parsed) {
        var key = $3794736159(JSON.stringify(parsed))
        if (!this.upstreamSubscriptions) {
          this.upstreamSubscriptions = {}
          this.upstreamSubscriptions[key] = parsed // for buble
          if (this.url) { $4125568599_meta(this) }
        } else if (!this.upstreamSubscriptions[key]) {
          this.upstreamSubscriptions[key] = parsed
          if (this.url) { $4125568599_meta(this) }
        }
      }
    }
    return $1084818551.subscribe(this, subs, cb || $48594293_stub, tree)
  }
}

var $48594293_on = { data: { send: $4125568599_send } }



var $48594293_$ALL$ = {
  props: $48594293_props,
  on: $48594293_on,
  define: $48594293_define
}
 // FILE: external-uws
var $354051556 = require('uws')
 // FILE: /Users/youzi/dev/hub.js/src/subscription/parse.js
var $3742651364_isFn = /^\$fn\|/
var $3742651364_dummy = function () { return false; }
// const client = (tree) => {
//   while (tree) {
//     if (tree._ && tree._.client) {
//       return tree._.client
//     }
//     tree = tree._p
//   }
// }

// const clientContext = fn => (state, subs, tree, key) => {
//   if (state) {
//     const $root = state.root
//     const inContext = $root._client
//     var prev
//     if (inContext) {
//       $root._client = client(tree)
//     } else {
//       prev = $root.client
//       $root.client = client(tree)
//     }
//     const ret = fn(state, tree, subs, key)
//     if (inContext) {
//       $root._client = inContext
//     } else {
//       $root.client = prev
//     }
//     return ret
//   } else {
//     return fn(state, tree, subs, key)
//   }
// }

var $3742651364_parse = function (obj, state, key) {
  var result = {}
  for (var i in obj) {
    if ($3742651364_isFn.test(i)) {
      var val = obj[i]
      i = i.slice(4)
      // need to fix bublé stuff in these fn creations -- prop need to add buble
      // runtime in a hub
      var pass = (void 0)
      try {
        obj[i] = new Function('return ' + val)() // eslint-disable-line
        // if (/\.client|\[['"']client['"]\]/.test(val)) { // eslint-disable-line
        //   obj[i] = clientContext(obj[i])
        // }
        pass = true
        // do dry run with your own key in a props object
        // 2 options for this ofcourse
        // obj[i](state, {}, {}, i)
        // do we want to test for null / void 0?
      } catch (e) {
        var msg = (void 0)
        // if (!pass) {
        msg = "cannot parse function " + key + ".exec\n" + val
        // } else {
        //   msg = `cannot run function ${key}.exec\n${val}`
        // }
        state.emit('error', new Error(msg))
        obj[i] = $3742651364_dummy
      }
    }
    if (typeof obj[i] !== 'object') {
      result[i] = obj[i]
    } else {
      result[i] = $3742651364_parse(obj[i], state, i)
    }
  }
  return result
}

var $3742651364 = $3742651364_parse

 // FILE: /Users/youzi/dev/hub.js/src/server/cache.js

var $3904796091_cache = function (client, struct, stamp) {
  if (!client.cache) { client.cache = {} }
  client.cache[$1084818551.puid(struct)] = stamp
}

var $3904796091_isCached = function (client, struct, stamp) { return client.cache &&
  client.cache[$1084818551.puid(struct)] === stamp; }

// const isCached = () => false



var $3904796091_$ALL$ = {
  cache: $3904796091_cache,
  isCached: $3904796091_isCached
}
 // FILE: /Users/youzi/dev/hub.js/src/server/send.js

var $1622386187_isEmpty = function (obj) {
  for (var i in obj) { //eslint-disable-line
    return false
  }
  return true
}

var $1622386187_progress = function (client) {
  if (!client.inProgress) {
    client.inProgress = {}
    $2379534587.on(function () {
      if (client.val !== null) {
        if (!$1622386187_isEmpty(client.inProgress)) {
          if (client.inProgress.types) {
            for (var i in client.inProgress) {
              // order is still important since settign types after the facts is still broken
              // this will be a big update
              if (i === 'types') {
                break
              } else {
                var tmp = client.inProgress[i]
                delete client.inProgress[i]
                client.inProgress[i] = tmp
              }
            }
          }
          client.socket.send(JSON.stringify(client.inProgress))
        }
        client.inProgress = false
      }
    })
  }
  return client.inProgress
}

var $1622386187_send = function (hub, client, struct, type, subs, tree) {
  if (struct.isHub && client.val !== null) {
    var isRemoved
    if (type === 'remove') {
      if (!struct._p[struct.key]) { isRemoved = true }
    } else if (type === 'update' && tree.$t !== struct) {
      if (tree.$t && tree.$t._p && !tree.$t._p[tree.$t.key]) {
        var previous = tree.$t
        var prop = previous
        while (previous) {
          if (previous._p && previous._p[previous.key]) {
            // think of something fast for level...
            $1622386187_serialize(client, $1622386187_progress(client), subs, prop, $1084818551.get(hub, 'serverIndex'), true)
          }
          prop = previous
          previous = previous._p
        }
      }
    }
    $1622386187_serialize(client, $1622386187_progress(client), subs, struct, $1084818551.get(hub, 'serverIndex'), isRemoved)
  }
}

var $1622386187_serialize = function (client, t, subs, struct, level, isRemoved) {
  var stamp = $1084818551.get(struct, 'stamp') || 1 // remove the need for this default (feels wrong)
  var val = isRemoved ? null : $1084818551.getVal(struct)

  if (val !== void 0 && stamp && !$3904796091_isCached(client, struct, stamp)) {
    // val === null -- double chck if this is nessecary
    var path = struct.path()
    var len = path.length
    var s = t
    for (var i = level; i < len; i++) {
      var tt = s[path[i]]
      if (!tt) {
        s = s[path[i]] = {}
      } else {
        s = tt
        if (s.val === null) { return }
      }
    }

    if (isRemoved) {
      $3904796091_cache(client, struct, stamp)
      s.stamp = stamp
      s.val = val
    } else {
      if (subs.type) {
        var type = $1084818551.get(struct, 'type') // make getType (fast)
        if ($1084818551.getVal(type) !== 'hub') {
          $1622386187_serialize(client, t, subs.type, type, level)
        }
      }

      $3904796091_cache(client, struct, stamp)
      s.stamp = stamp
      if (struct.key === 'type') {
        if (val === 'hub') { return }
        $1622386187_serialize(client, t, subs, $1084818551.getType(struct.parent(2), val), level)
      // allways need a stamp!
      }

      if (typeof val === 'object' && val.inherits) {
        s.val = val.path()
        s.val.unshift('@', 'root')
        $1622386187_serialize(client, t, subs, val, level)
      } else if (val !== void 0) {
        s.val = val
      }
    }
  } else if (val && typeof val === 'object' && val.inherits) {
    // can send a bit too much data when val: true and overlapping keys
    $1622386187_serialize(client, t, subs, val, level)
  }

  if (subs.val === true && !isRemoved) {
    $1622386187_deepSerialize($1084818551.getKeys(struct), client, t, subs, struct, level)
  }
}

var $1622386187_deepSerialize = function (keys, client, t, subs, struct, level) {
  if (struct.get('type') && struct.get('type').compute() !== 'hub') {
    $1622386187_serialize(client, t, subs, struct.get('type'), level)
  }
  if (keys) {
    for (var i = 0, len = keys.length; i < len; i++) {
      var prop = $1084818551.get(struct, keys[i])
      if (prop && prop.isHub) { $1622386187_serialize(client, t, subs, prop, level) }
    }
  }
  if (struct._removed) {
    for (var i$1 = 0, len$1 = struct._removed.length; i$1 < len$1; i$1++) {
      var prop$1 = struct._removed[i$1]
      $1622386187_serialize(client, t, subs, prop$1, level, true)
    }
  }
}

var $1622386187 = $1622386187_send

 // FILE: /Users/youzi/dev/hub.js/src/server/remove.js
var $2931540049_removeSubscriptions = function (t, id) {
  if (t.subscriptions) {
    var i = t.subscriptions.length
    while (i--) { // clean this up with unsubscribe in struct
      if (t.subscriptions[i]._uid_ == id) { //eslint-disable-line
        t.subscriptions.splice(i, 1)
      }
    }
  }
}

var $2931540049_removeClient = function (client) {
  var id = client.key
  client.val = null
  if (client.socket) {
    client.socket.client = null
    client.socket = null
  }
  var t = client.parent(2)
  $2931540049_removeSubscriptions(t, id)
  client.set(null)
  // if (client.context && t.clients.keys().length === (t.url ? 1 : 0)) {
  //   t.set(null, stamp)
  // }
}



var $2931540049_$ALL$ = {
  removeSubscriptions: $2931540049_removeSubscriptions,
  removeClient: $2931540049_removeClient
}
 // FILE: /Users/youzi/dev/hub.js/src/server/incoming.js

var $1353865041 = function (hub, socket, data) {
  var payload = data[0]
  var meta = data[1]
  var client = socket.client

  if (meta) {
    var t
    if (client) {
      t = hub
      if ('context' in meta && client.context != meta.context) { // eslint-disable-line
        $2931540049_removeClient(client)
        $1353865041_create(hub, socket, meta, payload)
      } else if (meta.subscriptions) {
        if (payload) { $1353865041_setPayload(t, payload, client) }
        $1353865041_incomingSubscriptions(t, client, meta, client.key)
        $2379534587.close()
      }
    } else {
      $1353865041_create(hub, socket, meta, payload)
    }
  } else {
    $1353865041_setPayload(client.parent(2), payload, client)
    $2379534587.close()
  }
}

var $1353865041_addToCache = function (client, hub, payload) {
  if (typeof payload === 'object' && payload) {
    for (var key in payload) {
      if (key !== 'val' && key !== 'stamp') {
        var struct = hub[key]
        if (struct && struct.isHub) {
          $1353865041_addToCache(client, hub[key], payload[key])
        }
      }
    }
    if (payload.val !== void 0 && payload.stamp) {
      $3904796091_cache(client, hub, payload.stamp)
    }
  }
}

var $1353865041_setPayload = function (hub, payload, client) {
  hub.set(payload, false)
  $1353865041_addToCache(client, hub, payload)
}

var $1353865041_set = function (meta, socket, t, payload) {
  var stamp = $2379534587.create()
  var id = meta.id
  var context = meta.context
  // const ip = socket._socket.remoteAddress
  var client = socket.client = $3376394415(
    t, { socket: socket, context: context }, stamp, socket.useragent, id
  )
  if (payload) { $1353865041_setPayload(t, payload, client) }
  if (meta.subscriptions) { $1353865041_incomingSubscriptions(t, client, meta, id) }
  $2379534587.close()
}

var $1353865041_create = function (hub, socket, meta, payload) {
  var t = meta.context ? hub.getContext(meta.context, socket) : hub
  if (!t.inherits && t.then) {
    t.then(function (t) {
      if (socket.external !== null) {
        console.log('client connected and found informations')
        $1353865041_set(meta, socket, t, payload)
      } else {
        console.log('client discconected when logging in')
      }
    }).catch(function (err) { return hub.emit('error', err); })
  } else {
    $1353865041_set(meta, socket, t, payload)
  }
}

var $1353865041_incomingSubscriptions = function (hub, client, meta, id) {
  var update = function (t, type, subs, tree) { return $1622386187(hub, client, t, type, subs, tree); }
  if (!client.upstreamSubscriptions) { client.upstreamSubscriptions = {} }
  for (var key in meta.subscriptions) {
    var uid = key + '-' + id
    if (!client.upstreamSubscriptions[uid]) {
      var subs = $3742651364(meta.subscriptions[key], hub)
      client.upstreamSubscriptions[uid] = subs
      $1084818551.subscribe(hub, subs, update)
      hub.subscriptions[hub.subscriptions.length - 1]._uid_ = id
    }
  }
}

 // FILE: /Users/youzi/dev/hub.js/src/server/on.js

var $2138030230_removedInProgress
var $2138030230_on = {
  data: {
    remove$: function (val, stamp, struct) {
      // just do a diff with the payload rly the best way for now...
      if (val === null && (!struct._c || struct._cLevel === 1)) {
        var p = struct
        var hub
        while (p) {
          if (p.port && !p._c) { hub = p }
          p = p.parent()
        }
        if (hub) {
          // probably not working correctly with context
          var target = struct.parent()
          if (target) {
            if (!target._removed) {
              target._removed = []
              if (!$2138030230_removedInProgress) {
                $2138030230_removedInProgress = []
                $2379534587.on(function () {
                  var i = $2138030230_removedInProgress.length
                  while (i--) {
                    delete $2138030230_removedInProgress[i]._removed
                  }
                })
              }
              $2138030230_removedInProgress.push(target)
            }
            target._removed.push(struct)
          }
        }
      }
    }
  }
}

var $2138030230 = $2138030230_on

 // FILE: /Users/youzi/dev/hub.js/src/server/index.js

var $3248609833_Server = $354051556.Server

var $3248609833_createServer = function (hub, port) {
  var server = new $3248609833_Server({ port: port })
  console.log(("💫 hub listening on " + port + " 💫"))

  server.on('connection', function (socket) {
    socket.useragent = socket.upgradeReq && socket.upgradeReq.headers['user-agent']
    // need to remove when done -- its the best thing todo (mem!!!)
    socket.on('message', function (data) {
      data = JSON.parse(data)
      if (data) { $1353865041(hub, socket, data) }
    })

    var close = function () {
      if (socket.client) { $2931540049_removeClient(socket.client) }
    }

    socket.on('close', close)
    // socket.on('error', () => close()) // need to do something here as well no leaks!
  })
  return server
}

var $3248609833_removeServer = function (hub) {
  var server = hub._server_
  var instances = hub.instances
  $3248609833_closeConnections(hub)
  for (var i = 0, len = instances && instances.length; i < len; i++) {
    $3248609833_closeConnections(instances[i])
  }

  server.httpServer.close()
  // remove all clients subscriptions
  hub._server_ = null
}

var $3248609833_closeConnections = function (hub) {
  var clients = hub.clients
  var id = hub._uid_ // to exclude the client (not nessecary)
  if (clients) {
    clients.forEach(function (client) {
      if (client.socket && client.key !== id) {
        client.val = null
        $2931540049_removeSubscriptions(hub, client.key)
        client.socket.close()
      }
    })
  }
}

var $3248609833_removePort = function (hub) {
  hub.port = null
  hub.serverIndex = null
  hub.emitters.set({ data: { port$: null } })
}

var $3248609833_port = function (hub, val, key, stamp) {
  // use remove
  hub.on(function (val, stamp, t) {
    if (val === null && !t._c && t === hub) {
      $3248609833_removeServer(hub)
      $3248609833_removePort(hub)
    }
  }, 'port$')
  if (!val) { val = null }
  if ((!hub.port && val) || (hub.port.compute() !== val)) {
    if (hub._server_) {
      $3248609833_removeServer(hub)
    }
    if (!val) {
      if (hub.port) { hub.port.set(null, stamp) }
      $3248609833_removePort(hub)
    } else {
      if (!hub.port) {
        $1084818551.create({
          on: {
            data: {
              port: function (val, stamp, struct) {
                val = struct.compute()
                if (val) {
                  var i = -1
                  if (hub.key) { i++ }
                  hub.parent(function () { i++ })
                  hub.serverIndex = i
                  hub._server_ = $3248609833_createServer(hub, val)
                }
              }
            }
          }
        }, stamp, $1084818551.struct, hub, key)
      }
      hub.port.set(val, stamp)
    }
  }
}

var $3248609833_props = {
  _server_: true,
  serverIndex: true,
  port: $3248609833_port
}



var $3248609833_$ALL$ = {
  props: $3248609833_props,
  on: $2138030230
}
 // FILE: /Users/youzi/dev/hub.js/src/context.js
var $25049122 = {
  props: {
    contextKey: true,
    getContext: function (t, fn) {
      t.set({
        define: {
          getContext: function getContext (key, socket) {
            var this$1 = this;

            return fn(key, function (key) { return $25049122_createContext(this$1, key); }, this, socket)
          }
        }
      })
    }
  },
  getContext: function (key, context) { return context(); }
}

var $25049122_createContext = function (hub, val) {
  var result = $25049122_find(hub, val)
  if (!result) {
    result = hub.create({ contextKey: val }, false)
  }
  return result
}

var $25049122_find = function (hub, val) {
  var instances = hub.instances
  if (instances) {
    var i = instances.length
    while (i--) {
      if (instances[i].contextKey === val) { return instances[i] }
    }
  }
}

 // FILE: /Users/youzi/dev/hub.js/src/hub.js

var $302300578_types = $1084818551.struct.props.types

var $302300578_hub = $1084818551.create({
  type: 'hub',
  instances: false,
  define: { isHub: true },
  props: {
    default: 'self',
    _uid_: function (t, val) { t.set({ define: { _uid_: val } }) },
    // why nto call this client id -- thats what it is
    clients: function (t, val, key, stamp) {
      if (!t.clients) {
        t.clients = $1084818551.create(val, stamp, $302300578_clients, t, key)
      } else {
        $1084818551.set(t.clients, val, stamp)
      }
    },
    types: $302300578_types.bind(), // to not interfere with struct type
    type: $1084818551.struct.props.type.bind(),
    client: true
  }
})

$302300578_hub.props.types.struct = $302300578_hub.create({
  props: { default: $302300578_types.struct.props.default.bind() }
}, false)

$302300578_hub.props.types.struct.props.default.struct = $302300578_hub.props.type.struct = $302300578_hub

$302300578_hub.set({ types: { hub: 'self' }, inject: [ $3248609833_$ALL$, $48594293_$ALL$, $25049122 ] }, false)

$302300578_hub.types._ks = void 0

var $302300578_clients = $1084818551.create({
  props: {
    default: $302300578_hub.create({
      props: {
        cache: true,
        upstreamSubscriptions: true,
        resolve: true,
        socket: true,
        context: true
      }
    }, false)
  }
}, false)

var $302300578 = $302300578_hub

 // FILE: /Users/youzi/dev/hub.js/src/index.js

if (typeof __filename !== 'undefined') { console.log('hub.js:', __filename) }

var $621652771_fn = function (val, stamp) { return $302300578.create(val, stamp); }
var $621652771 = $621652771_fn

// add uids to stamps else it sucks -- dont compromise for tests think of that as an after thought


module.exports = $621652771
