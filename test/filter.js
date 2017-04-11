const hub = require('../')
const test = require('tape')

test('subscription - any - multiple filter', t => {
  const movie1 = { title: 'movie1' }
  const movie2 = { title: 'movie1' }
  const show1 = { title: 'show1' }
  const show2 = { title: 'show2' }

  const s = hub({
    // key: 'server', // this is a problem for sure
    page: {
      movie1,
      movie2,
      show1,
      show2,
      shows: {
        title: 'shows',
        val: [ '@', 'root', 'page', 'shows2' ]
      },
      shows2: {
        items: [
          [ '@', 'root', 'page', 'show1' ],
          [ '@', 'root', 'page', 'show2' ]
        ]
      },
      movies: {
        title: 'movies',
        items: [
          [ '@', 'root', 'page', 'movie1' ],
          [ '@', 'root', 'page', 'movie2' ]
        ]
      },
      search: {
        shows: {
          order: 0,
          val: [ '@', 'root', 'page', 'shows' ]
        },
        movies: {
          order: 1,
          val: [ '@', 'root', 'page', 'movies' ]
        }
      }
    },
    search: { page: [ '@', 'root', 'page', 'search' ] },
    port: 6060
  })

  const client = hub({
    url: 'ws://localhost:6060',
    context: 'derp'
  })

  const path = []

  client.subscribe({
    page: {
      current: {
        val: 1,
        $any: {
          val: 1,
          title: true,
          items: {
            $any: {
              $keys: {
                root: { search: { query: true } },
                title: true,
                val: (keys, s) => keys.filter(key => {
                  const q = s.root().get([ 'search', 'query', 'compute' ])
                  if (q && (s.get([ key, 'title', 'compute' ]) || '').indexOf(q) !== -1) {
                    console.log('im begin executed!', s.root().contextKey)
                    return true
                  }
                })
              },
              val: 1,
              title: { val: 'shallow' }
            }
          }
        }
      }
    }
  }, (val, type) => {
    path.push(val.path())
    console.log('-----> LISTEN!', val.path())
  })

  client.set({
    page: {
      current: [ '@', 'root', 'search', 'page' ]
    }
  })

  setTimeout(() => {
    console.log('-----------------------------------')
    client.set({
      search: { query: 'show' }
    })
  }, 1e3)

  console.log('ok')

  // t.same(path, [
  //   [ 'search', 'query' ],
  //   [ 'page', 'shows', 'items', '0' ],
  //   [ 'page', 'shows', 'items', '1' ],
  //   [ 'search', 'query' ]
  // ])

  // t.end()
})
