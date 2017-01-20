import hub from './hub'
export default (val, stamp) => hub.create(val, stamp)
// add uids to stamps else it sucks -- dont compromise for tests think of that as an after thought
