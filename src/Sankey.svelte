<script>
  import buildSankey from './sankey'
  export let data = []
  let node = buildSankey(data)
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
  .container {
    color: white;
  }
</style>

<div class="container">
  {@html node.outerHTML}
</div>
