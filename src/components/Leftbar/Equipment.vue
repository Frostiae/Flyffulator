<template>
  <div class="char">
    <h3>Equipment</h3>
    <div class="stats">

      <div class="titles">
        <h5>Armor set</h5>
        <h5>Weapon</h5>
      </div>

      <div class="values">
        <p class="equip" v-cloak>{{ character.armor ? character.armor.name.en : "None" }}</p>
        <p class="equip" v-cloak>{{ character.weapon ? character.weapon.name.en : "None" }}</p>
      </div>
    </div>
    <h5 style="opacity: 0.5;">These values cannot be changed on the web version of this calculator. If you would like to experiment with specific equipment, there will be an executable desktop application soon.</h5>
  </div>
</template>

<script>
export default {
  name: 'Equipment',
  data() {
    return {
      character: this.$root.character
    }
  }
}
</script>

<style scoped lang='scss'>

</style>
