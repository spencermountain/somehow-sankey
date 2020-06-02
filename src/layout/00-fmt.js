// turn into array of arrays (by Column)
const fmt = function (items) {
  let byCol = []
  items.forEach((node) => {
    if (node.value) {
      node.value = Number(node.value)
    }
    byCol[node.col] = byCol[node.col] || []
    node.top = 0
    node.inputs = 0
    byCol[node.col].push(node)
  })
  byCol.shift()
  return byCol
}
export default fmt
