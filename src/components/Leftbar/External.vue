<template>
  <div class="char">
    <h3>External</h3>
    <div class="stats">

      <div class="titles">
        <button class="btn-plus" @click="importCharacter">Import</button>
        <button class="btn-plus" @click="exportCharacter">Export</button>
      </div>

      <div class="values">
        <input type="text" v-model="importCode" placeholder="character code">
        <input type="text" v-model="exportCode" placeholder="generated code">
      </div>
    </div>

  </div>
</template>

<script>
import { Utils } from '../../calc/utils.js'

export default {
  name: 'Externals',
  data() {
      return {
          importCode: null,
          exportCode: null
      }
  },
  methods: {
      exportCharacter() {
          this.exportCode = JSON.stringify(this.$root.character.ref);
      },
      importCharacter() {
        // Works, but displays are off TODO
          if (this.importCode) {
            let char = JSON.parse(this.importCode);
            let base = Utils.getJobFromId(char.jobId)
            base.applyData(char);
            this.$root.character.ref = base;
          }
      }
  }
}



/*
*/
</script>

<style scoped lang='scss'>
h5 {
    text-align: center;
}

button.btn-plus {
    text-align: auto;
    width: auto;
    padding: auto;
    margin: 0px 15px;
}

input[type=text] {
    width: 100px;
    text-overflow: ellipsis;
}
</style>
