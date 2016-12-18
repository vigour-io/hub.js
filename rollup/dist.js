import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default {
  entry: 'lib/index.js',
  plugins: [
    resolve({
      main: true,
      jsnext: true
    }),
    commonjs()
  ],
  external: [
    'tape',
    'brisky-stamp',
    'monotonic-timestamp',
    'quick-hash',
    'uws'
  ],
  sourceMap: true,
  targets: [
    { dest: 'dist/index.js', format: 'cjs' },
    { dest: 'dist/index.es.js', format: 'es' }
  ]
}
