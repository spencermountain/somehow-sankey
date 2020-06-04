//get value from sum of inputs
const getValues = function (byCol) {
  byCol.forEach((nodes) => {
    nodes.forEach((node) => {
      node.sum = 0
      node.froms.forEach((n) => (node.sum += n.value))
      if (node.sum > node.value) {
        node.value = node.sum
      }
    })
  })
  return byCol
}

export default getValues
