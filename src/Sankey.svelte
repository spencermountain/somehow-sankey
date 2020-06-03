<script>
  import layout from './layout'
  import { items } from './lib/store.js'
  import { onMount } from 'svelte'
  import c from 'spencer-color'
  let colors = c.colors
  export let width = 800
  export let height = 500
  let nodes = []
  let paths = []
  let color = 'steelblue'
  let accent = '#d98b89'
  onMount(() => {
    ;({ nodes, paths } = layout($items, width, height))
    console.log(paths)
  })
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
  .stacked {
    transform: translate(0, 20px);
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
        class:tiny={d.dy < 80}
        style="left:{d.x}px; top:{d.y}px; width:{d.width}px; background-color:{colors[d.color] || color};
        height:{d.height}px; border-bottom: 4px solid {colors[d.accent] || accent};
        opacity:{d.opacity || 1};">
        <div class="label">{d.name}</div>
        <div
          class="value"
          class:tiny={d.dy < 80}
          style="color:{colors[d.accent] || accent};">
          {Math.ceil(d.value * 100) / 100}m
        </div>
      </div>
    {/each}

  </div>

  <svg viewBox="0,0,{width},{height}" {width} {height}>
    <g>
      {#each paths as path}
        <path
          class="link"
          d={path.d}
          stroke="steelblue"
          fill="lightsteelblue"
          style=""
          stroke-width={1} />
      {/each}
    </g>
  </svg>
</div>

<slot />
