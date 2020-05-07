<script>
  import { items } from './store.js'
  export let value = 1
  export let source = 'source'
  export let target = 'target'

  let row = { source: source, target: target, value: value }

  items.update(arr => {
    arr.push(row)
    return arr
  })
</script>
