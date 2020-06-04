<script>
  import { Sankey, Node, Col } from './src'
</script>

<Sankey height="800">

  <Col>
    <Node name="Toronto" to="Greater Toronto" value="3" color="sky" />
    <Node name="scarburough" to="Greater Toronto" value="0.6" color="sky" />
    <Node name="Montreal" to="Greater Montreal" value="1.7" color="mud" />
    <Node name="Longueuil" to="Greater Montreal" value="2.2" color="mud" />
  </Col>
  <Col>
    <Node name="Greater Toronto" to="Ontario" value="6" color="sky" />
    <Node name="Ottawa" to="Ontario" value="1" color="sky" />
    <Node name="Greater Montreal" to="Quebec" value="4" color="mud" />
    <Node name="Vancouver" to="B.C." value="2.4" color="burn" />
    <Node name="Calgary" to="Alberta" value="1.3" color="greygreen" />
  </Col>
  <Col>
    <Node name="Ontario" to="Canada" value="14" color="sky" col={1} />
    <Node name="Quebec" to="Canada" value="8" color="mud" col={1} />
    <Node name="B.C." to="Canada" value="5" color="burn" col={1} />
    <Node name="Alberta" to="Canada" value="4" col={1} color="greygreen" />
    <Node name="Nova Scota" to="Canada" value="1" col={1} />
    <Node name="Manitoba" to="Canada" value="1" col={1} />
    <Node name="Saskatchewan" to="Canada" value="1" col={1} />
    <Node name="rest" to="Canada" value={1} col={1} />
  </Col>

  <Col>
    <Node name="Canada" color="red" dy="20" />
  </Col>
</Sankey>
