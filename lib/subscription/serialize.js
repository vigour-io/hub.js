const isEmpty = t => {
  for (let i in t) { return false }
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

const parse = (struct, obj, key, root) => {
  const result = {}
  if (!root) { root = result }
  if (obj.type) result.type = obj.type // need to be done before the rest of subs to sync correctly
  for (let i in obj) {
    if (i !== '_' && i !== 'type') {
      // @todo more resolve for parent and client
      // need more just use client (since milti hub)
      if (i === 'client') { // && (!key || key === 'root' || key === 'parent')
        // console.log('CLIENT NEED TO HANDLE MORE SPECIAL THEN JUST ROOT')
        // let id = state.id
        // if (!root.clients) { root.clients = {} }
        // if (!root.clients[id]) { root.clients[id] = {} }
        // merge(root.clients[id], parse(obj.client, i, root, state))
      } else if (typeof obj[i] === 'function') {
        let val = obj[i].toString()
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
        let parsed = parse(struct, obj[i], i, root)

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
  return isEmpty(result) ? void 0 : result
}

// can be one less fn...
export default parse
