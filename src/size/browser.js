import maxSize from './maxSize'

// TODO: implement send

var blobArray = false

const receiveLarge = (data, cb) => {
  if (!blobArray) blobArray = []
  blobArray.push(data)

  if (data.size < maxSize) {
    let i = blobArray.length
    let stringArray = []

    while (i--) {
      const reader = new FileReader()
      console.log(i)

      const onLoadEnd = ((i, e) => {
        reader.removeEventListener('loadend', onLoadEnd, false)
        if (!e.error) {
          stringArray[i] = reader.result
          if (i === 0) cb(stringArray.join(''))
        }
      }).bind(null, i)

      reader.addEventListener('loadend', onLoadEnd, false)
      reader.readAsText(blobArray[i])
    }

    blobArray = false
  }
}

export {
  // sendLarge,
  receiveLarge
}
