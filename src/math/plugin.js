const d3 = require('d3')
const toPath = require('./toPath')

function center(node) {
  return node.y + node.dy / 2
}

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
    nodeStartY()
    // resolveCollisions()
    // for (var alpha = 1; iterations > 0; --iterations) {
    // relaxRightToLeft((alpha *= 0.99))
    // // resolveCollisions()
    // relaxLeftToRight(alpha)
    // }
    // console.log(nodes)
    computeY()

    function nodeStartY() {
      var ky = d3.min(nodesByCol, function (nodes) {
        return (
          (size[1] - (nodes.length - 1) * nodePadding) / d3.sum(nodes, value)
        )
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

    function computeY() {
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
