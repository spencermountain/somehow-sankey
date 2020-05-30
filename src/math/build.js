import * as d3 from 'd3'
let d4 = Object.assign({}, d3)
import sankey from './plugin'
d4.sankey = sankey
// unique values of an array
const onlyUnique = function (value, index, self) {
  return self.indexOf(value) === index
}

const build = function (data, width, height) {
  let sanKey = d4.sankey().nodeWidth(150).nodePadding(50).size([width, height])

  let path = sanKey.link()
  let meta = {}
  data.forEach((o) => {
    meta[o.source] = o
  })
  // console.log(data)

  // create an array to push all sources and targets, before making them unique
  let arr = []
  data.forEach(function (d) {
    arr.push(d.source)
    arr.push(d.target)
  })
  let nodes = arr.filter(onlyUnique).map(function (d, i) {
    // console.log(d)
    return {
      node: i,
      name: d,
      meta: meta[d],
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
    // let d = data.find((o) => o.name === n.name) || {}
    // console.log(d)
    if (n.meta) {
      n.color = n.meta.color
      // n.accent = d.accent
      // n.opacity = d.opacity
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
