const chokidar = require('chokidar')
const buildOne = require('./build')
const server = require('./server')
const path = require('path')

let abs = path.join(__dirname, '../')
// server(abs)

const doit = function () {
  console.log('\n')
  buildOne(abs).then(() => {
    console.log('\nready')
  })
}

const watcher = chokidar
  .watch([`${abs}**/*.svelte`, `${abs}/src/**/*.js`], {
    ignored: [/node_modules/, /(^|[\/\\])\../],
    persistent: true,
  })
  .on('ready', () => {
    doit()
    watcher.on('add', () => {
      doit()
    })
    watcher.on('addDir', () => {
      doit()
    })
  })
  .on('change', () => {
    doit()
  })
  .on('unlink', () => {
    doit()
  })
  .on('unlinkDir', () => {
    doit()
  })
