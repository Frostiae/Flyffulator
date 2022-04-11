<template>
  <div class="char">
    <h3>Your Builds</h3>
    <div class="stats">
        <input type="text" v-model="currentBuild.name" placeholder="build name">
        <button class="btn-plus" id="savebuild" @click="saveBuild">Save</button>
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
  constructor(id, name){
    this.id = id
    this.name = name;
  }
}

export default {
  name: 'Builds',
  data() {
      return {
          currentBuild: null,
          builds: []
      }
  },
  created() { 
    this.newBuild();
  },
  methods: {
      saveBuild() {
        // TODO
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
      },
      loadBuild(id){
        let build = this.builds.find(b => b.id === id);
        if(!build){
          return;
        }
        this.currentBuild = build;
      },
      deleteBuild(){
          if(confirm(`Are you sure you want to delete build ${this.currentBuild.name}?`)) {
            let index = this.builds.indexOf(this.currentBuild);
            if(index >= 0){
              this.builds.splice(index,1)
            }
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

button#savebuild, button#newbuild, button#deletebuild {
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
