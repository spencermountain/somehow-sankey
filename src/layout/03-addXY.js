const linear = require('../lib/scale')
const nodeWidth = 80

const getMax = function (nodes) {
  let max = 0
  nodes.forEach((node) => {
    let total = node.top + node.value
    if (total > max) {
      max = total
    }
  })
  return max
}
const getCols = function (nodes) {
  let max = 1
  nodes.forEach((node) => {
    if (node.col > max) {
      max = node.col
    }
  })
  return max
}

const addXY = function (nodes, width, height) {
  let max = getMax(nodes)
  let yScale = linear({ minmax: [0, max], world: [0, height] })
  let cols = getCols(nodes)
  let xScale = linear({ minmax: [0, cols], world: [0, width] })
  nodes.forEach((node) => {
    node.y = yScale(node.top)
    node.x = xScale(node.col)
    node.height = yScale(node.value)
    node.width = nodeWidth
    // add margin
    if (node.stacked && node.top !== 0) {
      node.y += 20
    }
  })
  return nodes
}

module.exports = addXY
