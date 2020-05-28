import * as d3 from 'd3'
let d4 = Object.assign({}, d3)
import sankey from './plugin'
d4.sankey = sankey
// unique values of an array
const onlyUnique = function (value, index, self) {
  return self.indexOf(value) === index
}

const build = function (data, width, height) {
  let sanKey = d4
    .sankey()
    .nodeWidth(150)
    .nodePadding(height / 10)
    .size([width, height])

  let path = sanKey.link()

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
    }
  })

  // create links array
  let links = data.map(function (row) {
    function getNode(type) {
      return nodes.filter(function (node_object) {
        return node_object.name === row[type]
      })[0].node
    }
    return {
      source: getNode('source'),
      target: getNode('target'),
      value: +row.value,
    }
  })

  sanKey.nodes(nodes).links(links).layout(32)
  nodes.forEach((n, i) => {
    if (data[i]) {
      n.color = data[i].color
      n.accent = data[i].accent
      n.opacity = data[i].opacity
    }
  })
  return {
    nodes: nodes,
    links,
    path,
    nodeWidth: sanKey.nodeWidth(),
  }
}
export default build
