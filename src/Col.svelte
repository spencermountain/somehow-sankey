<script>
  import { onMount, setContext, getContext } from 'svelte'
  import { colCount } from './lib/store.js'
  import uuid from './lib/uuid'
  $colCount += 1
</script>

<style>

</style>

<div>
  <slot />
</div>
