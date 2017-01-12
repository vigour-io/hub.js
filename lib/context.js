export const props = { contextKey: true }

export const define = {
  getContext (val) {
    var result = find(this, val)
    if (!result) {
      result = this.create({ contextKey: val }, false)
    }
    return result
  }
}

const find = (hub, val) => {
  const instances = hub.instances
  if (instances) {
    let i = instances.length
    while (i--) {
      if (instances[i].contextKey === val) {
        // console.log('found context --->', val, instances[i].clients.keys())
        return instances[i]
      }
    }
  }
}
