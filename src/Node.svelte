<script>
  import { items } from './store.js'
  export let value = 1
  export let name = ''
  export let to = ''
  export let color = 'steelblue'
  export let accent = '#d98b89'
  export let opacity = '1'

  let row = {
    source: name,
    target: to,
    value: value,
    color: color,
    accent: accent,
    opacity: opacity,
  }

  items.update(arr => {
    arr.push(row)
    return arr
  })
</script>
