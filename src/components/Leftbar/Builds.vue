<template>
  <div class="char">
    <h3>Your Builds</h3>
    <div class="stats">
        <input type="text" v-model="currentBuild.name" placeholder="build name">
        <button class="btn-plus" id="newbuild" @click="newBuild">New</button>
        <button class="btn-plus" id="deletebuild" @click="deleteBuild">Delete</button>
        <ol>
          <li v-for="build in builds" :key="build.id" @click="loadBuild(build.id)">
            <span v-if="build.id === this.currentBuild.id">[ACTIVE] </span>{{ build.name }}
          </li>
        </ol>
    </div>
  </div>
</template>

<script>
import { Utils } from '../../calc/utils.js'

class Build {
  id;
  name;  
  appliedStats;
  constructor(id, name){
    this.id = id
    this.name = name;
  }
}

export default {
  name: 'Builds',
  data() {
      return {
          character: this.$root.character,
          currentBuild: null,
          builds: []
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
    }else{
      this.currentBuild = this.builds[0]
      setTimeout(() => this.$emit('LoadAppliedStats', this.currentBuild.appliedStats), 10);      
    }
  },
  methods: {
      saveAppliedStats(appliedStats) {
        console.log(appliedStats);
        this.currentBuild.appliedStats = appliedStats;
        this.saveCurrentToDisk();
      },
      newBuild() {
        let newNameBase = "New Build";
        let nameCounter = 0;
        let newName = newNameBase;
        while(this.builds.find(b => b.name === newName)){
          nameCounter++;
          newName = `${newNameBase} (${nameCounter})`;
        }
        this.currentBuild = new Build(Utils.newGuid(), newName);
        this.builds.push(this.currentBuild);
        this.saveCurrentToDisk();
        setTimeout(() => this.$emit('NewBuild', {}), 10);
      },
      loadBuild(id){
        let build = this.builds.find(b => b.id === id);
        if(!build){
          return;
        }
        this.currentBuild = build;
        
        if(this.currentBuild.appliedStats) {
          this.$emit('LoadAppliedStats', this.currentBuild.appliedStats);
        }
      },
      saveCurrentToDisk(){
        localStorage.setItem(`Build_${this.currentBuild.id}`, JSON.stringify(this.currentBuild));
      },
      deleteBuild(){
          if(confirm(`Are you sure you want to delete build ${this.currentBuild.name}?`)) {
            let index = this.builds.indexOf(this.currentBuild);
            if(index >= 0){
              this.builds.splice(index,1)
            }
            localStorage.removeItem(`Build_${this.currentBuild.id}`)

            if(this.builds.length == 0) {
              this.newBuild();
            }else{
              this.currentBuild = this.builds[0];
            }
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

button#newbuild, button#deletebuild {
  margin: 5px 15px 0px 15px;
}

button {
    text-align: auto;
    width: auto;
    padding: auto;
}

input[type=text] {
    width: 86%;
    margin-left: 7%;
    text-overflow: ellipsis;
}

li:hover {
  cursor: pointer;
}
</style>
