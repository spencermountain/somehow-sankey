const d3 = require('d3')
const toPath = require('./toPath')

function center(node) {
  return node.y + node.dy / 2
}

function value(link) {
  return link.value
}

module.exports = function () {
  var sankey = {},
    nodeWidth = 24,
    nodePadding = 12,
    size = [1, 1],
    nodes = [],
    links = [],
    meta = {}

  sankey.nodeWidth = function (_) {
    if (!arguments.length) return nodeWidth
    nodeWidth = +_
    return sankey
  }

  sankey.nodes = function (_) {
    if (!arguments.length) return nodes
    nodes = _
    nodes.forEach((o) => {
      meta[o.name] = o
    })
    return sankey
  }

  sankey.links = function (_) {
    if (!arguments.length) return links
    links = _
    return sankey
  }

  sankey.size = function (_) {
    if (!arguments.length) return size
    size = _
    return sankey
  }

  // this is the main thing.
  sankey.layout = function () {
    computeNodeLinks()
    computeNodeValues()
    computeNodeX()
    computeNodeY(1)
    computeLinkDepths()
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
      var source = link.source,
        target = link.target
      if (typeof source === 'number') source = link.source = nodes[link.source]
      if (typeof target === 'number') target = link.target = nodes[link.target]
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

  function moveSinksRight(x) {
    nodes.forEach(function (node) {
      if (!node.sourceLinks.length) {
        node.x = x - 1
      }
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

  function computeNodeY(iterations) {
    // var nodesByCol = d3
    //   .nest()
    //   .key(function (d) {
    //     return d.x
    //   })
    //   // .sortKeys(d3.ascending)
    //   .entries(nodes)
    //   .map(function (d) {
    //     return d.values
    //   })
    // console.log(nodesByCol)
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

    //
    nodeStartY()
    // resolveCollisions()
    // for (var alpha = 1; iterations > 0; --iterations) {
    // relaxRightToLeft((alpha *= 0.99))
    // // resolveCollisions()
    // relaxLeftToRight(alpha)
    // }
    resolveCollisions()

    function nodeStartY() {
      var ky = d3.min(nodesByCol, function (nodes) {
        return (
          (size[1] - (nodes.length - 1) * nodePadding) / d3.sum(nodes, value)
        )
      })

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

    function relaxLeftToRight(alpha) {
      nodesByCol.forEach(function (nodes, breadth) {
        nodes.forEach(function (node) {
          if (node.targetLinks.length) {
            var y =
              d3.sum(node.targetLinks, weightedSource) /
              d3.sum(node.targetLinks, value)
            node.y += (y - center(node)) * alpha
          }
        })
      })

      function weightedSource(link) {
        return 0 //center(link.source) * link.value
      }
    }

    function relaxRightToLeft(alpha) {
      nodesByCol
        .slice()
        .reverse()
        .forEach(function (nodes) {
          nodes.forEach(function (node) {
            if (node.sourceLinks.length) {
              var y =
                d3.sum(node.sourceLinks, weightedTarget) /
                d3.sum(node.sourceLinks, value)
              node.y += (y - center(node)) * alpha
            }
          })
        })

      function weightedTarget(link) {
        // console.log(link.target)
        return center(link.target) * link.value
      }
    }

    function resolveCollisions() {
      nodesByCol.forEach(function (nodes) {
        var node,
          dy,
          y0 = 0,
          n = nodes.length,
          i

        // Push any overlapping nodes down.
        // nodes.sort(ascendingDepth)
        for (i = 0; i < n; ++i) {
          node = nodes[i]
          dy = y0 - node.y
          if (dy > 0) node.y += dy
          y0 = node.y + node.dy + nodePadding
        }

        // If the bottommost node goes outside the bounds, push it back up.
        // dy = y0 - nodePadding - size[1]
        // if (dy > 0) {
        //   y0 = node.y -= dy

        //   // Push any overlapping nodes back up.
        //   for (i = n - 2; i >= 0; --i) {
        //     node = nodes[i]
        //     dy = node.y + node.dy + nodePadding - y0
        //     if (dy > 0) node.y -= dy
        //     y0 = node.y
        //   }
        // }
      })
    }
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

  return sankey
}
