<script setup>
import { reactive, onMounted, watch } from "vue";
import { Vagrant } from "../../calc/jobs";
import { Utils } from "../../calc/utils";

class Build {
    id;
    name;
    appliedStats;
    equipment;
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}

const props = defineProps(["character"]);
const emit = defineEmits(["loadEquipment"]);

const builds = reactive({ data: [] });
const currentBuild = reactive({ data: null });
const newBuildName = reactive({ data: "" });
/*
const exportCode = reactive({ data: "" });
const importCode = reactive({ data: "" });
*/

watch(
    () => currentBuild.data,
    () => {
        if (currentBuild.data != null) {
            loadBuild();
        }
    }
);

onMounted(() => {
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (!key.startsWith("Build_")) {
            continue;
        }

        let build = JSON.parse(localStorage.getItem(localStorage.key(i)));
        builds.data.push(build);
    }

    if (builds.data.length == 0) {
        newBuild();
    } else {
        // TODO: something wrong here
        currentBuild.data = builds.data[0];
        //setTimeout(() => this.$emit('LoadEquipment', this.currentBuild.equipment), 10);
        //setTimeout(() => this.$emit('LoadAppliedStats', this.currentBuild.appliedStats), 20);
    }
});

function newBuild() {
    if (newBuildName.data == "") {
        newBuildName.data = "New Build";
    }

    let nameCounter = 0;
    let newName = newBuildName.data;

    while (builds.data.find((b) => b.name === newName)) {
        nameCounter++;
        newName = `${newBuildName.data} (${nameCounter})`;
    }

    currentBuild.data = new Build(Utils.newGuid(), newName);
    builds.data.push(currentBuild.data);
    saveCurrentBuild();
    //setTimeout(() => this.$emit('NewBuild', {}), 10);

    newBuildName.data = "";
}

function deleteBuild() {
    if (confirm(`Are you sure you want to delete ${currentBuild.data.name}?`)) {
        let index = builds.data.indexOf(currentBuild.data);

        if (index >= 0) {
            builds.data.splice(index, 1);
        }

        localStorage.removeItem(`Build_${currentBuild.data.id}`);
        if (builds.data.length == 0) {
            newBuild();
        } else {
            currentBuild.data = builds.data[0];
        }
    }
}

function saveCurrentBuild() {
    console.log("Saving current...");

    const newStats = {
        jobName: Utils.getJobName(props.character.data.jobId),
        newlevel: props.character.data.level,
        str: props.character.data.str,
        sta: props.character.data.sta,
        dex: props.character.data.dex,
        int: props.character.data.int,
        addedStr: Utils.addedStr,
        addedSta: Utils.addedSta,
        addedDex: Utils.addedDex,
        addedInt: Utils.addedInt,
        assistint: Utils.assistInt,
        assistbuffs: Utils.assistBuffs,
        classbuffs: Utils.classBuffs,
        premiumItems: Utils.premiumItems,
    };

    const newEquipment = {
        mainhand: props.character.data.mainhand?.id,
        armor: props.character.data.armor?.id,
        armorUpgrade: props.character.data.armorUpgrade,
        mainhandUpgrade: props.character.data.mainhandUpgrade,
        offhandUpgrade: props.character.data.offhandUpgrade,
        offhand: props.character.data.offhand?.id,
        earringR: props.character.data.earringR?.id,
        earringL: props.character.data.earringL?.id,
        necklace: props.character.data.necklace?.id,
        ringR: props.character.data.ringR?.id,
        ringL: props.character.data.ringL?.id,
        cloak: props.character.data.cloak?.id,
        suitPiercing: props.character.data.suitPiercing?.id,
    };

    currentBuild.data.appliedStats = newStats;
    currentBuild.data.equipment = newEquipment;

    saveCurrentToDisk();
}

function loadBuild() {
    if (currentBuild.data == null) {
        return;
    }

    if (currentBuild.data.appliedStats && currentBuild.data.equipment) {
        let c = Utils.updateJob(props.character.data, currentBuild.data.appliedStats.jobName);

        if (c) {
            props.character.data = c;
        } else {
            props.character.data = new Vagrant();
        }

        props.character.data.level = currentBuild.data.appliedStats.newlevel;

        Utils.addedDex = currentBuild.data.appliedStats.addedDex;
        Utils.addedStr = currentBuild.data.appliedStats.addedStr;
        Utils.addedSta = currentBuild.data.appliedStats.addedSta;
        Utils.addedInt = currentBuild.data.appliedStats.addedInt;

        props.character.data.str = currentBuild.data.appliedStats.str;
        props.character.data.sta = currentBuild.data.appliedStats.sta;
        props.character.data.dex = currentBuild.data.appliedStats.dex;
        props.character.data.int = currentBuild.data.appliedStats.int;

        props.character.data.assistInt = currentBuild.data.appliedStats.assistint;
        props.character.data.assistBuffs = currentBuild.data.appliedStats.assistbuffs;
        props.character.data.premiumItems = currentBuild.data.appliedStats.premiumItems;
        props.character.data.selfBuffs = currentBuild.data.appliedStats.classbuffs;

        emit("loadEquipment", currentBuild.data.equipment);
        props.character.data.applyBaseStats();
    }
}

function saveCurrentToDisk() {
    localStorage.setItem(`Build_${currentBuild.data.id}`, JSON.stringify(currentBuild.data));
}

/*
function exportBuild() {
    exportCode.data = JSON.stringify(currentBuild.data);
}

function importBuild() {
    if (importCode.data == "") {
        return;
    }

    let build = JSON.parse(importCode.data);
    build.id = Utils.newGuid();
    build.name += " [Imported]";

    builds.data.push(build);
    currentBuild.data = build;
    loadBuild();
    saveCurrentBuild();
}
*/
</script>

<template>
    <div class="char">
        <h3>Your Presets</h3>

        <div class="box stats">
            <table class="stattable">
                <tr>
                    <td><h5>Selected Build</h5></td>
                    <td>
                        <select v-model="currentBuild.data" id="build-select">
                            <option value="" disabled>Select a build...</option>
                            <option v-for="build in builds.data" :value="build" :key="build.id">
                                {{ build.name }}
                            </option>
                        </select>
                    </td>
                </tr>

                <tr>
                    <td>
                        <input type="text" v-model="newBuildName.data" placeholder="build name" />
                    </td>
                    <td>
                        <button class="btn-plus" id="newbuild" @click="newBuild">Create</button>
                    </td>
                </tr>

                <!--
                <tr>
                <td><input type="text" v-model="importCode.data" placeholder="import code"></td>
                <td><button class="btn-plus" id="newbuild" @click="importBuild" :disabled="importCode == ''">Import Build</button></td>
                </tr>

                <tr>
                <td><input type="text" v-model="exportCode.data" placeholder="export code" disabled></td>
                <td><button class="btn-plus" id="newbuild" @click="exportBuild">Generate Code</button></td>
                </tr>
                -->
            </table>

            <button class="btn-plus" id="savebuild" @click="saveCurrentBuild">Save Current</button>
            <button class="btn-plus" id="deletebuild" @click="deleteBuild">Delete</button>
        </div>
    </div>
</template>

<style scoped lang="scss">
table {
    margin: auto !important;
    width: 80%;

    button {
        width: 100%;
    }
}

button#deletebuild,
button#savebuild {
    margin: 0 5%;
    margin-top: 10px;
}

input[type="text"] {
    width: 80%;
    border: 1px solid #5975cf31;
    border-radius: 20px;
    text-overflow: ellipsis;
    transition: 0.3s;

    &:hover {
        border: 1px solid #5975cf;
        transition: 0.3s;
    }
}

select#build-select {
    margin-right: auto;
    margin-left: auto;
    width: 100%;
    text-align: center;
}

select:disabled {
    opacity: 0.3;
}
</style>
