const maxSize = 1e7

const send = (client, payload, next) => {
  client.socket.send(payload)
  process.nextTick(next)
}

const sendLarge = (raw, client) => {
  const size = Buffer.byteLength(raw, 'utf8')
  if (size > maxSize) {
    if (!client.blobInProgress) {
      client.blobInProgress = []
    }
    console.log('📡 exceeds framelimit - split up', (size / (1024 * 1024)) | 0, 'mb')
    const buf = Buffer.from(raw, 'utf8')
    let i = 0
    // make sure you end with an non maxsize buffer

    const drainInProgress = done => {
      if (client.blobInProgress.length > 0) {
        send(client, client.blobInProgress.shift(), drainInProgress)
      } else {
        done()
      }
    }

    const next = () => {
      i++
      if (i * maxSize <= size) {
        send(client, buf.slice(i * maxSize, (i + 1) * maxSize), next)
      } else {
        drainInProgress(() => {
          client.blobInProgress = false
        })
      }
    }

    send(client, buf.slice(i * maxSize, (i + 1) * maxSize), next)

    return true
  }
}

const receiveLarge = (data, bufferArray) => {
  // make sure new Buffer works on the browser...
  bufferArray.push(new Buffer(data).toString('utf8'))
  if (data.byteLength < maxSize) return bufferArray.join('')
}

export {
  sendLarge,
  receiveLarge
}
// byteLength -- has to be like 10mb
