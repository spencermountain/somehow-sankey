const d3 = require('d3')
const toPath = require('./toPath')
const { nodeStartY, computeY } = require('./nodeLayout')

function value(link) {
  return link.value
}

module.exports = function (width, height, nodeWidth) {
  var sankey = {},
    nodePadding = 12,
    size = [width, height],
    nodes = [],
    links = []

  sankey.nodeWidth = function () {
    return nodeWidth
  }
  sankey.size = function (_) {
    if (!arguments.length) return size
    size = _
    return sankey
  }

  sankey.toPath = toPath

  // Populate the sourceLinks and targetLinks for each node.
  // Also, if the source and target are not objects, assume they are indices.
  function computeNodeLinks() {
    nodes.forEach(function (node) {
      node.sourceLinks = []
      node.targetLinks = []
    })
    links.forEach(function (link) {
      let source = link.source
      let target = link.target
      if (typeof source === 'number') {
        source = link.source = nodes[link.source]
      }
      if (typeof target === 'number') {
        target = link.target = nodes[link.target]
      }
      source.sourceLinks.push(link)
      target.targetLinks.push(link)
    })
  }

  // use given value, or incoming values
  function computeNodeValues() {
    nodes.forEach(function (node) {
      node.value = Math.max(
        d3.sum(node.sourceLinks, value),
        d3.sum(node.targetLinks, value)
      )
    })
  }

  function scaleNodeBreadths(kx) {
    nodes.forEach(function (node) {
      node.x *= kx
    })
  }
  // Iteratively assign the breadth (x-position) for each node.
  // Nodes are assigned the maximum breadth of incoming neighbors plus one;
  // nodes with no incoming links are assigned breadth zero, while
  // nodes with no outgoing links are assigned the maximum breadth.
  function computeNodeX() {
    var remainingNodes = nodes,
      nextNodes,
      x = 0

    while (remainingNodes.length) {
      nextNodes = []
      remainingNodes.forEach(function (node) {
        node.x = x
        // if (node.meta && node.meta.col !== undefined) {
        //   node.x = Number(node.meta.col)
        // }
        node.dx = nodeWidth
        node.sourceLinks.forEach(function (link) {
          if (nextNodes.indexOf(link.target) < 0) {
            nextNodes.push(link.target)
          }
        })
      })
      remainingNodes = nextNodes
      ++x
    }

    // console.log(nodes)

    //
    // moveSinksRight(x)
    scaleNodeBreadths((size[0] - nodeWidth) / (x - 1))
  }

  function computeNodeY() {
    let nodesByCol = []
    nodes.forEach((node) => {
      let col = 0
      if (node.meta) {
        col = node.meta.col
      }
      nodesByCol[col] = nodesByCol[col] || []
      nodesByCol[col].push(node)
    })
    // make sure it never goes backwards

    //set y to byCol index
    nodeStartY(nodesByCol, links, size, nodePadding)
    computeY(nodesByCol, nodePadding)
  }

  function computeLinkDepths() {
    nodes.forEach(function (node) {
      var sy = 0,
        ty = 0
      node.sourceLinks.forEach(function (link) {
        link.sy = sy
        sy += link.dy
      })
      node.targetLinks.forEach(function (link) {
        link.ty = ty
        ty += link.dy
      })
    })
  }
  // this is the main thing.
  sankey.layout = function (ns, ls) {
    nodes = ns
    links = ls
    computeNodeLinks()
    computeNodeValues()
    computeNodeX()
    computeNodeY(1)
    computeLinkDepths()
    return sankey
  }
  return sankey
}
