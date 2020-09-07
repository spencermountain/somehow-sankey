<div align="center">
  <div><b>somehow-sankey</b></div>
  <img src="https://user-images.githubusercontent.com/399657/68222691-6597f180-ffb9-11e9-8a32-a7f38aa8bded.png"/>
  <div>— part of <a href="https://github.com/spencermountain/somehow">somehow</a> —</div>
  <div>WIP svelte infographics</div>
  <div align="center">
    <sub>
      by
      <a href="https://spencermounta.in/">Spencer Kelly</a> 
    </sub>
  </div>
</div>
<div align="right">
  <a href="https://npmjs.org/package/somehow-sankey">
    <img src="https://img.shields.io/npm/v/somehow-sankey.svg?style=flat-square" />
  </a>
</div>
<img height="25px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>

WIP svelte sankey diagram component

```html
<script>
  import { Sankey, Node } from 'somehow-sankey'
</script>

<Sankey>
  <Node name="NHL" to="Leafs" value="8" />
  <Node name="Tickets" to="Leafs" value="50" color="pink" />
  <Node name="In-Arena" to="Leafs" value="20" />
  <Node name="LocalTV" to="Leafs" value="5" />
  <Node name="Leafs" to="Player Salary" value="75" />
  <Node name="Leafs" to="Coach" value="6" />
</Sankey>
```

![image](https://user-images.githubusercontent.com/399657/81346980-47569f80-9089-11ea-9ac7-5ca72ce25dbc.png)

this library includes a custom layout alg that is inspired by d3's.

It renders nodes in html, so text and interactions are easier.

MIT
