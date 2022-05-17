<template>
  <div class="char">
    <h3>Active Buffs</h3>
    <h5>Add buffs through the 'Your Character' module</h5>
    <div class="stats">
      <ul>
        <li v-for="buff in buffs" :value="buff" :key="buff.id">
          <input type="checkbox" name="enable-buff" id="enable-buff" v-model="buff.enabled" @change="reloadBuffs">
          <img :src="$root.getSkillIconUrl(buff.icon)" alt="" :title="getTooltip(buff)" :class="{'disabled' : buff.enabled == false }">
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
      this.buffs = this.character.activeBuffs;
    },
    reloadBuffs() {
      this.character.update();
    },
    getTooltip(buff) {
      let tooltip = buff.name.en + "\n";
      const level = buff.levels[buff.levels.length - 1];
      if (level.abilities) {
        level.abilities.forEach(ability => {
          let effect = "";
          effect += ability.parameter;
          let add = ability.add;
          if (level.scalingParameters) {
            level.scalingParameters.forEach(scaling => {
              if (scaling.parameter == ability.parameter) {
                let extra = this.character.assistInt * scaling.scale;
                if (extra > scaling.maximum) extra = scaling.maximum;
                add += extra;
              }
            });
          }
          effect += "+" + add;
          if (ability.rate) effect += "%";
          effect += "\n";
          tooltip += effect;
        });
      }

      return tooltip;
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
    },
    '$root.character.ref.activeBuffs'() {
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

li {
  position: relative;
}

h5 {
  opacity: 0.5;
  margin: 0;
  margin-bottom: 20px;
}

input[type=checkbox] {
  position: absolute;
  opacity: 0.8;
  z-index: 200;
}

img {
  transition: 0.2s;
  
  &.disabled {
    opacity: 0.2;
    transition: 0.2s;
  }
}
</style>
