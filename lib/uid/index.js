import hash from 'quick-hash' // uses murmur for collision avoidance
const pid = process.pid
export default hash(`b-${Date.now()}-${(Math.random() * 10000) | 0}-${pid}`)
