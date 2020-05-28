<script>
  import build from './math/build'
  import { items } from './store.js'
  import c from 'spencer-color'
  let colors = c.colors
  export let data = []
  export let width = 800
  export let height = 500
  let { nodes, links, path, nodeWidth } = build(data, width, height)
  items.subscribe(all => {
    ;({ nodes, links, path, nodeWidth } = build(all, width, height))
  })
  let color = 'steelblue'
  let accent = '#d98b89'
</script>

<style>
  .node {
    position: absolute;
    border-radius: 3px;
    box-shadow: 2px 2px 8px 0px rgba(0, 0, 0, 0.2);
    color: #dedede;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-bottom: 4px solid #d98b89;
    font-size: 15px;
    font-family: 'Catamaran', sans-serif;
  }

  .link {
    fill: none;
    stroke-opacity: 0.2;
  }
  .link:hover {
    stroke-opacity: 1;
  }
  .value {
    color: #d98b89;
    font-size: 25px;
  }
  .tiny {
    flex-direction: row;
    font-size: 12px;
    justify-content: space-evenly;
  }
</style>

<div style="position:relative;">
  <div style="position:absolute; width:{width}px; height:{height}px;">
    {#each nodes as d}
      <div
        class="node"
        class:tiny={d.y > 300}
        style="left:{d.x}px; top:{d.y}px; width:{nodeWidth}px; background-color:{colors[d.color] || color};
        height:{d.dy < 0 ? 0.1 : d.dy}px; border-bottom: 4px solid {colors[d.accent] || accent};
        opacity:{d.opacity || 1};">
        <div class="label">{d.name}</div>
        <div
          class="value"
          class:tiny={d.y > 300}
          style="color:{colors[d.accent] || accent};">
          {Math.ceil(d.value * 100) / 100}m
        </div>
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
          style=""
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
