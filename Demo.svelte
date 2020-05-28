<script>
  import { Sankey, Node } from './src'
</script>

<Sankey>
  <Node name="NHL" to="Leafs" value="8" />
  <Node name="Tickets" to="Leafs" value="50" />
  <Node name="In-Arena" to="Leafs" value="20" />
  <Node name="LocalTV" to="Leafs" value="5" />
  <Node name="Leafs" to="Player Salary" value="75" />
  <Node name="Leafs" to="Coach" value="6" />
</Sankey>
