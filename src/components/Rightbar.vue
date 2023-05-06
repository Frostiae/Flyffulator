<script setup>
import Statistics from "./Statistics.vue";

const props = defineProps(["character"]);
</script>

<template>
    <div class="sidepanel">
        <div class="panelcontent">
            <Statistics :character="props.character" />
        </div>
    </div>
</template>

<style>
.sidepanel {
    right: 0;
    float: right;
}
</style>
