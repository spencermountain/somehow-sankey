import fmt from './00-fmt'
import getHeights from './01-valueBySum'
import getTop from './02-valueByTarget'
import addXY from './03-addXY'

const toArr = function (byCol) {
  let nodes = []
  Object.keys(byCol).forEach((k) => {
    nodes = nodes.concat(byCol[k])
  })
  return nodes
}

//   ;({ nodes, links, path, nodeWidth } = layout($items, width, height))
const layout = function (items, width, height) {
  let byCol = fmt(items)
  byCol = getHeights(byCol)
  byCol = getTop(byCol)
  let nodes = toArr(byCol)
  nodes = addXY(nodes, Number(width), Number(height))
  console.log(nodes)
  return {
    nodes,
    links: [],
    path: () => {},
    nodeWidth: 50,
  }
}
export default layout
