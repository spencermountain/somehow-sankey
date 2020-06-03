const d3 = require('d3')
const curvature = 0.4

module.exports = function (source, target) {
  var x0 = source.x + source.width
  let y0 = source.y // + source.height // + d.sy + d.dy / 2,

  let x1 = target.x
  let y1 = target.y //+ target.height //+ d.ty + d.dy / 2

  let xi = d3.interpolateNumber(x0, x1)
  let x2 = xi(curvature)
  let x3 = xi(1 - curvature)
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
