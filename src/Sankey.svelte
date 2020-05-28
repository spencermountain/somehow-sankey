<script>
  import build from './math/build'
  import { items } from './store.js'
  export let data = []
  export let width = 800
  export let height = 500
  let { nodes, links, path, nodeWidth } = build(data, width, height)
  items.subscribe(all => {
    ;({ nodes, links, path, nodeWidth } = build(all, width, height))
  })
  let color = 'steelblue'
</script>

<style>
  .node {
    position: absolute;
    border-radius: 3px;
    box-shadow: 2px 2px 8px 0px rgba(0, 0, 0, 0.2);
    color: #dedede;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 4px solid #cc6966;
    font-size: 13px;
  }

  .link {
    fill: none;
    stroke-opacity: 0.3;
  }
  .link:hover {
    stroke-opacity: 1;
  }
</style>

<div style="position:relative;">
  <div style="position:absolute; width:{width}px; height:{height}px;">
    <!-- each box -->
    {#each nodes as d}
      <div
        class="node"
        style="left:{d.x}px; top:{d.y}px; width:{nodeWidth}px; background-color:{color};
        height:{d.dy < 0 ? 0.1 : d.dy}px;">
        {d.name}- {Math.ceil(d.value * 100) / 100}m
      </div>
    {/each}

  </div>

  <svg viewBox="0,0,{width},{height}" {width} {height}>
    <g>
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
</div>

<slot />
