# somehow-sankey

WIP svelte sankey diagram component

```html
<script>
  import { Sankey, Path } from 'somehow-sankey'
</script>

<Sankey>
  <Path source="NHL" target="Leafs" value="8" />
  <Path source="Tickets" target="Leafs" value="50" />
  <Path source="In-Arena" target="Leafs" value="20" />
  <Path source="LocalTV" target="Leafs" value="5" />
  <Path source="Leafs" target="Player Salary" value="75" />
  <Path source="Leafs" target="Coach" value="6" />
</Sankey>
```

![image](https://user-images.githubusercontent.com/399657/81346980-47569f80-9089-11ea-9ac7-5ca72ce25dbc.png)

this library uses d3's layout alg, but renders svg with svelte

MIT
