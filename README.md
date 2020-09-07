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
<Sankey height="600">
  <Col>
    <Node name="Property Taxes" to="Toronto" value="4400" color="sea" />
    <Node name="Province/Fed" to="Toronto" value="2500" color="red" />
    <Node name="TTC Fares" to="Toronto" value="1300" color="sky" />
    <Node name="Fees" to="Toronto" value="900" color="sky" />
  </Col>
  <Col>
    <Node name="Toronto" value="11600" color="blue" />
  </Col>
</Sankey>
```

![image](https://user-images.githubusercontent.com/399657/92411176-c54cb500-f114-11ea-87ed-8e736ecb00f2.png)

this library includes a custom layout alg that is inspired by d3's.

It renders nodes in html, so text and interactions are easier.

MIT
