<script>
  import layout from './layout'
  import Dots from './Dots.svelte'
  import { items } from './lib/store.js'
  import { onMount } from 'svelte'
  import c from 'spencer-color'
  let colors = c.colors
  export let height = 500
  export let nodeWidth = 120
  let width = 500 //this gets re-set
  export let fmt = num => {
    if (num >= 1000000) {
      num = Math.round(num / 1000000) * 1000000
      return String(num / 1000000) + 'm'
    }
    if (num > 1000) {
      return String(num / 1000) + 'k'
    }
    return String(num)
  }
  height = Number(height)
  width = Number(width)
  let nodes = []
  let paths = []
  let color = 'steelblue'
  let accent = '#d98b89'
  onMount(() => {
    ;({ nodes, paths } = layout($items, width, height, nodeWidth))
    // console.log(paths)
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
    transition: box-shadow 0.2s ease-in-out;
  }
  .node:hover {
    box-shadow: 2px 2px 8px 0px steelblue;
  }
  .link {
    opacity: 0.2;
    z-index: 1;
  }
  .link:hover {
    stroke-opacity: 1;
  }
  .value {
    font-size: 25px;
    z-index: 2;
    cursor: default;
  }
  .label {
    z-index: 2;
    cursor: default;
  }
  .tiny {
    z-index: 2;
    flex-direction: row;
    font-size: 11px !important;
    justify-content: space-evenly;
  }
  .drop {
    position: absolute;
    top: 0px;
    z-index: 1;
  }
  .dots {
    position: absolute;
    top: 0px;
    height: 100%;
    width: 100%;
    z-index: 0;
  }
  .append {
    position: absolute;
    bottom: -30px;
    font-size: 12px;
  }
</style>

<div style="position:relative;" bind:clientWidth={width}>
  <div style="position:absolute; width:{width}px; height:{height}px;">
    {#each nodes as d}
      <div
        class="node"
        class:tiny={d.height < 80}
        style="left:{d.x}px; top:{d.y}px; width:{d.width}px; height:{d.height}px;
        border-bottom: 4px solid {colors[d.accent] || d.accent || accent};
        opacity:{d.opacity || 1};">
        <div
          class="drop"
          style="width:100%; height:{d.full}%; background-color:{colors[d.color] || d.color || color};" />

        {#if d.full !== 100}
          <div
            class="dots"
            style="background-color: {colors[d.color] || d.color || color};">
            <Dots color={'white'} />
          </div>
        {/if}
        <div class="label">{d.name}</div>
        <div
          class="value"
          class:tiny={d.height < 80}
          style="color:{colors[d.accent] || accent};">
          {fmt(d.value)}
        </div>
        {#if d.append}
          <div
            class="append"
            style="color:{colors[d.color] || d.color || color}">
            {d.append}
          </div>
        {/if}
      </div>
    {/each}

  </div>

  <svg viewBox="0,0,{width},{height}" {width} {height}>
    {#each paths as d}
      <path
        class="link"
        {d}
        stroke="none"
        fill="lightsteelblue"
        style=""
        stroke-width={1} />
    {/each}
  </svg>
</div>

<slot />
