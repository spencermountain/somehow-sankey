<script>
  import Sankey from './src/Sankey.svelte'
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
