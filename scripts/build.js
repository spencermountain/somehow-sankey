const rollup = require('rollup')
const svelte = require('rollup-plugin-svelte')
const resolve = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')

const buildPost = function (abs) {
  abs = abs.replace(/\/$/, '')
  return rollup
    .rollup({
      input: `${abs}/build/app.js`,
      plugins: [
        svelte({
          dev: true,
          css: (css) => {
            css.write(`${abs}/build/bundle.css`, false)
          },
        }),
        resolve({
          browser: true,
          dedupe: ['svelte'],
        }),
        commonjs(),
      ],
      onwarn: function (message) {
        if (message.code === 'CIRCULAR_DEPENDENCY') {
          return
        }
        console.error(message)
      },
    })
    .then((bundle) => {
      bundle.write({
        sourcemap: false,
        format: 'iife',
        name: 'app',
        file: `${abs}/build/bundle.js`,
      })
    })
    .catch((e) => {
      console.log(e)
    })
}

module.exports = buildPost
