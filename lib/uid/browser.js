import hash from 'quick-hash' // uses murmur for collision avoidance
const uniq = global.navigator.userAgent +
  global.navigator.userLanguage +
  global.navigator.language
export default hash(`b-${Date.now()}-${(Math.random() * 10000) | 0}-${uniq}`)
