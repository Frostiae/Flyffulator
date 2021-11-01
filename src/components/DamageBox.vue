<template>
  <div class="extensivebasic" v-bind:id="active ? 'active' : ''" @click="updateMonsters(skillindex)">
    <h3>{{ title == "N/A" ? skill : title }}</h3>
    <p>{{ damage }}</p>
    <h5>against a Training Dummy</h5>
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
    '$root.character.ref.averageAA'() {
      this.monsters = this.$root.monsters
      this.character = this.$root.character.ref
      this.getDamage()
    },
    '$root.character.ref.skillsDamage'() {
      this.monsters = this.$root.monsters
      this.character = this.$root.character.ref
      this.getDamage()
    },
    '$root.monsters'() {
      if (this.$root.skillIndex != this.skillindex) this.active = false
    }
  },
  methods: {
    getDamage() {
      let focus = this.monsters.find(monster => monster.level >= this.character.level);
      if (focus) {
          this.monster = focus.name.en;
          
          if (this.skillindex == -1 && this.character.averageAA) {
              this.damage = this.character.averageAA.toFixed(0);  
              this.ttk = this.character.ttkMonster(focus).auto.toFixed(0) + 's to kill a ' + this.monster + ' (approximate)';
          } else {
              this.skill = Object.keys(this.character.skillsDamage)[this.skillindex];
              if (this.skill) {
                  this.damage = this.character.skillsDamage[this.skill].toFixed(0) - 20;
              } else this.skill = "None"

              // TODO: change this to react to the return value of character.ttkMonster
              this.ttk = "ttk: N/A"
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
}
</style>
