# somehow-sankey

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

this library uses d3's layout alg, but renders svg with svelte

MIT
