const linear = require('../lib/scale')
const nodeWidth = 80

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

// splay-out stacked nodes a bit
const addMargin = function (byCol, max) {
  let margin = max * 0.02
  byCol.forEach((nodes) => {
    let count = 1
    nodes.forEach((node) => {
      if (node.stacked) {
        node.top += margin * count
        count += 1
      } else {
        count = 1
      }
    })
  })
  return byCol
}

const makePoints = function (byCol, width, height) {
  let max = getMax(byCol)
  byCol = addMargin(byCol, max)
  let yScale = linear({ minmax: [0, max], world: [0, width] })
  let xScale = linear({ minmax: [0, byCol.length], world: [0, height] })
  byCol.forEach((nodes) => {
    nodes.forEach((node) => {
      node.y = yScale(node.top)
      node.height = yScale(node.value)
      node.x = xScale(node.col)
      node.width = nodeWidth
    })
  })
  return byCol
}
module.exports = makePoints
