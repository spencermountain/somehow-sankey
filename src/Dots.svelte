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
</script>

<style>

</style>

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
