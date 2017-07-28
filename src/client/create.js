import ua from 'vigour-ua'
import uid from './uid'

export default (t, val, stamp, useragent, id) => {
  // need to see if its an heartbeat client here....
  if (!id) id = t._uid_ || uid()
  ua(useragent, val)

  // this need to be solid in terms of checks!
  // console.log(val)
  if (val.platform === 'node.js') {
    val.heartbeat = true
  }

  val.ua = useragent || false
  t.set({ clients: { [id]: val } }, stamp)
  return t.clients[id]
}
