<template>
  <div class="extensivebasic" v-bind:id="active ? 'active' : ''" @click="updateMonsters(skillindex)">
    <h3>{{ title == "N/A" ? skill : title }}</h3>
    <p>{{ damage }}</p>
    <h5 style="opacity: 0.5;">against a Training Dummy</h5>
    <h5>{{ ttk }}</h5>
  </div>
</template>

<script>
export default {
  name: 'DamageBox',
  props: ['title', 'skillindex'],
  data() {
    return {
      character: this.$root.character.ref,
      monsters: this.$root.monsters,
      skill: 'none',
      damage: 0,
      ttk: 0,
      monster: 'none',
      active: false,
    }
  },
  created() {
    this.getDamage()
    if (this.skillindex == -1) this.active = true 
  },
  watch: {
    '$root.character.ref.skillsRawDamage'() {
      this.monsters = this.$root.monsters
      this.character = this.$root.character.ref
      this.getDamage()
    },
    '$root.monsters'() {
      if (this.$root.skillIndex != this.skillindex) this.active = false
    },
    '$root.focusMonster'() { this.getDamage(); }
  },
  methods: {
    getDamage() {
      let focus = this.$root.focusMonster;
      if (focus) {
          this.monster = focus.name.en;
          const ttk = this.character.ttkMonster(focus)
          
          if (this.skillindex == -1) {
              this.damage = this.character.getDamage().toFixed(0);
              this.ttk = `Average of ${ttk.auto.toFixed(0)}s to kill a ${this.monster}`;
          } else {
              this.skill = Object.keys(this.character.skillsRawDamage)[this.skillindex];
              if (this.skill) {
                  this.damage = this.character.getDamage(null, this.skillindex).toFixed(0);
              } else {
                this.skill = "None"
                this.damage = "N/A"
              }

              this.ttk = "ttk: N/A"
              if (this.skillindex == 0 && ttk.skill1) this.ttk = `Average of ${ttk.skill1.toFixed(0)}s to kill a ${this.monster}`;
              if (this.skillindex == 1 && ttk.skill2) this.ttk = `Average of ${ttk.skill2.toFixed(0)}s to kill a ${this.monster}`;
              if (this.skillindex == 2 && ttk.skill3) this.ttk = `Average of ${ttk.skill3.toFixed(0)}s to kill a ${this.monster}`;
          }
      }
    },
    updateMonsters(index) {
      this.active = true
      this.$root.updateMonsters(index)
    },
  }
}
</script>

<style scoped lang='scss'>
.extensivebasic#active {
  box-shadow: #ffffff1e 0px 0px 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}
</style>
