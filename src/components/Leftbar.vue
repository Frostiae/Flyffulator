<script setup>
import Character from "./Leftbar/Character.vue";
import Equipment from "./Leftbar/Equipment.vue";
import Builds from "./Leftbar/Builds.vue";
import BuffBox from "./Leftbar/BuffBox.vue";
import PremiumItems from "./Leftbar/PremiumItems.vue"
import { ref } from "vue";

const props = defineProps(["character"]);
const equipmentComponent = ref(null);

function loadEquipment(equipment) {
    equipmentComponent.value.updateEquipment(equipment);
}
</script>

<template>
    <div class="sidepanel">
        <div class="panelcontent">
            <Builds :character="props.character" @load-equipment="loadEquipment" />
            <Character :character="props.character" />
            <Equipment :character="props.character" ref="equipmentComponent" />
            <BuffBox :character="props.character" />
            <PremiumItems :character="props.character" />
        </div>
    </div>
</template>

<style scoped lang="scss">
.sidepanel {
    left: 0;
    float: left;
}
</style>
