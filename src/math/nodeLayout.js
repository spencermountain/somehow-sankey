const d3 = require('d3')

function value(link) {
  return link.value
}

exports.nodeStartY = function (nodesByCol, links, size, nodePadding) {
  var ky = d3.min(nodesByCol, function (nodes) {
    return (size[1] - (nodes.length - 1) * nodePadding) / d3.sum(nodes, value)
  })

  // set y to byCol index
  nodesByCol.forEach(function (nodes) {
    nodes.forEach(function (node, i) {
      node.y = i
      node.dy = node.value * ky
    })
  })

  links.forEach(function (link) {
    link.dy = link.value * ky
  })
}

exports.computeY = function (nodesByCol, nodePadding) {
  nodesByCol.forEach(function (colNodes) {
    var node,
      dy,
      y0 = 0,
      n = colNodes.length,
      i
    // Push any overlapping nodes down.
    for (i = 0; i < n; ++i) {
      node = colNodes[i]

      dy = y0 - node.y
      if (dy > 0) {
        node.y += dy
      }
      y0 = node.y + node.dy + nodePadding
    }
  })
  // ensure it's below input
  nodesByCol.forEach(function (colNodes) {
    colNodes.forEach((no) => {
      if (no.sourceLinks[0]) {
        let targetY = no.sourceLinks[0].target.y
        if (targetY > no.y) {
          // console.log(no.name, targetY)
          no.y = targetY
        }
      }
    })
  })
}
