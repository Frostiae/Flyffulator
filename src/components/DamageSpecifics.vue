<template>
  <div class="extensivebasic">
      <div class="container">
          <div class="infocol">
            <h3>{{ skill }}</h3>
            <div class="infoblock">
                <h3>Average single hit</h3>
                <p>{{ damage }}</p>
            </div>
            <div class="infoblock">
                <h3>Damage Per Second</h3>
                <p>{{ dps }}</p>
            </div>
            <br>
            <h5>against a {{ monster }}</h5>
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
      ttk: 0,
      monster: 'none'
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
    '$root.character.ref.level'() { this.updateDisplay(); }
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
        let focus = this.$root.focusMonster;
        if (focus) {
            this.monster = focus.name.en;

            if (this.$root.skillIndex < 0 || this.$root.skillIndex == null) {
                let damage = this.character.getDamageAgainst(focus);
                this.damage = damage.toFixed(0);
                this.dps = this.character.dps.aa.toFixed(0);
            } else {
                let damage = this.character.getDamageAgainst(focus, this.$root.skillIndex);
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
</style>
