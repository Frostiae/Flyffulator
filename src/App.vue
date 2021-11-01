<template>
  <div class="mainpage">
    <leftbar/>
    
    <div class="content">

      <div class="basestats">
        <img src="./assets/images/woodensword.png"/>
        <top-stats/>
      </div>

      <div class="extensivestats">
        <h3>Leveling</h3>
        <div class="extensiverow">
          <experience-per-kill/>
          <kills-per-level/>
          <exp-hp-ratio/>
        </div>
      </div>
    </div>

    <rightbar/>
  </div>
</template>

<script>
/* eslint-disable */
import ExperiencePerKill from './components/ExperiencePerKill.vue'
import KillsPerLevel from './components/KillsPerLevel.vue'
import ExpHpRatio from './components/ExpHpRatio.vue'
import TopStats from './components/TopStats.vue'
import Leftbar from './components/Leftbar.vue'
import Rightbar from './components/Rightbar.vue'
import { Utils } from './calc/utils.js'

const utils = new Utils()

export default {
  name: 'App',
  components: {
    ExperiencePerKill,
    TopStats,
    KillsPerLevel,
    ExpHpRatio,
    Leftbar,
    Rightbar
  },
  data() {
    return {
      character: utils.character.update(),
      monsters: utils.getMonstersAtLevel(utils.character.level),
      skillIndex: null
    }
  },
  watch: {
    'character.level'() {
      this.updateCharacter()
    },
    'character.str'() {
      this.updateCharacter();
    },
    'character.sta'() {
      this.updateCharacter();
    },
    'character.dex'() {
      this.updateCharacter();
    },
    'character.int'() {
      this.updateCharacter();
    },
    'character.assistInt'() {
      this.updateCharacter();
    }
  },
  methods: {
    getExpReward(monster, level) {
      for (let value of monster.experienceTable) {
        if (value == monster.experience) {
          // Value is the experience we get at the same level
          let index = monster.experienceTable.indexOf(value);
          let levelDifference = monster.level - level;
          let newIndex = index - levelDifference < 0 ? 0 : index - levelDifference;
          
          return monster.experienceTable[newIndex];
        }
      }
    },
    updateCharacter() {
      validateInput(this.character)
      this.character.update()
      this.monsters = utils.getMonstersAtLevel(this.character.level, this.skillIndex)
    },
  }
}

function validateInput(character) {
  character.level = character.level < 1 ? 1 : character.level;
  character.str = character.str < 1 ? 1 : character.str;
  character.sta = character.sta < 1 ? 1 : character.sta;
  character.dex = character.dex < 1 ? 1 : character.dex;
  character.int = character.int < 1 ? 1 : character.int;
  character.assistInt = character.assistInt < 1 ? 1 : character.assistInt;
}
</script>

<style lang='scss'>
* {
  box-sizing: border-box;
}

.mainpage {
  height: 100vh;
  width: 100vw;
}

body, html {
  background:
    radial-gradient(
    ellipse at top left,
    #252849 40%,
    #1c1e3a 100%
    );
  overflow: hidden;
}

hr {
  border-color: #7279AA;
  margin: 8px;
}

p {
  color: #DADEEF;
  margin: 3px;
}

h1, h2, h3, h4, h5 {
  color: #7279AA;
  font-weight: 500;
  margin-bottom: 8px;
}

h5 {
  margin: 3px;
}

ul {
  font-size: 13px;
  color: #7279AA;
  font-weight: 500;
}

img#bg-radial {
  position: absolute;
  width: 550px;
  display: block;
  margin-right: 50%;
  margin-left: 20%;
  margin-top: -120px;
  opacity: 0.8;
  z-index: 0;
}

option {
  color: black;
}

.content {
  display: flex;
  flex-direction: column;
  padding-top: 20px;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100vh;
  margin-left: 290px;
  margin-right: 290px;

  .basestats {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;

    img {
      width: 313px;
      height: 313px;
    }
  }

  .extensivestats {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    margin: 30px;
    margin-top: -20px;
    padding-bottom: 20px;

    .extensiverow {
      display: flex;
      flex-direction: row;
      margin-top: 10px;
      padding-bottom: 10px;

      .extensivebasic {
        display: flex;
        flex-direction: column;
        background-color: #2E325C;
        width: 200px;
        height: 180px;
        border-radius: 20px;
        box-shadow: #0000001e 0px 5px 5px;
        transition: 0.3s;
        margin-right: 10px;

        p {
          font-size: 35px;
          font-weight: 500;
          margin-left: 20px;
        }

        h3, h5 {
          margin-left: 20px;
        }
      }

      .extensivechart {
        background-color: #2E325C;
        height: 180px;
        width: 300px;
        border-radius: 20px;
        box-shadow: #0000001e 0px 5px 5px;
        transition: 0.3s;
        margin-right: 10px;

        #big {
          background-color: #2E325C;
          height: 400px;
          width: 820px;
          border-radius: 20px;
          box-shadow: #0000001e 0px 5px 5px;
          transition: 0.3s;
          margin-right: 10px;
        }

        #big:hover {
          box-shadow: #0000001e 0px 10px 20px;
          transition: 0.3s;
        }
      }

      .extensivechart#hover {
        box-shadow: #0000001e 0px 10px 20px;
        transition: 0.3s;
      }

      .extensivebasic:hover {
        box-shadow: #0000001e 0px 10px 20px;
        transition: 0.3s;
        width: 205px;
        cursor: pointer;
      }
    }
  }
}

input[type=number] {
  -moz-appearance: textfield;
  appearance: textfield;
  background: none;
  border:none;
  width: 50px;
  text-align: center;
  color: #DADEEF;
  font-weight: 500;
  font-family: 'Roboto';
  margin: 2px;
}

.tooltip {
  position: absolute;
  background-color: #DADEEF;
  border-radius: 10px;
  width: 275px;
  box-shadow: 3px 3px 10px rgba(0, 0, 0, 0.407);
  color: #5975cf;
  padding: 15px;
  z-index: 99;
}

p#info {
  display: none;
}

.info-tooltip {
  position: absolute;
  right: 0;
  margin-right: 20px;
  margin-top: 22px;
  transition: 0.3s;
  border-radius: 15px;
  width: 22px;
  opacity: 0.8;
  z-index: 99;
}

.info-tooltip:hover {
  box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.307);
  opacity: 0.5;
  transition: 0.3s;
}

input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
}

input[type=checkbox]#buffs {
  align-self: center;
}

#app {
  font-family: 'Roboto', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
  width: 100vw;
  overflow-x: hidden;
}
</style>
