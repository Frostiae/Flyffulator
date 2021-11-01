<template>
  <div class="extensivebasic">
    <h3>{{ title }}</h3>
    <p id="expPerKill"> {{ reward.toFixed(3) }}%</p>
    <h5 id="expPerKillName">at {{ name }} (best value)</h5>
  </div>
</template>

<script>
export default {
  name: 'ExperiencePerKill',
  data() {
    return {
      character: this.$root.character,
      monsters: this.$root.monsters,
      title: 'Experience/Kill',
      reward: 0,
      name: 'N/A'
    }
  },
  created() { this.getBestExp() },
  watch: {
    '$root.monsters'() {
      this.monsters = this.$root.monsters
      this.character = this.$root.character
      this.getBestExp()
    }
  },
  methods: {
    getBestExp() {
      let best = null
      this.monsters.forEach(monster => {
        if (monster.experience > 0) {
          const expReward = this.$root.getExpReward(monster, this.character.level)
          if (best == null || expReward > best.reward) {
            best = {
              name: monster.name.en,
              reward: expReward
            }
          }
        }
      })

      if (best) {
        this.reward = best.reward
        this.name = best.name
      }
    }
  }
}
</script>

<style scoped lang='scss'>

</style>
