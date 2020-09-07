const pinchDown = function (from, to) {
  return ` L${to[0]},${to[1]}`
  // return ` S${from[0] + 50},${from[1] + 15}   ${to[0]},${to[1]}`
}
const pinchUp = function (from, to) {
  return ` L${to[0]},${to[1]}`
  // return ` S${from[0] + 50},${from[1] - 15}   ${to[0]},${to[1]}`
}

const makePath = function (from, to) {
  let already = from.alreadyFrom
  let path = `M${from.x + from.width},${from.y + already}` // (source-top)
  // dest-top
  path += ` L${to.x},${to.y}`
  // dest-bottom
  path += ` L${to.x},${to.y + to.height}`
  // source-bottom
  path += ` L${from.x + from.width},${from.y + to.height + already}`
  path += ` Z`
  return path
}

const backwardPaths = function (nodes) {
  let paths = []
  nodes.forEach((to) => {
    if (to.from) {
      let source = nodes.find((n) => n.name === to.from)
      source.alreadyFrom = source.alreadyFrom || 0
      let path = makePath(source, to)
      source.alreadyFrom += to.height
      paths.push(path)
    }
  })
  return paths
}

const makePaths = function (nodes) {
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
  let backward = backwardPaths(nodes)
  paths = paths.concat(backward)
  return paths
}
export default makePaths
