<template>
  <div class="char">
    <h3>Your character</h3>

    <div class="stats">
      <table class="stattable">
        <tbody>

          <tr>
            <td><h5>Class</h5></td>
            <td></td>
            <td>
              <select name="class" @change="$root.updateJob($event)" id="job" v-model="$root.jobName">
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
            </td>
          </tr>

          <tr>
            <td><h5>Level</h5></td>
            <td><h5>{{character.ref.level}}</h5></td>
            <td>
              <button class="btn-plus" @click="newlevel--">-</button>
              <input class="charinput" type="number" v-model="newlevel"/>
              <button class="btn-plus" @click="newlevel++">+</button>
            </td>
          </tr>

          <tr>
            <td><h5>STR</h5></td>
            <td><h5>{{character.ref.str}}</h5></td>
            <td>
              <button class="btn-plus" @click="addstr--">-</button>
              <input class="charinput" type="number" v-model="addstr"/>
              <button class="btn-plus" @click="addstr++">+</button>
            </td>
          </tr>

          <tr>
            <td><h5>STA</h5></td>
            <td><h5>{{character.ref.sta}}</h5></td>
            <td>
              <button class="btn-plus" @click="addsta--">-</button>
              <input class="charinput" type="number" v-model="addsta"/>
              <button class="btn-plus" @click="addsta++">+</button>
            </td>
          </tr>

          <tr>
            <td><h5>DEX</h5></td>
            <td><h5>{{character.ref.dex}}</h5></td>
            <td>
              <button class="btn-plus" @click="adddex--">-</button>
              <input class="charinput" type="number" v-model="adddex"/>
              <button class="btn-plus" @click="adddex++">+</button>
            </td>
          </tr>

          <tr>
            <td><h5>INT</h5></td>
            <td><h5>{{character.ref.int}}</h5></td>
            <td>
              <button class="btn-plus" @click="addint--">-</button>
              <input class="charinput" type="number" v-model="addint"/>
              <button class="btn-plus" @click="addint++">+</button>
            </td>
          </tr>

          <tr>
            <td><h5>Assist buffs</h5></td>
            <td></td>
            <td>
              <input id="buffs" type="checkbox" v-model="assistbuffs">
              <input class="charinput" type="number" v-model="assistint"/>
              int
            </td>
          </tr>

          <tr>
            <td><h5>Class buffs</h5></td>
            <td></td>
            <td>
              <input id="selfbuffs" type="checkbox" v-model="classbuffs">
            </td>
          </tr>

          <tr>
            <td><h5>Stat points</h5></td>
            <td></td>
            <td><h5>{{statpoints}}</h5></td>
          </tr>

        </tbody>
      </table>

      <button id="applystats" class="btn-plus" @click="ApplyStats">Apply</button>
      <button id="restatstats" class="btn-plus" @click="RestatCharacter">Re-Stat</button>
      <button id="resetstats" class="btn-plus" @click="ResetCharacter">Full Reset</button>


    </div>

  </div>
</template>

<script>
import { Vagrant } from '../../calc/jobs';
import { Utils } from '../../calc/utils';
export default {
  name: 'Character',
  data() {
    return {
      character: this.$root.character,
      newlevel: 0,
      addstr: 0,
      addsta: 0,
      adddex: 0,
      addint: 0,
      added: 0,
      assistbuffs: false,
      assistint: 300,
      classbuffs: false,
      statpoints: 0,
      totalstatpoints: 0
    }
  },
  mounted() {
    this.statpoints = this.character.ref.level * 2 - 2;
  },
  methods: {
    ApplyStats() {
      this.character.ref.level = this.newlevel;

      this.character.ref.str += this.addstr;
      this.character.ref.sta += this.addsta;
      this.character.ref.dex += this.adddex;
      this.character.ref.int += this.addint;

      this.added += this.addstr + this.addsta + this.adddex + this.addint;
      Utils.addedStr += this.addstr;
      Utils.addedSta += this.addsta;
      Utils.addedDex += this.adddex;
      Utils.addedInt += this.addint;

      this.addstr = 0;
      this.addsta = 0;
      this.adddex = 0;
      this.addint = 0;

      this.statpoints = this.character.ref.level * 2 - 2 - this.added;
      if (this.statpoints < 0) this.statpoints = 0;
      this.totalstatpoints = this.statpoints;

      this.character.ref.assistInt = this.assistint;
      this.character.ref.assistBuffs = this.assistbuffs;
      this.character.ref.selfBuffs = this.classbuffs;
    },
    ResetCharacter() {
      this.character.ref = new Vagrant();
      this.$root.jobName = "Vagrant";
      this.newlevel = 1;
      this.addstr = 0;
      this.addsta = 0;
      this.adddex = 0;
      this.addint = 0;
      Utils.addedStr = 0;
      Utils.addedSta = 0;
      Utils.addedDex = 0;
      Utils.addedInt = 0;
      this.classbuffs = false;
      this.assistbuffs = false;
      this.assistint = 300;
      this.added = 0;

      this.ApplyStats();
    },
    RestatCharacter() {
      this.addstr = 0;
      this.addsta = 0;
      this.adddex = 0;
      this.addint = 0;
      this.added = 0;
      Utils.addedStr = 0;
      Utils.addedSta = 0;
      Utils.addedDex = 0;
      Utils.addedInt = 0;

      this.ApplyStats();
      this.character.ref.update();
    },
    UpdateStatPoints() {
      this.statpoints = this.totalstatpoints - this.addstr - this.addsta - this.adddex - this.addint;
    }
  },
  watch: {
    addstr() {
      this.UpdateStatPoints();
    },
    addsta() {
      this.UpdateStatPoints();
    },
    adddex() {
      this.UpdateStatPoints();
    },
    addint() {
      this.UpdateStatPoints();
    }
  }
}
</script>

<style scoped lang='scss'>
button#applystats, button#resetstats, button#restatstats {
  margin: 5px 15px 0px 15px;
}
</style>
