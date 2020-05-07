<script>
  import build from './math/build'
  import { items } from './store.js'
  export let data = []
  let { nodes, links, path, nodeWidth } = build(data)
  items.subscribe(all => {
    ;({ nodes, links, path, nodeWidth } = build(all))
  })
</script>

<style>
  .node rect {
    cursor: move;
    fill-opacity: 0.9;
    shape-rendering: crispEdges;
  }
  .node text {
    pointer-events: none;
    font-size: 0.8em;
  }

  .link {
    fill: none;
    stroke-opacity: 0.5;
  }
  .link:hover {
    stroke-opacity: 1;
  }
</style>

<svg viewBox="0,0,800,580" width="820" height="600">

  <!-- each box -->
  {#each nodes as d}
    <g class="node" transform="translate({d.x},{d.y})">
      <rect
        fill="steelblue"
        stroke="steelblue"
        height={d.dy < 0 ? 0.1 : d.dy}
        width={nodeWidth} />
      <text
        x="20"
        text-anchor="start"
        y={d.dy / 2}
        dy=".35em"
        style="font-size:14px;">
        {d.name}- {Math.ceil(d.value * 100) / 100}m
      </text>
    </g>
  {/each}

  <g>
    <!-- each link -->
    {#each links as d}
      <path
        class="link"
        d={path(d)}
        stroke="steelblue"
        fill="none"
        stroke-width={Math.max(1, d.dy)}>
        <title>
          {d.source.name} → {d.target.name} ${parseInt(d.value, 10)}
        </title>
      </path>
    {/each}
  </g>
</svg>

<slot />
