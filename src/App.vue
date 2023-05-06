<script setup>
/* eslint-disable */
import LeftBar from "./components/LeftBar.vue";
import RightBar from "./components/RightBar.vue";
import ExperiencePerKill from "./components/ExperiencePerKill.vue";
import KillsPerLevel from "./components/KillsPerLevel.vue";
import ExpHpRatio from "./components/ExpHpRatio.vue";
import DamageBox from "./components/DamageBox.vue";
import HitsPerLevel from "./components/HitsPerLevel.vue";
import { reactive, onMounted, watch, ref } from "vue";
import { Vagrant } from "./calc/jobs.js";
import { Utils } from "./calc/utils.js";

const vagrant = new Vagrant();
const character = reactive({ data: vagrant });
const focusMonsters = reactive({ data: Utils.updateMonsters(vagrant) });
const focus = reactive(reactive({ data: focusMonsters.data[0] }));

watch(() => focus.data, () => {
    Utils.focus = focus.data;
})

watch(() => character.data.str, updateMonsters);
watch(() => character.data.sta, updateMonsters);
watch(() => character.data.dex, updateMonsters);
watch(() => character.data.int, updateMonsters);
watch(() => character.data.assistBuffs, updateMonsters);
watch(() => character.data.assistInt, updateMonsters);
watch(() => character.data.selfBuffs, updateMonsters);
watch(() => character.data.premiumItems, updateMonsters);
watch(() => character.data.level, updateMonsters);
watch(() => character.data.focusSkill, updateMonsters);

watch(() => character.data.mainhand, updateMonsters);
watch(() => character.data.offhand, updateMonsters);
watch(() => character.data.armor, updateMonsters);
watch(() => character.data.earringR, updateMonsters);
watch(() => character.data.earringL, updateMonsters);
watch(() => character.data.ringR, updateMonsters);
watch(() => character.data.ringL, updateMonsters);
watch(() => character.data.necklace, updateMonsters);
watch(() => character.data.cloak, updateMonsters);
watch(() => character.data.suitPiercing, updateMonsters);
watch(() => character.data.armorUpgrade, updateMonsters);
watch(() => character.data.mainhandUpgrade, updateMonsters);
watch(() => character.data.offhandUpgrade, updateMonsters);

watch(() => character.data.forceUpdate, updateMonsters);

function updateMonsters() {
    focus.data = null; // To trigger reactivity... ?
    focusMonsters.data = Utils.updateMonsters(character.data);
    focus.data = focusMonsters.data.find(monster => monster.level >= character.data.level) || focusMonsters.data.slice(-1)[0];
}

onMounted(() => {
    updateMonsters();
    Utils.focus = focus.data;
});


</script>

<template>
    <LeftBar :character="character"/>
    <div class="middle">
        <img
            alt="Class logo"
            class="logo"
            :src="Utils.getImageUrl(character.data.weapon_img)"
            width="250"
            height="250"
        />

        <h3>Damage</h3>
        <table>
            <tr>
                <td>
                    <h5>Target: </h5>
                </td>
                <td>
                    <select v-model="focus.data" class="mid-select">
                        <option disabled value="">Select a monster...</option>
                        <option v-for="monster in focusMonsters.data" :value="monster" :key="monster.id">
                        {{ monster.name.en }}
                        </option>
                    </select>
                </td>
            </tr>
        </table>

        <div class="boxrow">
            <DamageBox :character="character" :focus="focus" :skill="null" />
        </div>

        <h3>Leveling</h3>
        <div class="boxrow">
            <ExperiencePerKill :character="character.data" :focus-monsters="focusMonsters.data"/>
            <KillsPerLevel :character="character.data" :focus-monsters="focusMonsters.data"/>
            <ExpHpRatio :character="character.data" :focus-monsters="focusMonsters.data"/>
        </div>

        <div class="boxrow">
            <HitsPerLevel :character="character.data" :focus-monsters="focusMonsters.data" />
        </div>

        <div class="footer">
          <h5>Flyff simulator built specifically for <a href='https://api.flyff.com/'>Flyff Universe</a> by Frostiae#2809</h5>
          <h5 style="opacity: 0.5;">If you would like to follow development or contribute, visit the <a href="https://github.com/Frostiae/Flyffulator">GitHub</a> page.</h5>
        </div>
    </div>
    <RightBar :character="character"/>
</template>
