import ua from 'vigour-ua'
import uid from './uid'

export default (t, val, stamp, useragent, id) => {
  if (!id) id = t._uid_ || uid()
  ua(useragent, val)
  val.ua = useragent || false
  t.set({ clients: { [id]: val } }, stamp)
  return t.clients[id]
}
