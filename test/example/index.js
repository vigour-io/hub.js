import h from 'hub.js'

const hub = h()
const addFavorite = `<svg viewBox='0 0 25 24'><path d='M25.335 9.667c0-1.179-0.96-2.13-2.14-2.13h-7.227l1 0.723-2.238-6.776c-0.269-0.869-1.095-1.484-2.040-1.484s-1.771 0.615-2.045 1.503l-2.232 6.757 1-0.723h-7.227c-1.18 0-2.14 0.952-2.14 2.13 0 0.693 0.336 1.331 0.889 1.728l5.839 4.185-0.387-1.187-2.249 6.809c-0.071 0.212-0.108 0.438-0.108 0.667 0 1.179 0.96 2.13 2.14 2.13 0.454 0 0.888-0.142 1.249-0.401l-0.613-0.857v1.054h0c0.22 0 0.435-0.069 0.614-0.197l5.882-4.216-1.228 0 5.883 4.216c0.179 0.128 0.394 0.197 0.614 0.197h0v-1.054l-0.615 0.855c0.362 0.26 0.797 0.403 1.252 0.403 1.18 0 2.14-0.952 2.14-2.13 0-0.229-0.037-0.454-0.108-0.668l-2.248-6.808-0.387 1.187 5.838-4.185c0.553-0.398 0.889-1.036 0.889-1.728v0zM23.228 9.667c0 0.006-0.003 0.011-0.011 0.017l-5.837 4.184c-0.375 0.268-0.531 0.749-0.387 1.187l2.249 6.809c0.001 0.003 0.001 0.004 0.001 0.006 0 0.011-0.013 0.023-0.033 0.023-0.009 0-0.015-0.002-0.021-0.006-0.179-0.129-0.395-0.198-0.615-0.198h-0v1.054l0.614-0.856-5.883-4.216c-0.367-0.263-0.861-0.263-1.228 0l-5.882 4.216 0.614 0.856v-1.054h-0c-0.22 0-0.434 0.069-0.613 0.196-0.008 0.006-0.015 0.008-0.024 0.008-0.020 0-0.033-0.012-0.033-0.023 0-0.002 0-0.002 0-0.003l2.25-6.812c0.145-0.438-0.012-0.918-0.387-1.187l-5.838-4.185c-0.008-0.005-0.010-0.010-0.010-0.016 0-0.011 0.013-0.023 0.033-0.023h7.227c0.455 0 0.858-0.292 1.001-0.723l2.238-6.776c0.009-0.028 0.021-0.038 0.038-0.038s0.030 0.009 0.033 0.019l2.244 6.794c0.143 0.432 0.546 0.723 1.001 0.723h7.227c0.020 0 0.033 0.012 0.033 0.023v0z'></path></svg>`

const isFavorite = `<svg viewBox='0 0 25 24'><path d='M23.534 10.499v0l-6.044 4.3 2.328 6.997c0.037 0.109 0.057 0.225 0.057 0.346 0 0.611-0.504 1.107-1.125 1.107-0.246 0-0.474-0.079-0.659-0.21v0l-6.091-4.334-6.091 4.333c-0.185 0.132-0.412 0.21-0.659 0.21-0.621 0-1.125-0.495-1.125-1.107 0-0.121 0.020-0.237 0.056-0.346l2.328-6.997-6.044-4.301c-0.282-0.201-0.466-0.528-0.466-0.897 0-0.611 0.504-1.107 1.125-1.107h7.482l2.317-6.964c0.141-0.452 0.569-0.782 1.076-0.782s0.934 0.329 1.076 0.782l2.317 6.964h7.482c0.621 0 1.125 0.496 1.125 1.107 0 0.369-0.184 0.696-0.466 0.897z'></path></svg>`

hub.subscribe({
  photos: {
    $any: {
      val: true,
      $keys: {
        val (keys, photos) {
          const client = photos.root().client
          const scrollTop = client.get('scrollTop', 0).compute()
          const innerHeight = client.get('innerHeight', 0).compute()
          const innerWidth = client.get('innerWidth', 0).compute()
          const treshold = innerWidth < 600
            ? innerWidth
            : innerWidth < 900
              ? innerWidth / 4
              : innerWidth / 9

          const minAmount = Math.ceil(innerHeight / treshold)
          const scrolledAmount = Math.ceil(scrollTop / treshold)
          return keys.slice(0, minAmount + scrolledAmount + 2)
        },
        root: {
          client: {
            scrollTop: true,
            innerHeight: true,
            innerWidth: true
          }
        }
      }
    }
  }
}, (data, type, subs, tree) => {
  if (data.parent().key === 'photos') {
    if (type === 'new') {
      const div = document.createElement('div')
      const img = document.createElement('img')
      const title = document.createElement('h1')
      const subtitle = document.createElement('input')
      const favorite = document.createElement('span')

      img.src = data.src.compute()
      title.innerHTML = data.get('title', '').compute()
      subtitle.value = data.get('subtitle', '').compute()
      favorite.innerHTML = data.get('favorite', false).compute()
        ? isFavorite
        : addFavorite

      subtitle.addEventListener('input', () => data.set({
        subtitle: subtitle.value
      }))

      div.addEventListener('click', () => data.set({
        favorite: !data.get('favorite', false).compute()
      }))

      div.appendChild(img)
      div.appendChild(title)
      div.appendChild(favorite)
      div.appendChild(subtitle)

      document.body.appendChild(div)

      tree.node = div
    } else if (type === 'update') {
      const [ img, title, favorite, subtitle ] = tree.node.children

      img.src = data.src.compute()
      img.src = data.src.compute()
      title.innerHTML = data.title.compute()
      subtitle.value = data.subtitle.compute()
      favorite.innerHTML = data.get('favorite', false).compute()
        ? isFavorite
        : addFavorite
    } else if (type === 'remove') {
      tree.node.parentNode.removeChild(tree.node)
      delete tree.node
    }
  }
})

hub.connect('ws://localhost:8080')

window.addEventListener('scroll', () => hub.client.set({
  scrollTop: document.body.scrollTop
}))

window.addEventListener('resize', () => hub.client.set({
  innerWidth: window.innerWidth,
  innerHeight: window.innerHeight
}))

hub.client.set({
  innerWidth: window.innerWidth,
  innerHeight: window.innerHeight
})
