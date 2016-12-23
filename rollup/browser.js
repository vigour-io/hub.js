import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
// import buble from 'rollup-plugin-buble'

export default {
  entry: 'lib/index.js',
  plugins: [
    resolve({
      jsnext: true,
      main: true,
      browser: true
    }),
    commonjs()
  ],
  external: [
    'tape',
    'brisky-stamp',
    'string-hash',
    'uws',
    'vigour-ua',
    'brisky-struct'
  ],
  targets: [
    {
      dest: 'dist/index.browser.js',
      format: 'es'
    }
  ]
}
