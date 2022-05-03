<template>
  <div class="rightpanel">
    <div class="panelcontent" id="outputstats">
      <h5>Max Health</h5>
      <p v-cloak>{{ character.ref.health || "N/A" }}</p>
      <h5>Max MP</h5>
      <p v-cloak>{{ character.ref.mp || "N/A" }}</p>
      <h5>Max FP</h5>
      <p v-cloak>{{ character.ref.fp || "N/A" }}</p>
      <h5>Speed</h5>
      <p>100%</p>
      <h5>Casting Speed</h5>
      <p v-cloak>{{ character.ref.DCT }}%</p>
      <hr>
      <h5>Attack</h5>
      <p v-cloak>{{ character.ref.attack.toFixed(0) || "N/A" }}</p>
      <h5>Attack Speed</h5>
      <p v-cloak>{{ character.ref.aspd + '%' || "N/A" }}</p>
      <h5>Hit Rate</h5>
      <p v-cloak>{{ character.ref.hitrate + '%' || "N/A" }}</p>
      <h5>Critical Chance</h5>
      <p v-cloak>{{ character.ref.criticalChance + '%' || "N/A" }}</p>
      <h5>Critical Damage</h5>
      <p v-cloak>{{ character.ref.criticalDamage || "N/A" }}%</p>
      <hr>
      <h5>Defense</h5>
      <p v-cloak>{{ character.ref.defense || "N/A" }}</p>
      <h5>Parry</h5>
      <p v-cloak>{{ character.ref.parry + '%' || "N/A" }}</p>
      <h5>Melee Block</h5>
      <p v-cloak>{{ character.ref.meleeBlock + '%' || "N/A" }}</p>
      <h5>Ranged Block</h5>
      <p v-cloak>{{ character.ref.rangedBlock + '%' || "N/A" }}</p>
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
  right: 0;
  top: 0;
  border-radius: 15px 0px 0px 15px;
  width: 22vw;
  max-width: 330px;
  min-width: 180px;
  text-align: center;
  font-weight: 500;
  transition: 0.3s;
}
</style>
