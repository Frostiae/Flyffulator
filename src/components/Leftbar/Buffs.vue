<template>
  <div class="char">
    <h3>Active Buffs</h3>
    <h5>Add buffs through the 'Your Character' module</h5>
    <div class="stats">
      <ul>
        <li v-for="buff in buffs" :value="buff" :key="buff.id">
              <img :src="$root.getSkillIconUrl(buff.icon)" alt="" :title="buff.name.en">
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Buffs',
  data() {
    return {
      character: this.$root.character.ref,
      buffs: []
    }
  },
  mounted() {
    this.updateBuffs();
  },
  methods: {
    updateBuffs() {
      this.buffs = [];
      this.buffs = this.character.activeSelfBuffs.concat(this.character.activeAssistBuffs);
    }
  },
  watch: {
    '$root.character.ref.activeAssistBuffs'() {
      this.character = this.$root.character.ref;
      this.updateBuffs();
    },
    '$root.character.ref.activeSelfBuffs'() {
      this.character = this.$root.character.ref;
      this.updateBuffs();
    }
  }
}
</script>

<style scoped lang='scss'>
ul {
    list-style: none;
    padding: 10px;
    width: 100%;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
}

h5 {
  opacity: 0.5;
  margin: 0;
  margin-bottom: 20px;
}
</style>
