export default {
  props: {
    contextKey: true,
    getContext: (t, fn) => {
      t.set({
        define: {
          getContext (key) {
            return fn(this, key, getContext)
          }
        }
      })
    }
  },
  getContext: (hub, key, context) => context(hub, key)
}

const getContext = (hub, val) => {
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
