const maxSize = 1e7

const sendLarge = (raw, client) => {
  const size = Buffer.byteLength(raw, 'utf8')
  if (size > maxSize) {
    client.blobInProgress = []
    console.log('📡 exceeds framelimit - split up', (size / (1024 * 1024)) | 0, 'mb')
    const buf = Buffer.from(raw, 'utf8')
    let i = 0
    // make sure you end with an non maxsize buffer
    while (i * maxSize <= size) {
      client.socket.send(buf.slice(i * maxSize, (i + 1) * maxSize))
      i++
    }
    return true
  }
}

const receiveLarge = (data, bufferArray) => {
  // make sure new Buffer works on the browser...
  bufferArray.push(new Buffer(data).toString('utf8'))
  if (data.byteLength < maxSize) return bufferArray.join('')
}

export {
  maxSize,
  sendLarge,
  receiveLarge
}
// byteLength -- has to be like 10mb
