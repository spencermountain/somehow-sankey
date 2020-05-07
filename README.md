# somehow-sankey

WIP svelte sankey diagram component

```html
<script>
  import Sankey from 'somehow-sankey'
  let data = [
    { source: 'NHL', target: 'Leafs', value: '8' },
    { source: 'Tickets', target: 'Leafs', value: '50' },
    { source: 'In-Arena', target: 'Leafs', value: '20' },
    { source: 'LocalTV', target: 'Leafs', value: '5' },
    { source: 'Leafs', target: 'Player Salary', value: '75' },
    { source: 'Leafs', target: 'Coach', value: '6' },
  ]
</script>

<Sankey {data} />
```

this library uses d3's layout alg, but renders svg as a svelte file

MIT
