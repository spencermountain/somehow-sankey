<script>
  import { getContext } from 'svelte'
  import { items, colCount } from './lib/store.js'
  import c from 'spencer-color'
  let colors = c.colors
  export let value = null
  export let from = null
  export let name = ''
  export let full = '100'
  export let to = ''
  export let color = 'steelblue'
  export let append = ''
  export let accent = '#d98b89'
  export let dy = '0'
  export let dx = '0'
  export let opacity = '1'
  export let after = false
  if (typeof value === 'string') {
    value = value.replace(/,/g, '')
  }
  let row = {
    name,
    to,
    after,
    value: Number(value),
    full: Number(full),
    from,
    dy: Number(dy),
    dx: Number(dx),
    color: colors[color] || color,
    append,
    accent,
    opacity,
    col: $colCount,
  }

  items.update((arr) => {
    arr.push(row)
    return arr
  })
</script>
