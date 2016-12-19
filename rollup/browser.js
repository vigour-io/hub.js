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
    'monotonic-timestamp',
    'quick-hash',
    'uws',
    'brisky-struct'
  ],
  targets: [
    // { dest: 'dist/test/index.js', format: 'cjs' },
    // { dest: 'dist/test/index.es.js', format: 'es' },
    {
      dest: 'dist/index.browser.js',
      format: 'es'
    }
  ]
}
