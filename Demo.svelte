<script>
  import { Sankey, Node } from './src'
</script>

<Sankey height="1000">
  <Node name="Toronto" to="Canada" value="6" />
  <Node name="Ontario" to="Canada" value="7.7" color="sky" />

  <Node name="Montreal" to="Canada" value="4" />
  <Node name="Quebec" to="Canada" value="2.5" />

  <Node name="Vancouver" to="Canada" value="2.4" color="greypurple" />
  <Node name="B.C." to="Canada" value="2.2" color="burn" />

  <Node name="rest" to="Canada" value="7.9" opacity="0.6" />

</Sankey>
