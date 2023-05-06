<script setup>
import { reactive, watch } from "vue";
import { Utils } from "../../calc/utils";

const props = defineProps(["character"]);

const inputBuffer = reactive({
    newLevel: 1,
    addStr: 0,
    addSta: 0,
    addDex: 0,
    addInt: 0,
    added: 0,
    assistInt: 300,
    statPoints: 0,
    totalStatPoints: 0,
    assignedStats: { str: 0, sta: 0, dex: 0, int: 0 },
    assistBuffs: false,
    premiumItems: false,
    classBuffs: false,
    jobName: props.character.data.constructor.name,
});

window.addEventListener("keypress", (e) => {
    if (e.code == "Enter") {
        e.preventDefault();
        applyStats();
    }
});

function validateInput() {
    if (
        inputBuffer.addStr === "" ||
        inputBuffer.addSta === "" ||
        inputBuffer.addDex === "" ||
        inputBuffer.addInt === ""
    ) {
        inputBuffer.addStr = 0;
        inputBuffer.addSta = 0;
        inputBuffer.addDex = 0;
        inputBuffer.addInt = 0;
        return false;
    }

    if (inputBuffer.newLevel < 1 || inputBuffer.newLevel > Utils.maxLevel) {
        return false;
    }

    if (inputBuffer.statPoints < 0) {
        return false;
    }

    return true;
}

function applyStats() {
    if (!validateInput()) {
        return;
    }

    props.character.data.level = inputBuffer.newLevel;

    props.character.data.str += inputBuffer.addStr;
    props.character.data.sta += inputBuffer.addSta;
    props.character.data.dex += inputBuffer.addDex;
    props.character.data.int += inputBuffer.addInt;

    inputBuffer.added += inputBuffer.addStr + inputBuffer.addSta + inputBuffer.addDex + inputBuffer.addInt;
    Utils.addedStr += inputBuffer.addStr;
    Utils.addedSta += inputBuffer.addSta;
    Utils.addedDex += inputBuffer.addDex;
    Utils.addedInt += inputBuffer.addInt;

    inputBuffer.assignedStats = {
        str: Utils.addedStr,
        sta: Utils.addedSta,
        dex: Utils.addedDex,
        int: Utils.addedInt,
    };

    inputBuffer.addStr = 0;
    inputBuffer.addSta = 0;
    inputBuffer.addDex = 0;
    inputBuffer.addInt = 0;

    inputBuffer.statPoints = props.character.data.level * 2 - 2 - inputBuffer.added;
    if (inputBuffer.statPoints < 0) inputBuffer.statPoints = 0;
    inputBuffer.totalStatPoints = inputBuffer.statPoints;

    props.character.data.assistInt = inputBuffer.assistInt;
    props.character.data.assistBuffs = inputBuffer.assistBuffs;
    props.character.data.selfBuffs = inputBuffer.classBuffs;
    props.character.data.premiumItems = inputBuffer.premiumItems;

    props.character.data.applyBaseStats();
}

function resetCharacter() {
    changeJob("Vagrant");
    inputBuffer.jobName = props.character.data.constructor.name;
    inputBuffer.newLevel = 1;
    inputBuffer.addStr = 0;
    inputBuffer.addSta = 0;
    inputBuffer.addDex = 0;
    inputBuffer.addInt = 0;
    Utils.addedStr = 0;
    Utils.addedSta = 0;
    Utils.addedDex = 0;
    Utils.addedInt = 0;
    inputBuffer.added = 0;
    inputBuffer.classBuffs = false;
    inputBuffer.assistBuffs = false;
    inputBuffer.assistInt = 300;
    inputBuffer.premiumItems = false;

    applyStats();
}

function restatCharacter() {
    inputBuffer.addStr = 0;
    inputBuffer.addSta = 0;
    inputBuffer.addDex = 0;
    inputBuffer.addInt = 0;
    inputBuffer.added = 0;
    Utils.addedStr = 0;
    Utils.addedSta = 0;
    Utils.addedDex = 0;
    Utils.addedInt = 0;

    applyStats();
}

function changeJob(job) {
    let c = Utils.updateJob(props.character.data, job);

    if (c) {
        props.character.data = c;
    }
}

function updateStatPoints() {
    inputBuffer.statPoints =
        inputBuffer.totalStatPoints - inputBuffer.addSta - inputBuffer.addStr - inputBuffer.addDex - inputBuffer.addInt;
}

watch(
    () => props.character.data,
    () => {
        inputBuffer.jobName = props.character.data.constructor.name;
    }
);

watch(
    () => inputBuffer.addStr,
    () => {
        updateStatPoints();
    }
);

watch(
    () => inputBuffer.addSta,
    () => {
        updateStatPoints();
    }
);

watch(
    () => inputBuffer.addDex,
    () => {
        updateStatPoints();
    }
);

watch(
    () => inputBuffer.addInt,
    () => {
        updateStatPoints();
    }
);
</script>

<template>
    <div class="char">
        <h3>Your Character</h3>

        <div class="box stats">
            <table class="stattable">
                <tbody>
                    <tr>
                        <td><h5>Class</h5></td>
                        <td></td>
                        <td>
                            <select
                                name="class"
                                @change="changeJob($event.target.value)"
                                id="job"
                                v-model="inputBuffer.jobName"
                            >
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
                        <td>
                            <h5>{{ props.character.data.level }}</h5>
                        </td>
                        <td>
                            <button class="btn-plus" @click="inputBuffer.newLevel--">-</button>
                            <input
                                class="charinput"
                                :class="{ 'red-text': inputBuffer.newLevel > Utils.maxLevel }"
                                type="number"
                                v-model="inputBuffer.newLevel"
                            />
                            <button class="btn-plus" @click="inputBuffer.newLevel++">+</button>
                        </td>
                        <td>
                            <button class="btn-plus" @click="inputBuffer.newLevel = Utils.maxLevel">max</button>
                        </td>
                    </tr>

                    <tr>
                        <td><h5>STR</h5></td>
                        <td>
                            <h5>
                                {{ props.character.data.str }}
                                <span class="added-stats">{{ inputBuffer.assignedStats.str }}</span>
                            </h5>
                        </td>
                        <td>
                            <button class="btn-plus" @click="inputBuffer.addStr--">-</button>
                            <input class="charinput" type="number" v-model="inputBuffer.addStr" />
                            <button class="btn-plus" @click="inputBuffer.addStr++">+</button>
                        </td>
                        <td>
                            <button class="btn-plus" @click="inputBuffer.addStr = inputBuffer.statPoints">++</button>
                        </td>
                    </tr>

                    <tr>
                        <td><h5>STA</h5></td>
                        <td>
                            <h5>
                                {{ props.character.data.sta }}
                                <span class="added-stats">{{ inputBuffer.assignedStats.sta }}</span>
                            </h5>
                        </td>
                        <td>
                            <button class="btn-plus" @click="inputBuffer.addSta--">-</button>
                            <input class="charinput" type="number" v-model="inputBuffer.addSta" />
                            <button class="btn-plus" @click="inputBuffer.addSta++">+</button>
                        </td>
                        <td>
                            <button class="btn-plus" @click="inputBuffer.addSta = inputBuffer.statPoints">++</button>
                        </td>
                    </tr>

                    <tr>
                        <td><h5>DEX</h5></td>
                        <td>
                            <h5>
                                {{ props.character.data.dex }}
                                <span class="added-stats">{{ inputBuffer.assignedStats.dex }}</span>
                            </h5>
                        </td>
                        <td>
                            <button class="btn-plus" @click="inputBuffer.addDex--">-</button>
                            <input class="charinput" type="number" v-model="inputBuffer.addDex" />
                            <button class="btn-plus" @click="inputBuffer.addDex++">+</button>
                        </td>
                        <td>
                            <button class="btn-plus" @click="inputBuffer.addDex = inputBuffer.statPoints">++</button>
                        </td>
                    </tr>

                    <tr>
                        <td><h5>INT</h5></td>
                        <td>
                            <h5>
                                {{ props.character.data.int }}
                                <span class="added-stats">{{ inputBuffer.assignedStats.int }}</span>
                            </h5>
                        </td>
                        <td>
                            <button class="btn-plus" @click="inputBuffer.addInt--">-</button>
                            <input class="charinput" type="number" v-model="inputBuffer.addInt" />
                            <button class="btn-plus" @click="inputBuffer.addInt++">+</button>
                        </td>
                        <td>
                            <button class="btn-plus" @click="inputBuffer.addInt = inputBuffer.statPoints">++</button>
                        </td>
                    </tr>

                    <tr>
                        <td><h5>Assist/RM buffs</h5></td>
                        <td></td>
                        <td>
                            <input id="buffs" type="checkbox" v-model="inputBuffer.assistBuffs" />
                            <input class="charinput" type="number" v-model="inputBuffer.assistInt" />
                            int
                        </td>
                    </tr>

                    <tr>
                        <td><h5>Class buffs</h5></td>
                        <td></td>
                        <td>
                            <input id="selfbuffs" type="checkbox" v-model="inputBuffer.classBuffs" />
                        </td>
                    </tr>

                    <tr>
                        <td><h5>Premium items</h5></td>
                        <td></td>
                        <td>
                            <input id="premiumItems" type="checkbox" v-model="inputBuffer.premiumItems" />
                        </td>
                    </tr>

                    <tr>
                        <td><h5>Stat points</h5></td>
                        <td></td>
                        <td>
                            <h5 :class="{ 'red-text': inputBuffer.statPoints < 0 }">
                                {{ inputBuffer.statPoints }}
                            </h5>
                        </td>
                    </tr>
                </tbody>
            </table>

            <button id="applystats" class="btn-plus" @click="applyStats">Apply</button>
            <button id="restatstats" class="btn-plus" @click="restatCharacter">Re-Stat</button>
            <button id="resetstats" class="btn-plus" @click="resetCharacter">Full Reset</button>
        </div>
    </div>
</template>

<style scoped lang="scss">
button#applystats,
button#resetstats,
button#restatstats {
    margin: 5px 15px 0px 15px;
}

.added-stats {
    font-style: italic;
    opacity: 0.5;
}

.red-text {
    color: #ff6961;
}
</style>
