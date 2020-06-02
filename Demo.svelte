<script>
  import { Sankey, Node, Col } from './src'
</script>

<Sankey height="800">
  <Col>
    <Node name="Toronto" to="Ontario" value="6" color="sky" />
    <Node name="Ottawa" to="Ontario" value="1" color="sky" />
    <Node name="Montreal" to="Quebec" value="4" color="mud" />
  </Col>

  <Col>
    <Node name="Ontario" to="Canada" value="14" color="sky" />
    <Node name="Quebec" to="Canada" value="8" color="mud" />

  </Col>

  <Col>
    <Node name="Canada" color="red" />
  </Col>

</Sankey>
