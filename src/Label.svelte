<script>
  import { getContext } from 'svelte'
  import { labels, colCount } from './lib/store.js'
  import c from 'spencer-color'
  let colors = c.colors
  export let start = 100
  export let width = 100
  export let end = 0
  export let label = 'hi'
  export let color = 'lightgrey'
  let row = {
    type: 'label',
    start,
    end,
    label,
    width,
    color,
    color: colors[color] || color,
    col: $colCount,
  }
  labels.update((arr) => {
    arr.push(row)
    return arr
  })
</script>
