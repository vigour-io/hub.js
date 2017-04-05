function merge (a, b) {
  for (let i in b) {
    if ((!a[i] || typeof a[i] !== 'object')) {
      a[i] = b[i]
    } else {
      merge(a[i], b[i])
    }
  }
}

export default merge
