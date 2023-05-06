<script setup>
import { ref, onMounted, watch } from "vue";
import { Utils } from "../calc/utils";

const props = defineProps(["character", "focusMonsters"]);
const bestExperience = ref({ name: "Small Aibatt", reward: 0 });

function getBestExp() {
    bestExperience.value.reward = 0;

    for (let monster of props.focusMonsters) {
        const expReward = Utils.getExpReward(monster, props.character.level);
        if (expReward > bestExperience.value.reward) {
            bestExperience.value.name = monster.name.en;
            bestExperience.value.reward = expReward.toFixed(4);
        }
    }
}

onMounted(() => {
    getBestExp();
});

watch(
    () => props.character.level,
    () => {
        getBestExp();
    }
);
</script>

<template>
    <div class="box basicbox">
        <h3>Experience/Kill</h3>
        <p>{{ bestExperience.reward }}%</p>
        <h5>at {{ bestExperience.name }} (best value)</h5>
    </div>
</template>
