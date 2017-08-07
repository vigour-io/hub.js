// add helper for server/client parity
export const serializeError = (t, val) => {
   // this can become very nice
  return {
    _$isError: true,
    message: val.message,
    stack: val.stack,
    type: val.type,
    from:
      val.from ||
      (t.root().client && t.root().client.key) ||
      t.root()._uid_ ||
      'server'
  }
}
