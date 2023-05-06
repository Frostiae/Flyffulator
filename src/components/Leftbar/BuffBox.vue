<script setup>
import { Utils } from "../../calc/utils";

const props = defineProps(["character"]);

function getTooltip(buff) {
    let tooltip = buff.name.en + "\n";
    const level = buff.levels[buff.levels.length - 1];

    if (level.abilities != undefined) {
        for (const ability of level.abilities) {
            let effect = "";
            effect += ability.parameter;

            let add = ability.add;
            if (level.scalingParameters != undefined) {
                for (const scaling of level.scalingParameters) {
                    if (scaling.parameter == ability.parameter) {
                        let extra = props.character.data.assistInt * scaling.scale;
                        if (extra > scaling.maximum) {
                            extra = scaling.maximum;
                        }

                        add += extra;
                    }
                }
            }

            effect += "+" + add;
            if (ability.rate) {
                effect += "%";
            }

            effect += "\n";
            tooltip += effect;
        }
    }

    return tooltip;
}
</script>

<template>
    <div class="char">
        <h3>Buffs</h3>
        <h5>Add buffs through the 'Your Character' module</h5>

        <div class="box stats">
            <ul>
                <li v-for="buff in props.character.data.activeBuffs" :value="buff" :key="buff.id">
                    <input
                        type="checkbox"
                        name="enable-buff"
                        v-model="buff.enabled"
                        @change="props.character.data.forceUpdate = !props.character.data.forceUpdate"
                    />
                    <img
                        :src="Utils.getImageUrl(buff.icon, 'skills')"
                        alt=""
                        :title="getTooltip(buff)"
                        :class="{ disabled: buff.enabled == false }"
                    />
                </li>
            </ul>
        </div>
    </div>
</template>

<style scoped lang="scss">
input[type="checkbox"] {
    position: absolute;
    opacity: 0.8;
    z-index: 200;
}

h5 {
    opacity: 0.5;
}

ul {
    list-style: none;
    padding: 10px;
    width: 100%;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;

    li {
        position: relative;
    }
}

img {
    transition: 0.2s;

    &.disabled {
        opacity: 0.2;
        transition: 0.2s;
    }
}
</style>
