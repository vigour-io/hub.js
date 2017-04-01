export default {
  props: {
    contextKey: true,
    getContext: (t, fn) => {
      t.set({
        define: {
          getContext (key, socket) {
            console.log('get it....', key)
            return fn(key, key => createContext(this, key), this, socket)
          }
        }
      })
    }
  },
  getContext: (key, context) => context(key)
}

const createContext = (hub, val, fuck) => {
  var result = find(hub, val)
  if (!result) {
    result = hub.create({ contextKey: val }, false)
  }
  return result
}

const find = (hub, val) => {
  const instances = hub.instances
  if (instances) {
    let i = instances.length
    while (i--) {
      if (instances[i].contextKey === val) return instances[i]
    }
  }
}
