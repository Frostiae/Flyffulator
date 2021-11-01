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
          <button class="btn-plus" @click="character.ref.level--">-</button>
          <input class="charinput" type="number" v-model="character.ref.level"/>
          <button class="btn-plus" @click="character.ref.level++">+</button>
        </span>

        <span class="value">
          <button class="btn-plus" @click="character.ref.str--">-</button>
          <input class="charinput" type="number" v-model="character.ref.str"/>
          <button class="btn-plus" @click="character.ref.str++">+</button>
        </span>

        <span class="value">
          <button class="btn-plus" @click="character.ref.sta--">-</button>
          <input class="charinput" type="number" v-model="character.ref.sta"/>
          <button class="btn-plus" @click="character.ref.sta++">+</button>
        </span>

        <span class="value">
          <button class="btn-plus" @click="character.ref.dex--">-</button>
          <input class="charinput" type="number" v-model="character.ref.dex"/>
          <button class="btn-plus" @click="character.ref.dex++">+</button>
        </span>

        <span class="value">
          <button class="btn-plus" @click="character.ref.int--">-</button>
          <input class="charinput" type="number" v-model="character.ref.int"/>
          <button class="btn-plus" @click="character.ref.int++">+</button>
        </span>

        <span class="value">
          <label for="buffs"></label>
          <input id="buffs" type="checkbox" @change="character.ref.applyAssistBuffs($event.target.checked)">
          <input class="charinput" type="number" v-model="character.ref.assistInt"/>
          <h5 style="color: #7279AA;">int</h5>
        </span>
        
        <p id="statpoints" v-cloak>{{ character.ref.remainingPoints }}</p>
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
