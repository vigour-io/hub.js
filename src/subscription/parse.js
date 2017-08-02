import merge from '../merge'

const isFn = /^\$fn\|/
const dummy = () => false

// this will all be done with an ast later!
const clientCheck = /(\.|\[\s*?['"])client[^a-z0-9]/
// const replace
// can also check for dangeorus stuff and maybe even allow some requires
// needs hashing algo

const clientContext = (val, client) => {
  const arrMatches = val.match(/\[\s*?['"]client['"].*?\]/g)
  if (arrMatches) {
    for (let i = 0, len = arrMatches.length; i < len; i++) {
      val = val.replace(/['"]client['"]/, '"clients", "' + client.key + '"')
    }
  }
  const matches = val.match(/\.client[^a-z0-9]/g)
  if (matches) {
    for (let i = 0, len = matches.length; i < len; i++) {
      val = val.replace(matches[i].slice(0, -1), '.clients["' + client.key + '"]')
    }
  }
  return val
}

const parse = (obj, state, key, client) => {
  const result = {}
  for (let i in obj) {
    let block
    if (i === 'client' && (!key || key === 'root' || key === 'parent')) {
      block = true
      let id = client.key // wrong need to get client
      if (!result.clients) { result.clients = {} }
      if (!result.clients[id]) { result.clients[id] = {} }
      merge(result.clients[id], parse(obj.client, i, key, client))
    } else if (isFn.test(i)) {
      let val = obj[i]
      i = i.slice(4)
      // need to fix bublé / babel stuff in these fn creations -- prop need to add buble
      // runtime in a hub, and ast
      // let pass
      try {
        if (clientCheck.test(val)) { // eslint-disable-line
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
    if (!block && i !== '__force__') {
      if (i === 'clients' && result.clients) {
        merge(result[i], obj[i])
      } else if (typeof obj[i] !== 'object') {
        result[i] = obj[i]
      } else {
        result[i] = parse(obj[i], state, i, client)
      }
    }
  }

  return result
}

export default parse
