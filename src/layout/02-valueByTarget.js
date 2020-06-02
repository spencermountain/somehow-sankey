const clearDown = function (nodes, k) {
  let min = nodes[k]
  console.log(nodes[k])
  for (let i = k + 1; i < nodes.length; i += 1) {}
}

// nudge top values down, if target is below
const getTop = function (byCol) {
  //first, do a simple stacking
  byCol.forEach((nodes) => {
    let sum = 0
    nodes.forEach((node) => {
      node.top = sum
      node.stacked = true
      sum += node.value
    })
  })

  // second, drop if target is lower
  byCol.forEach((nodes, i) => {
    nodes.forEach((node, k) => {
      let found = null
      if (node.target && byCol[i + 1]) {
        found = byCol[i + 1].find((n) => n.name === node.target)
      }
      if (found && found.top > node.top) {
        console.log('moving ' + node.name + ' down')
        node.top = found.top
        node.stacked = false
        clearDown(nodes, k)
      }
    })
  })
  return byCol
}
module.exports = getTop
