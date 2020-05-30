<script>
  import { Sankey, Node } from './src'
</script>

<Sankey height="800">
  <!-- <Node name="Canada" color="red" col="3" /> -->
  <Node name="Toronto" to="Ontario" value="6" col="1" />
  <Node name="Ontario" to="Canada" value="14" color="sky" col="2" />

  <Node name="Montreal" to="Quebec" value="4" color="orange" col="1" />
  <Node name="Quebec" to="Canada" value="8" color="orange" col="2" />

  <Node name="Vancouver" to="B.C." value="2.4" color="greypurple" col="1" />
  <Node name="B.C." to="Canada" value="5" color="burn" col="2" />

  <Node name="Alberta" to="Canada" value="4" opacity="0.6" col="2" />
  <Node name="Nova Scota" to="Canada" value="1" opacity="0.6" col="2" />
  <Node name="Manitoba" to="Canada" value="1" opacity="0.6" col="2" />
  <Node name="Saskatchewan" to="Canada" value="1" opacity="0.6" col="2" />
  <Node name="rest" to="Canada" value="2" opacity="0.6" col="2" />

</Sankey>
