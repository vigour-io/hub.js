const isFn = /^\$fn\|/
const dummy = () => false

function merge (a, b) {
  for (let i in b) {
    if ((!a[i] || typeof a[i] !== 'object')) {
      a[i] = b[i]
    } else {
      merge(a[i], b[i])
    }
  }
}

// this will all be done with an ast later!
const replaceClient = /\.client[^a-z0-9]/g
// can also check for dangeorus stuff and maybe even allow some requires
// needs hashing algo

const clientContext = (val, client) => {
  const matches = val.match(replaceClient)
  for (let i = 0, len = matches.length; i < len; i++) {
    if (/^function/.test(val)) {
      val = val.replace(matches[i].slice(0, -1), `.get(['clients', '${client.key}'])`)
    } else {
      val = val.replace(matches[i].slice(0, -1), '.clients.' + client.key)
    }
  }
  return val
}

const parse = (obj, state, key, client, root) => {
  const result = {}
  if (!root) root = result
  for (let i in obj) {
    let block
    if (i === 'client' && (!key || key === 'root' || key === 'parent')) {
      block = true
      console.log('client subs parsing work in progress, missing parent and references')
      let id = client.key // wrong need to get client
      if (!root.clients) { root.clients = {} }
      if (!root.clients[id]) { root.clients[id] = {} }
      merge(root.clients[id], parse(obj.client, i, key, client, root))
    } else if (isFn.test(i)) {
      let val = obj[i]
      i = i.slice(4)
      // need to fix bublé / babel stuff in these fn creations -- prop need to add buble
      // runtime in a hub, and ast
      // let pass
      try {
        if (replaceClient.test(val)) { // eslint-disable-line
          val = clientContext(val, client)
        }
        obj[i] = new Function('return ' + val)() // eslint-disable-line
        // pass = true
        // do dry run with your own key in a props object
        // 2 options for this ofcourse
        // obj[i](state, {}, {}, i)
        // do we want to test for null / void 0?
      } catch (e) {
        let msg
        // if (!pass) {
        msg = `cannot parse function ${key}.exec\n${val}`
        // } else {
        //   msg = `cannot run function ${key}.exec\n${val}`
        // }
        state.emit('error', new Error(msg))
        obj[i] = dummy
      }
    }
    // can go to client as well...
    if (!block && i !== '__force__') {
      if (i === 'clients' && result.clients) {
        merge(result[i], obj[i])
      } else if (typeof obj[i] !== 'object') {
        result[i] = obj[i]
      } else {
        result[i] = parse(obj[i], state, i, client, root)
      }
    }
  }
  return result
}

export default parse
