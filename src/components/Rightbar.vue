<template>
  <div class="rightpanel">
    <div class="panelcontent" id="outputstats">
      <h5>Max Health</h5>
      <p v-cloak>{{ character.health || "N/A" }}</p>
      <h5>Max MP</h5>
      <p v-cloak>{{ character.mp || "N/A" }}</p>
      <h5>Max FP</h5>
      <p v-cloak>{{ character.fp || "N/A" }}</p>
      <h5>Speed</h5>
      <p>100%</p>
      <hr>
      <h5>Attack</h5>
      <p v-cloak>{{ character.attack.toFixed(0) || "N/A" }}</p>
      <h5>Attack Speed</h5>
      <p v-cloak>{{ character.aspd + '%' || "N/A" }}</p>
      <h5>Hit Rate</h5>
      <p v-cloak>{{ character.hitrate + '%' || "N/A" }}</p>
      <h5>Critical Chance</h5>
      <p v-cloak>{{ character.criticalChance + '%' || "N/A" }}</p>
      <h5>Critical Damage</h5>
      <p v-cloak>{{ character.criticalDamage || "N/A" }}</p>
      <hr>
      <h5>Defense</h5>
      <p v-cloak>{{ character.defense || "N/A" }}</p>
      <h5>Parry</h5>
      <p v-cloak>{{ character.parry + '%' || "N/A" }}</p>
      <h5>Melee Block</h5>
      <p>N/A</p>
      <h5>Ranged Block</h5>
      <p>N/A</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Rightbar',
  data() {
    return {
      character: this.$root.character
    }
  },
  components: {
  }
}
</script>

<style lang='scss'>
.rightpanel {
  position: fixed;
  height: 100%;
  overflow-x: hidden;
  background-color: #1F2342;
  right: 0;
  top: 0;
  border-radius: 15px 0px 0px 15px;
  width: 290px;
  text-align: center;
  font-weight: 500;
}
</style>
