<template>
  <div class="char">
    <h3>Premium Items</h3>
    <h5>Add premium items through the 'Your Character' module</h5>
    <div class="stats">
      <ul>
        <li v-for="premiumItem in premiumItems" :value="premiumItem" :key="premiumItem.id">
          <input type="checkbox" name="enable-premiumItem" id="enable-premiumItem" v-model="premiumItem.enabled" @change="reloadPremiumItems">
          <img :src="$root.getIconUrl(premiumItem.icon)" alt="" :title="getTooltip(premiumItem)" :class="{'disabled' : premiumItem.enabled == false }">
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Premiumitems',
  data() {
    return {
      character: this.$root.character.ref,
      premiumItems: []
    }
  },
  mounted() {
    this.updatePremiumItems();
  },
  methods: {
    updatePremiumItems() {
      this.premiumItems = [];
      this.premiumItems = this.character.activePremiumItems;
    },
    reloadPremiumItems() {
      this.character.update();
    },
    getTooltip(premiumItem) {
      let tooltip = premiumItem.name.en + "\n";
      if(premiumItem.abilities) {
        premiumItem.abilities.forEach(ability => {
          let effect = "";
          effect += ability.parameter;
          let add = ability.add;
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
    '$root.character.ref.activePremiumItems'() {
      this.character = this.$root.character.ref;
      this.updatePremiumItems();
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
