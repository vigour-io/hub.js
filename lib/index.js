import struct from './struct'
import { create as c, set } from './manipulate'
import methods from './methods'
import { get } from './get'
import { getProp as getProperty, property } from './property'
import { contextProperty } from './context'

const emitterProperty = struct.props.on.struct.props.default

set(struct, { inject: methods })

const create = (val, stamp) => c(struct, val, stamp)

export {
  create,
  struct,
  get,
  getProperty,
  property,
  contextProperty,
  emitterProperty
}
