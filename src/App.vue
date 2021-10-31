<template>
  <leftbar/>

  <rightbar/>
</template>

<script>
/* eslint-disable */
import ExperiencePerKill from './components/ExperiencePerKill.vue'
import Leftbar from './components/Leftbar.vue'
import Rightbar from './components/Rightbar.vue'

export default {
  name: 'App',
  components: {
    ExperiencePerKill,
    Leftbar,
    Rightbar
  },
  data() {
    return {
      character: {
        level: 0,
        str: 0,
        sta: 0,
        dex: 0,
        int: 0,
        remainingPoints: 15,
        assistInt: 300,
        health: 0,
        mp: 0,
        fp: 0,
        attack: 0,
        aspd: 0,
        hitrate: 0,
        criticalChance: 0,
        criticalDamage: 0,
        defense: 0,
        parry: 0,
      }
    }
  }
}
</script>

<style lang='scss'>
* {
  box-sizing: border-box;
  margin: 0;
}

body, html {
  background:
    radial-gradient(
    ellipse at top left,
    #252849 40%,
    #1c1e3a 100%
    );
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
  width: 100vh;
  overflow-x: hidden;
}
</style>
