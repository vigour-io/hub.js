import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import istanbul from 'rollup-plugin-istanbul'

export default {
  entry: 'test/index.js',
  plugins: [
    nodeResolve({
      jsnext: true
    }),
    istanbul({
      exclude: ['test/**/*.js']
    }),
    commonjs()
  ],
  external: [
    'tape',
    'brisky-stamp',
    'monotonic-timestamp'
  ],
  sourceMap: true,
  targets: [
    { dest: 'dist/test/index.js', format: 'cjs' }
  ]
}
