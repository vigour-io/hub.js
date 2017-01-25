import bs from 'brisky-stamp'

var removedInProgress
const on = {
  data: {
    remove$: (val, stamp, struct) => {
      // just do a diff with the payload rly the best way for now...
      if (val === null && (!struct._c || struct._cLevel === 1)) {
        let p = struct
        let hub
        while (p) {
          if (p.port && !p._c) { hub = p }
          p = p.parent()
        }
        if (hub) {
          // probably not working correctly with context
          const target = struct.parent()
          if (target) {
            if (!target._removed) {
              target._removed = []
              if (!removedInProgress) {
                removedInProgress = []
                bs.on(() => {
                  let i = removedInProgress.length
                  while (i--) {
                    delete removedInProgress[i]._removed
                  }
                })
              }
              removedInProgress.push(target)
            }
            target._removed.push(struct)
          }
        }
      }
    }
  }
}

export default on
