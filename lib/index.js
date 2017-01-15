import hub from './hub'
import bs from 'brisky-stamp'
// import bs from 'brisky-stamp'

export default (val, stamp) => {
  if (stamp === void 0) {
    const r = hub.create(val, bs.create())
    bs.close()
    return r
  } else {
    return hub.create(val, stamp)
  }
}

// add uids to stamps else it sucks -- dont compromise for tests think of that as an after thought
