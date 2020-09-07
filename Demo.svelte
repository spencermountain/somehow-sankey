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
    <a href="https://github.com/spencermountain/somehow-sankey">
      Somehow-sankey
    </a>
    <br />
    by spencermountain
  </div>

  <Sankey height="800" {fmt}>
    <Col>
      <Node name="Property Taxes" to="Toronto" value="4400" color="sea" />
      <Node name="Province/Fed" to="Toronto" value="2500" color="red" />
      <Node name="TTC Fares" to="Toronto" value="1300" color="sky" />
      <Node name="Fees" to="Toronto" value="900" color="sky" />
      <Node name="Land-transfer" to="Toronto" value="800" color="sky" />
      <Node name="Misc" to="Toronto" value="600" color="sea" />
      <Node name="Investment" to="Toronto" value="300" color="sea" />
      <Node name="Reserves" to="Toronto" value="500" color="sea" />
      <Node name="Transfers" to="Toronto" value="300" color="sea" />
    </Col>
    <Col>
      <Node name="Toronto" value="11600" color="blue" full="87.2" />
    </Col>
  </Sankey>

</div>
