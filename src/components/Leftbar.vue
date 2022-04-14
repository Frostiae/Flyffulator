<template>
    <div class="sidepanel">
        <div class="panelcontent">
            <builds ref="builds" @LoadAppliedStats="onLoadAppliedStats" @NewBuild="onNewBuild" @LoadEquipment="onLoadEquipment" />
            <character ref="character" />
            <equipment ref="equipment" />
            <buffs/>
            <!--<externals/>-->
        </div>
    </div>
</template>

<script>
import Character from './Leftbar/Character.vue'
import Equipment from './Leftbar/Equipment.vue'
import Buffs from './Leftbar/Buffs.vue'
import Builds from './Leftbar/Builds.vue'
//import Externals from './Leftbar/External.vue'
//import Changelog from './Leftbar/Changelog.vue'

export default {
  name: 'Leftbar',
  components: {
      Character,
      Equipment,
      Buffs,
      Builds
      //Changelog,
      //Externals
  },
  methods: {
    onLoadAppliedStats(appliedStats) {
      if (this.$refs.character) this.$refs.character.applyLoadedStats(appliedStats);
    },
    onLoadEquipment(equipment) {
      if (this.$refs.equipment) this.$refs.equipment.applyEquip(equipment);
    },
    onNewBuild() {
      // makes sure the new build gets the active character stats
      if (this.$refs.character) {
        this.$refs.character.ApplyStats();
      }
    }
  }
}
</script>

<style lang='scss'>
.panelcontent {
  margin: 20px;
}

table.stattable {
  text-align: center;
  color: v-bind('$root.hcolor');
  margin: 3px;
  font-size: 14px;
}

.sidepanel {
  position: fixed;
  height: 100%;
  overflow-x: hidden;
  left: 0;
  float: left;
  top: 0;
  border-radius: 0px 15px 15px 0px;
  width: 22vw;
  max-width: 330px;
  min-width: 290px;
  overflow-y: auto;
  z-index: 1;
  transition: 0.3s;

  .char {
    margin-bottom: 18px;
  }

  .stats {
    display: flex;
    flex-direction: column;
    border-radius: 15px;
    width: 100%;
    min-height: 20px;
    box-shadow: #0000001e 0px 5px 5px;
    padding-top: 10px;
    padding-bottom: 10px;

    .statsrow {
      display:flex;
      flex-direction: row;
    }

    .titles {
      display: flex;
      flex-direction: column;
      width: 50%;
      text-align: right;
      justify-content: space-between;
    }

    .values {
      display: flex;
      flex-direction: column;

      .value {
        display: flex;
        flex-direction: row;
        justify-content: space-evenly;

        h5 {
          color: #DADEEF;
        }
      }
    }
  }

  select {
    background: none;
    color: v-bind('$root.pcolor');
    margin: 3px;
    font-weight: 500;
    border: 1px solid #5975cf00;
    border-radius: 15px;
    transition: 0.3s;
    width: 100%;
    text-overflow: ellipsis;
    text-align: center;
  }

  select:active {
    background-color: white;
  }

  select:hover {
    border: 1px solid #5975cf;
    box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.307);
    transition: 0.3s;
    cursor: pointer;
  }

  .btn-plus {
    font-weight: bolder;
    font-size: 13px;
    background: none;
    border-radius: 15px;
    border: 1px solid #5975cf31;
    transition: 0.3s;
    margin: 0;

    &:disabled {
      opacity: 0.5;
    }
  }

  .btn-plus:hover {
    border: 1px solid #5975cf;
    box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.307);
    border-radius: 10px;
    cursor: pointer;
    transition: 0.3s;
  }

  p#statpoints {
    font-size: 13px;
    margin: 2px;
    text-align: center;
    color: #c8e3f5;
    font-weight: bold;
  }

  p.equip {
    font-family: 'Roboto';
    font-size: 13px;
    margin: 4px;
  }

  .btn-plus:active {
    background-color: white;
  }

  #changelog {
    display: block;

    li {
      margin-bottom: 5px;
    }

    h5 {
      margin-left: 10px;
      margin-right: 10px;
    }
  }
}

</style>
