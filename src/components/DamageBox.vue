<script setup>
import { reactive, watch } from "vue";
import { Utils } from "../calc/utils";

const props = defineProps(["character", "focus", "skill"]);
const skills = reactive({ data: Utils.getJobSkills(props.character.data.jobId) });

watch(
    () => props.character.data.constructor.name,
    () => {
        skills.data = Utils.getJobSkills(props.character.data.jobId);
    }
);
</script>

<template>
    <div class="box damagebox">
        <div class="subsection">
            <select v-model="props.character.data.focusSkill">
                <option disabled value="">Select an attack...</option>
                <option value="-1">Auto Attack</option>
                <option v-for="skill in skills.data" :value="skill" :key="skill.id">
                    {{ skill.name.en }}
                </option>
            </select>
            <table>
                <tr>
                    <td>Hit:</td>
                    <td class="value">{{ props.focus.data.playerDamage }}</td>
                </tr>
                <tr>
                    <td>DPS:</td>
                    <td class="value">{{ props.focus.data.dps }}</td>
                </tr>
            </table>
            <h5 style="opacity: 0.5">against a {{ props.focus.data.name.en }}</h5>
            <h5>{{ props.focus.data.ttk }}s to kill a {{ props.focus.data.name.en }}</h5>
        </div>

        <div class="subsection skillinfo" v-if="props.character.data.focusSkill != -1">
            <img :src="`.//src/assets/icons/Skills/${props.character.data.focusSkill.icon}`" alt="Skill Icon" />
            <h5 v-if="props.character.data.focusSkill.levels[0].consumedFP != undefined">
                FP: {{ props.character.data.focusSkill.levels.at(-1).consumedFP }}
            </h5>
            <h5 v-if="props.character.data.focusSkill.levels[0].consumedMP != undefined">
                MP: {{ props.character.data.focusSkill.levels.at(-1).consumedMP }}
            </h5>
            <h5>Character level: {{ props.character.data.focusSkill.level }}</h5>
            <h5>
                Base Damage: {{ props.character.data.focusSkill.levels.at(-1).minAttack }} -
                {{ props.character.data.focusSkill.levels.at(-1).maxAttack }}
            </h5>
            <h4>{{ props.character.data.focusSkill.description.en }}</h4>
        </div>

        <div class="subsection skillinfo" v-if="props.character.data.focusSkill == -1">
            <img width="32" src="../assets/icons/Skills/mot_baseAutoAttack.png" alt="Skill Icon" />
            <h4>Just a regular auto attack.</h4>
        </div>

        <div class="subsection">
            <table>
                <tr>
                    <td>Effective Hit Rate:</td>
                    <td class="value">{{ props.focus.data.effectiveHitRate }}%</td>
                </tr>

                <tr>
                    <td>
                        <table class="consolidated">
                            <tr>
                                Average Block Factor:
                            </tr>
                            <tr>
                                <h6>
                                    This is the factor applied to your <br />final damage because of the <br />monster's
                                    block rate.
                                </h6>
                            </tr>
                        </table>
                    </td>
                    <td class="value" v-if="props.character.data.focusSkill == -1">
                        {{ props.focus.data.blockFactor }}
                    </td>
                    <td class="value" v-else>1.0</td>
                </tr>
            </table>
        </div>
    </div>
</template>

<style scoped lang="scss">
select {
    text-align: left;
    font-weight: 500;
    font-size: 18px;
    border: 1px solid #5975cf25;
    padding: 4px;
    margin: 0px;
    border-radius: 10px;
}

.subsection {
    flex-grow: 1;
}

h5 {
    margin-left: 0;
}

h4 {
    opacity: 0.5;
    font-weight: 200;
}

.skillinfo {
    max-width: 200px;
}

.chart {
    align-self: center;
}

.damagebox {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 50px;
    width: 820px;
    height: 100%;
    padding: 20px;
}

table {
    font-size: 22px;
    width: 100%;

    td {
        font-weight: 500;
        font-size: 20px;
    }
    .value {
        color: var(--color-text-value);
        opacity: 1;
        font-size: 25px;
        text-align: right;
    }

    .consolidated {
        line-height: 20px;

        h6 {
            opacity: 0.4;
            font-size: 14px;
        }
    }
}
</style>
