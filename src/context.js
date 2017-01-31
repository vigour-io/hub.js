export default {
  props: {
    contextKey: true,
    getContext: (t, fn) => {
      t.set({
        define: {
          getContext (key) {
            const result = find(this, key)
            return fn(key, () => createContext(this, key, result), !result, this)
          }
        }
      })
    }
  },
  getContext: (key, context) => context()
}

const createContext = (hub, val, result) => {
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
