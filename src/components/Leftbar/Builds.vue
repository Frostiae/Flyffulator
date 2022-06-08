<template>
  <div class="char">
    <h3>Your Builds</h3>
    <div class="stats">
      <table class="stattable">
        <tr>
          <td><h5>Selected Build</h5></td>
          <td>
            <select v-model="currentBuild" id="build-select">
              <option value="" disabled>Select a build...</option>
              <option v-for="build in builds" :value="build" :key="build.id">
                {{ build.name }}
              </option>
            </select>
          </td>
        </tr>

        <tr>
          <td><input type="text" v-model="newBuildName" placeholder="build name"></td>
          <td><button class="btn-plus" id="newbuild" @click="newBuild">New</button></td>
        </tr>

        <tr>
          <td><input type="text" v-model="importCode" placeholder="import code"></td>
          <td><button class="btn-plus" id="newbuild" @click="importBuild" :disabled="importCode == ''">Import Build</button></td>
        </tr>

        <tr>
          <td><input type="text" v-model="exportCode" placeholder="export code" disabled></td>
          <td><button class="btn-plus" id="newbuild" @click="exportBuild">Generate Code</button></td>
        </tr>
      </table>

      <button class="btn-plus" id="savebuild" @click="saveCurrentBuild">Save</button>
      <button class="btn-plus" id="deletebuild" @click="deleteBuild">Delete</button>
    </div>
  </div>
</template>

<script>
import { Utils } from '../../calc/utils.js'

class Build {
  id;
  name;  
  appliedStats;
  equipment;
  constructor(id, name){
    this.id = id
    this.name = name;
  }
}

export default {
  name: 'Builds',
  data() {
      return {
          character: this.$root.character.ref,
          currentBuild: null,
          builds: [],
          newBuildName: "",
          importCode: "",
          exportCode: ""
      }
  },
  created() { 
    for (let i = 0; i < localStorage.length; i++){
      let key = localStorage.key(i);
      if(!key.startsWith("Build_")){
        continue;
      }
      let build = JSON.parse(localStorage.getItem(localStorage.key(i)));
      this.builds.push(build);
    }
    if(this.builds.length == 0){
      this.newBuild();
    } else {
      this.currentBuild = this.builds[0]
      setTimeout(() => this.$emit('LoadEquipment', this.currentBuild.equipment), 10);   
      setTimeout(() => this.$emit('LoadAppliedStats', this.currentBuild.appliedStats), 20);         
    }
  },
  watch: {
    currentBuild() {
      if (this.currentBuild != null)
        this.loadBuild();
    },
    '$root.character.ref'() {
      this.character = this.$root.character.ref;
    }
  },
  methods: {
      saveCurrentBuild() {
        const newStats = {
          jobName:  this.$root.jobName,
          newlevel: this.character.level,
          str: this.character.str,
          sta: this.character.sta,
          dex: this.character.dex,
          int: this.character.int,
          addedStr: Utils.addedStr,
          addedSta: Utils.addedSta,
          addedDex: Utils.addedDex,
          addedInt: Utils.addedInt,    
          assistint: Utils.assistInt,
          assistbuffs: Utils.assistBuffs,
          classbuffs: Utils.classBuffs,
        };

        const newEquipment = {
          mainhand: this.character.mainhand?.id,
          armor: this.character.armor?.id,
          armorUpgrade: this.character.armorUpgrade,
          mainhandUpgrade: this.character.mainhandUpgrade,
          offhandUpgrade: this.character.offhandUpgrade,
          offhand: this.character.offhand?.id,
          earringR: this.character.earringR?.id,
          earringL: this.character.earringL?.id,
          necklace: this.character.necklace?.id,
          ringR: this.character.ringR?.id,
          ringL: this.character.ringL?.id,
          cloak: this.character.cloak?.id,
          suitPiercing: this.character.suitPiercing?.id,
        };

        this.saveAppliedStats(newStats);
        this.saveEquipment(newEquipment);
      },
      saveAppliedStats(appliedStats) {
        this.currentBuild.appliedStats = appliedStats;
        this.saveCurrentToDisk();
      },
      saveEquipment(equipment){
        this.currentBuild.equipment = equipment;
        this.saveCurrentToDisk();
      },
      newBuild() {
        if (this.newBuildName == "") {
          this.newBuildName = "New Build";
        }

        let nameCounter = 0;
        let newName = this.newBuildName;

        while (this.builds.find(b => b.name === newName)) {
          nameCounter++;
          newName = `${this.newBuildName} (${nameCounter})`;
        }

        this.currentBuild = new Build(Utils.newGuid(), newName);
        this.builds.push(this.currentBuild);
        this.saveCurrentBuild();
        setTimeout(() => this.$emit('NewBuild', {}), 10);

        this.newBuildName = "";
      },
      loadBuild() {
        if (!this.currentBuild) return;
        
        if (this.currentBuild.appliedStats) {
          this.$emit('LoadAppliedStats', this.currentBuild.appliedStats);
          this.$emit('LoadEquipment', this.currentBuild.equipment);
        }
      },
      saveCurrentToDisk() {
        localStorage.setItem(`Build_${this.currentBuild.id}`, JSON.stringify(this.currentBuild));
      },
      deleteBuild() {
          if (confirm(`Are you sure you want to delete build ${this.currentBuild.name}?`)) {
            let index = this.builds.indexOf(this.currentBuild);
            
            if(index >= 0) {
              this.builds.splice(index,1)
            }

            localStorage.removeItem(`Build_${this.currentBuild.id}`)
            if (this.builds.length == 0) {
              this.newBuild();
            } else {
              this.currentBuild = this.builds[0];
            }
          }
      },
      importBuild() {
        if (this.importCode == "") return;
        let build = JSON.parse(this.importCode);
        build.id = Utils.newGuid();
        build.name += " [Imported]";

        this.builds.push(build);
        this.currentBuild = build;
        this.loadBuild();
        setTimeout(() => this.saveCurrentBuild(), 10);
      },
      exportBuild() {
        this.exportCode = JSON.stringify(this.currentBuild);
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

tr {
  button {
    width: 100%;
  }
}

button#deletebuild, button#savebuild {
  margin: 0 5%;
  margin-top: 10px;
}

button {
  text-align: auto;
  width: auto;
  padding: auto;
}

input[type=text] {
  width: 100px;
  border: 1px solid #5975cf31;
  border-radius: 20px;
  text-overflow: ellipsis;

  &:hover {
    border: 1px solid #5975cf;
  }
}

select#build-select {
  color: v-bind('$root.pcolor');
  margin-right: auto;
  margin-left: auto;
  width: 100%;
  text-align: center;
}

select:disabled {
  opacity: 0.3;
}
</style>
