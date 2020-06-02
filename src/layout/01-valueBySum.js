//compute value from inputs
const getValues = function (byCol) {
  byCol.forEach((nodes, i) => {
    nodes.forEach((node) => {
      if (node.target && byCol[i + 1]) {
        let found = byCol[i + 1].find((n) => n.name === node.target)
        found.inputs += node.value
        if (found.inputs > found.value) {
          found.value = found.inputs
        }
      }
    })
  })
  return byCol
}
export default getValues
