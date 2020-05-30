const d3 = require('d3')

module.exports = function () {
  var curvature = 0.4

  function link(d) {
    var x0 = d.source.x + d.source.dx,
      x1 = d.target.x,
      xi = d3.interpolateNumber(x0, x1),
      x2 = xi(curvature),
      x3 = xi(1 - curvature),
      y0 = d.source.y + d.sy + d.dy / 2,
      y1 = d.target.y + d.ty + d.dy / 2
    return (
      'M' +
      x0 +
      ',' +
      y0 +
      'C' +
      x2 +
      ',' +
      y0 +
      ' ' +
      x3 +
      ',' +
      y1 +
      ' ' +
      x1 +
      ',' +
      y1
    )
  }

  link.curvature = function (_) {
    if (!arguments.length) return curvature
    curvature = +_
    return link
  }

  return link
}
