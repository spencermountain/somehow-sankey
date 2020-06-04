const pinchDown = function (from, to) {
  return ` L${to[0]},${to[1]}`
  // return ` S${from[0] + 50},${from[1] + 15}   ${to[0]},${to[1]}`
}
const pinchUp = function (from, to) {
  return ` L${to[0]},${to[1]}`
  // return ` S${from[0] + 50},${from[1] - 15}   ${to[0]},${to[1]}`
}
const makePaths = function (nodes) {
  console.log(nodes)
  let paths = []
  nodes.forEach((node) => {
    let fromX = node.x + node.width
    let fromY = node.y
    let h = node.height
    node.tos.forEach((to) => {
      to.already = to.already || 0
      // node top-right
      let d = `M${fromX},${fromY}`
      // dest top-left
      d += pinchDown([fromX, fromY], [to.x, to.y + to.already])
      // dest bottom-left
      d += ` L${to.x},${to.y + h + to.already}`
      // back to bottom of node
      d += pinchUp([to.x, to.y + h + to.already], [fromX, fromY + h])
      // fill it
      d += ` Z`
      to.already += node.height

      paths.push(d)
    })
  })
  return paths
}
module.exports = makePaths
