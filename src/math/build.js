import * as d3 from 'd3'
let d4 = Object.assign({}, d3)
import sankey from './plugin'
d4.sankey = sankey

const nodeWidth = 120
// unique values of an array
const onlyUnique = function (value, index, self) {
  return self.indexOf(value) === index
}

const build = function (data, width, height) {
  let sanKey = d4.sankey(width, height, nodeWidth)

  let path = sanKey.toPath()
  let meta = {}
  data.forEach((o) => {
    meta[o.source] = o
  })

  // create an array to push all sources and targets, before making them unique
  let arr = []
  data.forEach(function (d) {
    arr.push(d.source)
    arr.push(d.target)
  })
  let nodes = arr.filter(onlyUnique).map(function (d, i) {
    return {
      node: i,
      name: d,
      meta: meta[d],
    }
  })

  // create links array
  let links = data.map(function (row) {
    function getNode(type) {
      return (
        nodes.filter(function (node_object) {
          return node_object.name === row[type]
        })[0] || {}
      ).node
    }
    return {
      source: getNode('source'),
      target: getNode('target'),
      value: +row.value,
    }
  })

  sanKey.layout(nodes, links)
  // add metadata back to each node
  nodes.forEach((n, i) => {
    if (n.meta) {
      n.color = n.meta.color
      n.opacity = n.meta.opacity
      n.accent = n.meta.accent
    }
  })
  return {
    nodes: nodes,
    links,
    path,
    nodeWidth: nodeWidth,
  }
}
export default build
