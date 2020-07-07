const bySum = function (byCol) {
  byCol.forEach((nodes) => {
    let already = 0
    nodes.forEach((node) => {
      node.top = already
      already += node.value
    })
  })
  return byCol
}

// align each node with right-node
const byNeighbour = function (byCol) {
  byCol.forEach((nodes) => {
    nodes.forEach((node, n) => {
      if (node.tos.length === 1 && node.tos[0].top > node.top) {
        console.log('moving ' + node.name)
        node.top = node.tos[0].top
        // move down stacked-nodes as well
        let already = node.top + node.value
        for (let i = n + 1; i < nodes.length; i += 1) {
          // console.log('... and moving ' + nodes[i].name)
          if (nodes[i].stacked === true) {
            nodes[i].top = already
            already += nodes[i].value
          } else {
            break
          }
        }
      }
    })
  })
  return byCol
}

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
const addMargin = function (byCol) {
  let max = getMax(byCol)
  let margin = max * 0.015
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

const findStart = function (byCol) {
  byCol = bySum(byCol)
  // wiggle-this out by right-neighbour
  byCol = byNeighbour(byCol)
  byCol = addMargin(byCol)
  byCol = byNeighbour(byCol)
  return byCol
}
module.exports = findStart
