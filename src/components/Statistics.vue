<script setup>
const props = defineProps(["character"]);

function format(num) {
    return num.toLocaleString("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigigs: 1,
    });
}
</script>

<template>
    <div class="char">
        <h3>Your Stats</h3>

        <div class="box stats">
            <div id="outputstats">
                <h5>Max Health</h5>
                <p v-cloak>{{ format(props.character.data.health) || "N/A" }}</p>
                <h5>Max MP</h5>
                <p v-cloak>{{ format(props.character.data.mp) || "N/A" }}</p>
                <h5>Max FP</h5>
                <p v-cloak>{{ format(props.character.data.fp) || "N/A" }}</p>
                <h5>Speed</h5>
                <p>100%</p>
                <h5>Casting Speed</h5>
                <p v-cloak>{{ format(props.character.data.DCT * 100.0) + "%" }}</p>
                <hr />
                <h5>Attack</h5>
                <p v-cloak>{{ format(props.character.data.attack) || "N/A" }}</p>
                <h5>Attack Speed</h5>
                <p v-cloak>
                    {{ format(Math.floor((props.character.data.aspd * 100.0) / 2.0)) + "%" || "N/A" }}
                </p>
                <h5>Hit Rate</h5>
                <p v-cloak>{{ format(props.character.data.hitrate) + "%" || "N/A" }}</p>
                <h5>Critical Chance</h5>
                <p v-cloak>{{ format(props.character.data.criticalChance) + "%" || "N/A" }}</p>
                <h5>Critical Damage</h5>
                <p v-cloak>{{ format(props.character.data.criticalDamage) + "%" || "N/A" }}</p>
                <hr />
                <h5>Defense</h5>
                <p v-cloak>{{ format(props.character.data.defense) || "N/A" }}</p>
                <h5>Parry</h5>
                <p v-cloak>{{ format(props.character.data.parry) + "%" || "N/A" }}</p>
                <h5>Melee Block</h5>
                <p v-cloak>{{ format(props.character.data.meleeBlock) + "%" || "N/A" }}</p>
                <h5>Ranged Block</h5>
                <p v-cloak>{{ format(props.character.data.rangedBlock) + "%" || "N/A" }}</p>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
#outputstats {
    text-align: center;

    p {
        font-size: 16px;
    }
}
</style>
