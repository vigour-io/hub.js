import hash from 'string-hash'
const uniq = process.pid
export default hash(`b-${Date.now()}-${(Math.random() * 10000) | 0}-${uniq}`)
