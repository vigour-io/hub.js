import hub from './hub'
const fn = (val, stamp) => hub.create(val, stamp)
export default fn

// add uids to stamps else it sucks -- dont compromise for tests think of that as an after thought
