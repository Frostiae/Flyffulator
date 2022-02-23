<template>
  <div class="extensivebasic">
      <div class="container">
          <div class="infocol">
            <h3>{{ skill }}</h3>

            <select v-model="$root.focusMonster" id="equipment-select">
              <option disabled value="">Select a monster...</option>
              <option v-for="monster in monsters" :value="monster" :key="monster.id">
                {{ monster.name.en }}
              </option>
            </select>

            <div class="infoblock">
                <h3>Average single hit</h3>
                <p>{{ damage }}</p>
            </div>
            <div class="infoblock">
                <h3>Damage Per Second</h3>
                <p>{{ dps }}</p>
            </div>
            <br>
          </div>
      </div>
  </div>
</template>

<script>
export default {
  name: 'DamageSpecifics',
  data() {
    return {
      character: this.$root.character.ref,
      monsters: this.$root.monsters,
      skill: 'none',
      damage: 0,
      dps: 0,
      ttk: 0
    }
  },
  created() {
    this.updateDisplay()
  },
  watch: {
    '$root.skillIndex'() { 
        this.updateDisplay();
    },
    '$root.monsters'() { 
        this.monsters = this.$root.monsters;
        this.updateDamage();
    },
    '$root.character.ref.level'() { this.updateDisplay(); },
    '$root.focusMonster'() { this.updateDamage(); }
  },
  methods: {
    updateDisplay() {
        this.updateDamage();
        this.character = this.$root.character.ref;
        const skill = this.character.constants.skills[this.$root.skillIndex]
        if (skill) {
            this.skill = skill.name.en;
        } else {
            this.skill = "Auto Attack";
        }
    },
    updateDamage() {
        if (this.$root.focusMonster) {

            if (this.$root.skillIndex < 0 || this.$root.skillIndex == null) {
                let damage = this.character.getDamage(this.$root.focusMonster);
                this.damage = damage.toFixed(0);
                this.dps = this.character.dps.aa.toFixed(0);
            } else {
                let damage = this.character.getDamage(this.$root.focusMonster, this.$root.skillIndex);
                this.damage = damage.toFixed(0);
                this.dps = this.character.dps[this.$root.skillIndex].toFixed(0);
            }
        }
    }
  }
}
</script>

<style scoped lang='scss'>
.extensivebasic {
    height: 350px !important;
    width: 200px !important;
}

.extensivebasic:hover {
    cursor: pointer !important;
}

select {
  background: none;
  color: #DADEEF;
  margin: 3px 20px;
  font-weight: 500;
  border: 1px solid #5975cf00;
  border-radius: 15px;
  transition: 0.3s;
  width: 100%;
  text-overflow: ellipsis;
}

select:active {
  background-color: white;
}

select:hover {
  border: 1px solid #5975cf;
  box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.307);
  transition: 0.3s;
  cursor: pointer;
}

select#equipment-select {
  color: v-bind('$root.pcolor');
  width: 140px;
  text-align: left;
}

.extensivebasic:hover {
  transform: scale(1) !important;
}

.extensivebasic {
  transform: scale(1) !important;
}
</style>
