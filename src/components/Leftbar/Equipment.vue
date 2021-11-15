<template>
  <div class="char">
    <h3>Equipment</h3>
    <div class="stats">

      <div class="titles">
        <h5>Armor set</h5>
        <h5>Weapon</h5>
      </div>

      <div class="values">
        <select v-model="character.armor" id="equipment-select">
          <option disabled value="">Select an armor set...</option>
          <option v-for="set in armors" :value="set" :key="set.id">
            {{ set.name.en }}
          </option>
        </select>
        
        <select v-model="character.weapon" id="equipment-select">
          <option disabled value="">Select a weapon...</option>
          <option v-for="weapon in weapons" :value="weapon" :key="weapon.id">
            {{ weapon.name.en }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script>
import { Utils } from '../../calc/utils.js'

export default {
  name: 'Equipment',
  data() {
    return {
      character: this.$root.character.ref,
      weapons: [],
      armors: []
    }
  },
  mounted() {
    this.updateEquipment();
  },
  methods: {
    updateEquipment() {
      const jobId = Utils.getJobId(Object.getPrototypeOf(this.character).constructor.name);
      this.weapons = Utils.getJobWeapons(jobId);
      this.armors = Utils.getJobArmors(jobId);
    }
  },
  watch: {
    '$root.character.ref'() {
      this.character = this.$root.character.ref;
      this.updateEquipment();
    }
  }
}
</script>

<style scoped lang='scss'>
input[type=text] {
  width: auto;
  color: v-bind('$root.pcolor');
  border-radius: 10px;
  margin: auto 10px;
}

select#equipment-select {
  color: v-bind('$root.pcolor');
  margin-right: 20px;
  width: 140px;
  text-align: center;
}
</style>
