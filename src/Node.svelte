<script>
  import { getContext } from 'svelte'
  import { items, colCount } from './lib/store.js'
  export let value = null
  export let name = ''
  export let to = ''
  export let color = 'steelblue'
  export let accent = '#d98b89'
  export let opacity = '1'
  let row = {
    name: name,
    to: to,
    value: Number(value),
    color: color,
    accent: accent,
    opacity: opacity,
    col: $colCount,
  }

  items.update(arr => {
    arr.push(row)
    return arr
  })
</script>
