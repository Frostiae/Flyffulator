<script setup>
import Character from "./leftbar/Character.vue";
import Equipment from "./leftbar/Equipment.vue";
import Builds from "./leftbar/Builds.vue";
import BuffBox from "./leftbar/BuffBox.vue";
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
        </div>
    </div>
</template>

<style scoped lang="scss">
.sidepanel {
    left: 0;
    float: left;
}
</style>
