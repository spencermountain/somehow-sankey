const linear = require('../lib/scale')
const nodeWidth = 120

const getMax = function (byCol) {
  let max = 0
  byCol.forEach((nodes) => {
    nodes.forEach((node) => {
      let total = node.top + node.value
      if (total > max) {
        max = total
      }
    })
  })
  return max
}

const applyDx = function (node) {
  if (node.dx) {
    node.x += node.dx
  }
  if (node.dy) {
    node.y += node.dy
  }
  return node
}

const makePoints = function (byCol, width, height) {
  let max = getMax(byCol)
  let yScale = linear({ minmax: [0, max], world: [0, height] })
  let xScale = linear({ minmax: [0, byCol.length], world: [0, width] })
  console.log(max, height)
  byCol.forEach((nodes) => {
    nodes.forEach((node) => {
      node.y = yScale(node.top)
      node.height = yScale(node.value)
      node.x = xScale(node.col)
      node.width = nodeWidth
      node = applyDx(node)
    })
  })
  return byCol
}
module.exports = makePoints
