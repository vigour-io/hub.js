import ua from 'vigour-ua'

export default (t, id, val, stamp, useragent) => {
  useragent = ua(useragent)
  val.device = useragent.device
  val.platform = useragent.platform
  val.browser = useragent.browser
  val.debug = val.context || 'no-context'
  t.set({ clients: { [id]: val } }, stamp)
  return t.clients[id]
}
