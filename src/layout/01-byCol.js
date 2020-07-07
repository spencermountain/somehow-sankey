// add forward/backwards links
const addLinks = function (byCol) {
  byCol.forEach((nodes, i) => {
    nodes.forEach((node) => {
      if (node.to && byCol[i + 1]) {
        let foundTo = byCol[i + 1].find((n) => n.name === node.to)
        if (foundTo) {
          node.tos.push(foundTo)
          foundTo.froms.push(node)
        }
      }
      // allow backward-set links, too
      if (node.from && byCol[i - 1]) {
        let found = byCol[i - 1].find((n) => n.name === node.from)
        // found.tos.push(node)
        // node.froms.push(found)
      }
    })
  })
}

const addStack = function (byCol) {
  byCol.forEach((nodes) => {
    let lastOne = null
    nodes.forEach((node) => {
      if (node.to === lastOne) {
        node.stacked = true
      }
      lastOne = node.to
    })
  })
}

const byColumn = function (items) {
  let byCol = []
  items.forEach((node) => {
    if (node.value) {
      node.value = Number(node.value)
    }
    byCol[node.col] = byCol[node.col] || []
    node.top = 0
    node.inputs = 0
    node.froms = []
    node.stacked = false

    node.tos = []
    byCol[node.col].push(node)
  })
  byCol.shift()
  return byCol
}

// turn into array of arrays (by Column)
const fmt = function (items) {
  let byCol = byColumn(items)
  addLinks(byCol)
  addStack(byCol)
  return byCol
}
export default fmt
