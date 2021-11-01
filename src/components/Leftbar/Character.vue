<template>
  <div class="char">
    <h3>Your character</h3>
    <div class="stats">

      <div class="titles">
        <h5>Class</h5>
        <h5>Level</h5>
        <h5>STR</h5>
        <h5>STA</h5>
        <h5>DEX</h5>
        <h5>INT</h5>
        <h5>Assist buffs</h5>
        <h5>Stat points</h5>
      </div>

      <div class="values">
        <span class="value">
          <select name="class" @change="$root.updateJob($event)" id="job">
            <option value="Vagrant">Vagrant</option>
            <option value="Assist">Assist</option>
            <option value="Billposter">Billposter</option>
            <option value="Ringmaster">Ringmaster</option>
            <option value="Acrobat">Acrobat</option>
            <option value="Jester">Jester</option>
            <option value="Ranger">Ranger</option>
            <option value="Magician">Magician</option>
            <option value="Psykeeper">Psykeeper</option>
            <option value="Elementor">Elementor</option>
            <option value="Mercenary">Mercenary</option>
            <option value="Blade">Blade</option>
            <option value="Knight">Knight</option>
          </select>
        </span>

        <span class="value">
          <button class="btn-plus" @click="character.level--">-</button>
          <input class="charinput" type="number" v-model="character.level"/>
          <button class="btn-plus" @click="character.level++">+</button>
        </span>

        <span class="value">
          <button class="btn-plus" @click="character.str--">-</button>
          <input class="charinput" type="number" v-model="character.str"/>
          <button class="btn-plus" @click="character.str++">+</button>
        </span>

        <span class="value">
          <button class="btn-plus" @click="character.sta--">-</button>
          <input class="charinput" type="number" v-model="character.sta"/>
          <button class="btn-plus" @click="character.sta++">+</button>
        </span>

        <span class="value">
          <button class="btn-plus" @click="character.dex--">-</button>
          <input class="charinput" type="number" v-model="character.dex"/>
          <button class="btn-plus" @click="character.dex++">+</button>
        </span>

        <span class="value">
          <button class="btn-plus" @click="character.int--">-</button>
          <input class="charinput" type="number" v-model="character.int"/>
          <button class="btn-plus" @click="character.int++">+</button>
        </span>

        <span class="value">
          <label for="buffs"></label>
          <input id="buffs" type="checkbox" @change="character.applyAssistBuffs($event.target.checked)">
          <input class="charinput" type="number" v-model="character.assistInt"/>
          <h5 style="color: #7279AA;">int</h5>
        </span>
        
        <p id="statpoints" v-cloak>{{ character.remainingPoints }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Character',
  data() {
    return {
      character: this.$root.character
    }
  }
}
</script>

<style scoped lang='scss'>

</style>
