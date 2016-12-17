import hash from 'quick-hash' // uses murmur for collision avoidance
const uniq = process.pid
export default hash(`b-${Date.now()}-${(Math.random() * 10000) | 0}-${uniq}`)
