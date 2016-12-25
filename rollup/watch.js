const config = require('./config')
const watch = require('rollup-watch')
const rollup = require('rollup')

config.forEach(opts => {
  watch(rollup, opts).on('event', event => {
    console.log(event)
  })
})
