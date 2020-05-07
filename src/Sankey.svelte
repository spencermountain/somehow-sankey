<script>
  import * as d3 from 'd3'
  let d4 = Object.assign({}, d3)
  import sankey from './plugin'
  d4.sankey = sankey

  export let data = []

  // unique values of an array
  const onlyUnique = function(value, index, self) {
    return self.indexOf(value) === index
  }

  let width = 800
  let height = 580

  let sanKey = d4
    .sankey()
    .nodeWidth(150)
    .nodePadding(height / 10)
    .size([width, height])

  let path = sanKey.link()

  // create an array to push all sources and targets, before making them unique
  let arr = []
  data.forEach(function(d) {
    arr.push(d.source)
    arr.push(d.target)
  })
  let nodes = arr.filter(onlyUnique).map(function(d, i) {
    return {
      node: i,
      name: d,
    }
  })

  // create links array
  let links = data.map(function(row) {
    function getNode(type) {
      return nodes.filter(function(node_object) {
        return node_object.name == row[type]
      })[0].node
    }
    return {
      source: getNode('source'),
      target: getNode('target'),
      value: +row.value,
    }
  })

  sanKey
    .nodes(nodes)
    .links(links)
    .layout(32)
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
        width={sanKey.nodeWidth()} />
      <text x="20" text-anchor="start" y={d.dy / 2} dy=".35em" style="font-size:14px;">
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
        <title>{d.source.name} → {d.target.name} ${parseInt(d.value, 10)}</title>
      </path>
    {/each}
  </g>
</svg>
