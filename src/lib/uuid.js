const uuid = function () {
  return 'xxxxxx'.replace(/[xy]/g, function (c) {
    let r = (Math.random() * 16) | 0 //eslint-disable-line
    let v = c === 'x' ? r : (r & 0x3) | 0x8 //eslint-disable-line
    return v.toString(16)
  })
}
export default uuid
