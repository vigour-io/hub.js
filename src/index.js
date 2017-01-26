import hub from './hub'
import { pid } from './server/cache'
const fn = (val, stamp) => hub.create(val, stamp)
fn.pid = pid
export default fn

// add uids to stamps else it sucks -- dont compromise for tests think of that as an after thought
