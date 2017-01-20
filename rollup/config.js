const resolve = require('rollup-plugin-node-resolve')
const pkg = require('../package.json')
const deps = pkg.dependencies

module.exports = [{
  entry: 'src/index.js',
  plugins: [ resolve() ],
  external: id => deps[id.split('/')[0]],
  targets: [
    { format: 'cjs', dest: 'dist/index.js', sourceMap: true },
    { format: 'es', dest: 'dist/index.es.js', sourceMap: true }
  ]
}, {
  entry: 'src/index.js',
  plugins: [ resolve({ browser: true }) ],
  external: id => deps[id.split('/')[0]],
  targets: [
    { format: 'cjs', dest: 'dist/browser.js', sourceMap: true },
    { format: 'es', dest: 'dist/browser.es.js', sourceMap: true }
  ]
}]
