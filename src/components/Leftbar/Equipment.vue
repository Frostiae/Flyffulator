<template>
  <div class="char">
    <h3>Equipment</h3>
    <div class="stats">
      <table class="stattable">

        <tr>
          <td><h5>Armor set</h5></td>
          <td>
            <select v-model="character.armor" id="equipment-select">
              <option disabled value="">Select an armor set...</option>
              <option v-for="set in armors" :value="set" :key="set.id">
                {{ set.name.en }}
              </option>
            </select>
          </td>
          <td>
            <button class="btn-plus" @click="character.armor = null">x</button>
          </td>
        </tr>

        <tr>
          <td><h5>Weapon</h5></td>
          <td>
            <select v-model="character.weapon" id="equipment-select">
              <option disabled value="">Select a weapon...</option>
              <option v-for="weapon in weapons" :value="weapon" :key="weapon.id">
                {{ weapon.name.en }}
              </option>
            </select>
          </td>
          <td></td>
        </tr>

        <tr>
          <td><h5>Earring</h5></td>
          <td>
            <select v-model="character.earringR" id="equipment-select">
              <option disabled value="">Select an earring...</option>
              <option v-for="earring in earrings" :value="earring" :key="earring.id">
                {{ earring.name.en }}
              </option>
            </select>
          </td>
          <td>
            <button class="btn-plus" @click="character.earringR = null">x</button>
          </td>
        </tr>

        <tr>
          <td><h5>Earring</h5></td>
          <td>
            <select v-model="character.earringL" id="equipment-select">
              <option disabled value="">Select an earring...</option>
              <option v-for="earring in earrings" :value="earring" :key="earring.id">
                {{ earring.name.en }}
              </option>
            </select>
          </td>
          <td>
            <button class="btn-plus" @click="character.earringL = null">x</button>
          </td>
        </tr>

        <tr>
          <td><h5>Necklace</h5></td>
          <td>
            <select v-model="character.necklace" id="equipment-select">
              <option disabled value="">Select a necklace...</option>
              <option v-for="necklace in necklaces" :value="necklace" :key="necklace.id">
                {{ necklace.name.en }}
              </option>
            </select>
          </td>
          <td>
            <button class="btn-plus" @click="character.necklace = null">x</button>
          </td>
        </tr>

        <tr>
          <td><h5>Ring</h5></td>
          <td>
            <select v-model="character.ringR" id="equipment-select">
              <option disabled value="">Select a ring...</option>
              <option v-for="ring in rings" :value="ring" :key="ring.id">
                {{ ring.name.en }}
              </option>
            </select>
          </td>
          <td>
            <button class="btn-plus" @click="character.ringR = null">x</button>
          </td>
        </tr>

        <tr>
          <td><h5>Ring</h5></td>
          <td>
            <select v-model="character.ringL" id="equipment-select">
              <option disabled value="">Select a ring...</option>
              <option v-for="ring in rings" :value="ring" :key="ring.id">
                {{ ring.name.en }}
              </option>
          </select>
          </td>
          <td>
            <button class="btn-plus" @click="character.ringL = null">x</button>
          </td>
        </tr>

      </table>
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
      armors: [],
      earrings: [],
      necklaces: [],
      rings: []
    }
  },
  mounted() {
    this.updateEquipment();
    this.earrings = Utils.getJewelery("earring");
    this.rings = Utils.getJewelery("ring");
    this.necklaces = Utils.getJewelery("necklace");
  },
  methods: {
    updateEquipment() {
      // const jobName = this.character.constructor.name; // This does not work on build... returns 'a'?;
      this.weapons = Utils.getJobWeapons(this.character.jobId);
      this.armors = Utils.getJobArmors(this.character.jobId);
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

button.btn-plus {
  padding: 0px 5px;
}
</style>
