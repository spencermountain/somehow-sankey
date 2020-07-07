<script>
  export let color = 'steelblue'
  function uuid() {
    return 'xxxxxx'.replace(/[xy]/g, function(c) {
      var r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }
  let id = uuid()
  console.log(color)
</script>

<style>

</style>

<!-- <svg
  xmlns="http://www.w3.org/2000/svg"
  height="100%"
  width="100%"
  viewBox="0 0 140 140">
  <defs>
    <pattern id="fokja" patternUnits="userSpaceOnUse" width="20" height="20">
      <circle
        cx="10"
        cy="10"
        r="2"
        fill={color}
        stroke="#343434"
        stroke-width="0" />
    </pattern>
  </defs>
  <rect x="0" y="0" width="100%" height="100%" fill="url(#fokja)" />

</svg> -->
<svg width="100%" height="100%">
  <defs>
    <pattern
      {id}
      x="0"
      y="0"
      width="6"
      height="6"
      patternUnits="userSpaceOnUse">
      <circle fill={color} cx="4" cy="4" r="2" />
    </pattern>
  </defs>

  <rect x="0" y="0" width="100%" height="100%" fill="url(#{id})" />
</svg>
