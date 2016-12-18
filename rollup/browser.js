import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default {
  entry: './wip/index.js',
  plugins: [
    resolve({
      jsnext: true,
      main: true,
      browser: true
    }),
    commonjs()
  ],
  sourceMap: true,
  // external: [
  //   'brisky-stamp',
  //   'monotonic-timestamp',
  //   'quick-hash',
  //   'uws'
  // ],
  targets: [
    {
      dest: 'wip/dist/index.browser.dev.js',
      format: 'iife',
      moduleName: 'wip'
    }
  ]
}
