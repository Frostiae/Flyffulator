<template>
  <div class="char">
    <h3>Your Equipment</h3>
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
          <td><h5>Armor upgrade</h5></td>
          <td>
            <select v-model="character.armorUpgrade" id="equipment-select" :disabled=!character.armor>
              <option disabled value="">Select an upgrade level...</option>
              <option v-for="(e, i) in 11" :value="i" :key="i">
                +{{ i }}
              </option>
            </select>
          </td>
        </tr>

        <tr>
          <td><h5>Mainhand</h5></td>
          <td>
            <select v-model="character.mainhand" id="equipment-select">
              <option disabled value="">Select a weapon...</option>
              <option v-for="weapon in weapons" :value="weapon" :key="weapon.id">
                Lv. {{ weapon.level }} {{ weapon.name.en }}
              </option>
            </select>
          </td>
          <td></td>
        </tr>

        <tr>
          <td><h5>Mainhand upgrade</h5></td>
          <td>
            <select v-model="character.mainhandUpgrade" id="equipment-select">
              <option disabled value="">Select an upgrade level...</option>
              <option v-for="(e, i) in 11" :value="i" :key="i">
                +{{ i }}
              </option>
            </select>
          </td>
        </tr>

        <tr>
          <td><h5>Offhand</h5></td>
          <td>
            <select v-model="character.offhand" id="equipment-select" :disabled=!canUseOffhand>
              <option disabled value="">Select an offhand...</option>
              <option v-for="offhand in offhands" :value="offhand" :key="offhand.id">
                Lv. {{ offhand.level }} {{ offhand.name.en }}
              </option>
          </select>
          </td>
          <td>
            <button class="btn-plus" @click="character.offhand = null">x</button>
          </td>
        </tr>

        <tr>
          <td><h5>Offhand upgrade</h5></td>
          <td>
            <select v-model="character.offhandUpgrade" id="equipment-select" :disabled=!character.offhand>
              <option disabled value="">Select an upgrade level...</option>
              <option v-for="(e, i) in 11" :value="i" :key="i">
                +{{ i }}
              </option>
            </select>
          </td>
        </tr>

        <tr>
          <td><h5>Earring</h5></td>
          <td>
            <select v-model="character.earringR" id="equipment-select">
              <option disabled value="">Select an earring...</option>
              <option v-for="earring in earrings" :value="earring" :key="earring.id">
                Lv. {{ earring.level }} {{ earring.name.en }}
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
                Lv. {{ earring.level }} {{ earring.name.en }}
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
                Lv. {{ necklace.level }} {{ necklace.name.en }}
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
                Lv. {{ ring.level }} {{ ring.name.en }}
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
                Lv. {{ ring.level }} {{ ring.name.en }}
              </option>
          </select>
          </td>
          <td>
            <button class="btn-plus" @click="character.ringL = null">x</button>
          </td>
        </tr>

        <tr>
          <td><h5>Cloak</h5></td>
          <td>
            <select v-model="character.cloak" id="equipment-select">
              <option disabled value="">Select a cloak...</option>
              <option v-for="cloak in cloaks" :value="cloak" :key="cloak.id">
                {{ cloak.name.en }}
              </option>
            </select>
            {{ getCloakText(character.cloak) }}
          </td>
          <td>
            <button class="btn-plus" @click="character.cloak = null">x</button>
          </td>
        </tr>

        <tr>
          <td><h5>Suit Piercing</h5></td>
          <td>
            <select v-model="character.suitPiercing" id="equipment-select">
              <option disabled value="">Select a card...</option>
              <option v-for="card in piercingCards" :value="card" :key="card.id">
                {{ card.name.en }}
              </option>
          </select>
          </td>
          <td>
            <button class="btn-plus" @click="character.suitPiercing = null">x</button>
          </td>
        </tr>

      </table>
    </div>
  </div>
</template>

<script>
import { Utils } from '../../calc/utils.js'
import { Blade } from '../../calc/jobs.js'

export default {
  name: 'Equipment',
  data() {
    return {
      character: this.$root.character.ref,
      weapons: [],
      armors: [],
      earrings: [],
      necklaces: [],
      rings: [],
      cloaks: [],
      piercingCards: [],
      shields: [],
      offhands: [],
      canUseOffhand: true
    }
  },
  mounted() {
    this.updateEquipment();
    this.earrings = Utils.getJewelery("earring").sort(Utils.sortByName);
    this.rings = Utils.getJewelery("ring").sort(Utils.sortByName);
    this.necklaces = Utils.getJewelery("necklace").sort(Utils.sortByName);
    this.piercingCards = Utils.getPiercingCards().sort(Utils.sortByName);
    this.shields = Utils.getShields().sort(Utils.sortByLevel);
    this.cloaks = Utils.getCloaks().sort(Utils.sortByName);

    this.offhands = [...this.shields];
    if (this.character instanceof Blade) {
      this.offhands = this.offhands.concat(this.weapons);
    }
  },
  methods: {
    updateEquipment() {
      this.weapons = Utils.getJobWeapons(this.character.jobId).sort(Utils.sortByLevel);
      this.armors = Utils.getJobArmors(this.character.jobId).sort(Utils.sortByName);

      // Blades can use a shield or a weapon in their offhand
      if (this.character instanceof Blade) {
        this.offhands = [];
        this.offhands = [...this.shields];
        this.offhands = this.offhands.concat(this.weapons);
      }
    },
    applyEquip(equipment) {
      setTimeout(() => {
        this.character.armor = this.byId(this.armors, equipment.armor);
        this.character.armorUpgrade = equipment.armorUpgrade;
        this.character.mainhandUpgrade = equipment.mainhandUpgrade;
        this.character.offhandUpgrade = equipment.offhandUpgrade;
        this.character.mainhand = this.byId(this.weapons, equipment.mainhand) || Utils.getItemByName("Wooden Sword");
        
        this.character.offhand = this.byId(this.offhands.concat(this.weapons), equipment.offhand);
        this.character.earringR = this.byId(this.earrings, equipment.earringR);
        this.character.earringL = this.byId(this.earrings, equipment.earringL);
        this.character.necklace = this.byId(this.necklaces, equipment.necklace);
        this.character.ringR = this.byId(this.rings, equipment.ringR);
        this.character.ringL = this.byId(this.rings, equipment.ringL);
        this.character.cloak = this.byId(this.cloaks, equipment.cloak);
        this.character.suitPiercing = this.byId(this.piercingCards, equipment.suitPiercing);
      }, 10);
    },
    byId(arr, id) {
      let obj = arr.find(o => o.id == id);
      return obj ?? null;
    },
    getCloakText(cloak) {
      let text = "";
      if(cloak) {
        //text = cloak.name.en + " (";
        cloak.abilities.forEach(ability => {
          let effect = " ";
          effect += ability.parameter;
          let add = ability.add;
          effect += "+" + add;
          if (ability.rate) effect += "%";
          effect += " ";
          text += effect;
        });
        //text += ")";   
      }
      return text;
    }
  },
  watch: {
    '$root.character.ref'() {
      this.character = this.$root.character.ref;
      this.updateEquipment();
    },
    '$root.character.ref.mainhand'() {
      if (this.character.mainhand.twoHanded) {
        this.canUseOffhand = false;
        this.character.offhand = null;
      } else {
        this.canUseOffhand = true;
      }
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

select:disabled {
  opacity: 0.3;
}

button.btn-plus {
  padding: 0px 5px;
}
</style>
