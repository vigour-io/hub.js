const isEmpty = t => {
  for (let i in t) { return false }
  return true
}

const parse = (struct, obj, key, root) => {
  const result = {}
  if (!root) { root = result }
  if (obj.type) result.type = parse(struct, obj.type, 'type')
  for (let i in obj) {
    if (i !== '_' && i !== 'type') {
      if (typeof obj[i] === 'function') {
        let val = obj[i].toString()
        if (!/^(function|\()/.test(val)) {
          // this can all be done on the hub itself of course
          // hash will also be used for sec purposes
          // this will just be send up and done on the hub -- not here!

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
        result[i] = obj[i]
      } else {
        let parsed = parse(struct, obj[i], i, root)
        if (parsed !== void 0) { result[i] = parsed }
      }
    }
  }
  // if result is empty ignore -- may not be a good idea
  return isEmpty(result) ? void 0 : result
}

export default parse
