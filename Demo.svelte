<script>
  import { Sankey, Path } from './src'
</script>

<Sankey>
  <Path source="NHL" target="Leafs" value="8" order={1} />
  <Path source="Tickets" target="Leafs" value="50" />
  <Path source="In-Arena" target="Leafs" value="20" />
  <Path source="LocalTV" target="Leafs" value="5" />
  <Path source="Leafs" target="Player Salary" value="75" />
  <Path source="Leafs" target="Coach" value="6" />
</Sankey>
