const toPath = require('../src/lib/toPath')

const makePaths = function (nodes) {
  let paths = []
  nodes.forEach((node) => {
    let target = nodes.find((n) => n.name === node.target)
    if (target) {
      paths.push({
        source: node,
        target: target,
        d: toPath(node, target),
      })
    }
  })
  return paths
}
module.exports = makePaths
