import fmtByCol from './01-byCol'
import getValue from './02-getValues'
import getTops from './03-getTops'
import makePoints from './04-makePoints'
import makePaths from './05-makePaths'

let toFlat = function (byCol) {
  let list = []
  byCol.forEach((nodes) => {
    nodes.forEach((node) => {
      list.push(node)
    })
  })
  // remove empty nodes
  list = list.filter((n) => n.value)
  return list
}

const layout = function (items, width, height, nodeWidth, labels) {
  let byCol = fmtByCol(items)
  // add value
  byCol = getValue(byCol)
  // add top
  byCol = getTops(byCol)
  // add x, y, width, height
  byCol = makePoints(byCol, width, height, nodeWidth, labels)

  let nodes = toFlat(byCol)
  let paths = makePaths(nodes)

  return {
    nodes: nodes,
    paths: paths,
    nodeWidth: nodeWidth,
    labels
  }
}
export default layout
