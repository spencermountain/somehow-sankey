import fmtByCol from './01-byCol'
import getValue from './02-getValues'
import getTops from './03-getTops'

const layout = function (items, width, height) {
  let byCol = fmtByCol(items)
  // calculate value by inputs
  byCol = getValue(byCol)
  byCol = getTops(byCol)
  // console.log(JSON.stringify(byCol, null, 2))
  console.log(byCol)
  // byCol = getHeights(byCol)
  // byCol = getTop(byCol)
  // let nodes = toArr(byCol)
  // nodes = addXY(nodes, Number(width), Number(height))
  // let paths = makePaths(nodes)
  return {
    nodes: [],
    paths: [],
    nodeWidth: 50,
  }
}
export default layout
