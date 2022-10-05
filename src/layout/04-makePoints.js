import linear from '../lib/scale'
const topRoom = 20

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
const getTotal = function (nodes) {
  let total = 0
  nodes.forEach((node) => {
    total += node.value
  })
  return total
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

const shrinkLongNodes = function (byCol) {
  byCol.forEach((nodes) => {
    if (nodes.length === 1) {
      nodes[0].y += topRoom
    }
  })
}

const percent = (part, total) => {
  let num = (part / total) * 100
  num = Math.round(num)
  return num + '%'
}

const makePoints = function (byCol, width, height, nodeWidth) {
  let max = getMax(byCol)
  let half = nodeWidth / 2
  let yScale = linear({ minmax: [0, max], world: [0, height - topRoom] })
  let xScale = linear({ minmax: [0, byCol.length], world: [0, width] })
  byCol.forEach((nodes) => {
    let total = getTotal(nodes)
    console.log(total)
    nodes.forEach((node) => {
      node.y = yScale(node.top)
      node.percent = percent(node.value, total)
      node.height = yScale(node.value)
      node.x = xScale(node.col - 1) + half
      node.width = nodeWidth
      node = applyDx(node)
    })
  })
  // give cols with many margins more space
  shrinkLongNodes(byCol)
  return byCol
}
export default makePoints
