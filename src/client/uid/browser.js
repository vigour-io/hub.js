import hash from 'string-hash'
const uniq = global.navigator.userAgent +
  global.navigator.userLanguage +
  global.navigator.language
export default () => hash(`b-${Date.now()}-${(Math.random() * 10000) | 0}-${uniq}`)
