import h from '../../'
import fetch from 'node-fetch'

const tumblrApiKey = 'wZE0T5dBvDf7Qm1mvRNUMHoKH4IPq2aJRzde1wz0WMHyW2rwLP'
const fetchTumblr = (blog, offset = 0) => fetch(
  `http://api.tumblr.com/v2/blog/${blog}.tumblr.com/posts/?api_key=${tumblrApiKey}&offset=${offset}`
  )
  .then(res => res.json())
  .then(json => json.response.posts.map(val => ({
    [val.id]: {
      src: val.photos && val.photos[0].alt_sizes[0].url,
      title: val.source_title || (val.tags && val.tags[0]) || 'wow',
      subtitle: (val.tags && val.tags.join(', ')) || 'amazing'
    }
  })).reduce((a, b) => Object.assign(a, b), {}))

const hub = h({
  photos: function * () {
    var i = 0
    while (i < 2) {
      yield fetchTumblr('forest-nation', i * 20)
      i++
    }
  }
})

hub.listen(8080)
