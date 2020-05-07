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

<style>
  .node rect {
    cursor: move;
    fill-opacity: 0.9;
    shape-rendering: crispEdges;
  }
  .node text {
    pointer-events: none;
    text-shadow: 0px 0px 2px #fff;
    font-size: 0.8em;
  }

  .link {
    fill: none;
    stroke: #000;
    stroke-opacity: 0.5;
  }
  .link:hover {
    stroke-opacity: 1;
  }
</style>

<Sankey {data} />
