<script>
  import { Sankey, Node, Col } from './src'
  let fmt = num => {
    num = Number(num) * 1000000
    if (num >= 1000000000) {
      num = Math.round(num / 100000000) * 100000000
      num = Math.round(num)
      return String(num / 1000000000) + 'b'
    }
    if (num >= 1000000) {
      num = Math.round(num / 100000) * 100000
      num = Math.round(num)
      return String(num / 1000000) + 'm'
    }
    if (num > 1000) {
      num = Math.round(num / 10000) * 10000
      return String(num / 1000) + 'k'
    }
    return num
  }
</script>

<style>
  .m3 {
    margin: 3rem;
  }
</style>

<div>
  <div class="m3">
    <b>Toronto City Budget</b>
    <br />
    in 2019
  </div>

  <Sankey height="800" {fmt}>
    <Col>
      <Node name="Property Taxes" to="Toronto" value="3950" color="sea" />
      <Node name="Land-transfer" to="Toronto" value="532" color="sea" />
      <Node name="Fees" to="Toronto" value="1870" color="sky" />
      <Node name="Province" to="Toronto" value="1930" color="red" />
    </Col>
    <Col>
      <Node name="Toronto" value="11700" color="blue" />
    </Col>
    <Col>
      <Node name="Police" from="Toronto" value="1130" color="sea" />
      <Node name="TTC" from="Toronto" value="1975" color="#6E9588" />
      <Node name="Fire" from="Toronto" value="479" color="red" />
    </Col>

  </Sankey>

</div>
