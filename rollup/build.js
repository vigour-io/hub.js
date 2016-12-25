const config = require('./config')
const rollup = require('rollup')

config.forEach(opts => {
  rollup.rollup(opts).then(bundle => {
    opts.targets.forEach(target => {
      bundle.write(target)
    })
  }).catch(err => console.log(err))
})
