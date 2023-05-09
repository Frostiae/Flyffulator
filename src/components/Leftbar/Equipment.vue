<script setup>
import { reactive, watch, ref } from "vue";
import { Blade } from "../../calc/jobs";
import { Utils } from "../../calc/utils";

const props = defineProps(["character"]);

const weapons = ref(Utils.getJobWeapons(props.character.data.jobId).sort(Utils.sortByLevel));
const armors = ref(Utils.getJobArmors(props.character.data.jobId).sort(Utils.sortByLevel));

const rings = ref(Utils.getJewelery("ring").sort(Utils.sortByName));
const earrings = ref(Utils.getJewelery("earring").sort(Utils.sortByName));
const necklaces = ref(Utils.getJewelery("necklace").sort(Utils.sortByName));
const piercingCards = ref(Utils.getPiercingCards().sort(Utils.sortByName));
const cloaks = ref(Utils.getCloaks().sort(Utils.sortByName));
const shields = ref(Utils.getShields().sort(Utils.sortByLevel));

const canUseOffhand = ref(false);

function updateDropdowns() {
    weapons.value = Utils.getJobWeapons(props.character.data.jobId).sort(Utils.sortByLevel);
    armors.value = Utils.getJobArmors(props.character.data.jobId).sort(Utils.sortByLevel);
    rings.value = Utils.getJewelery("ring").sort(Utils.sortByName);
    earrings.value = Utils.getJewelery("earring").sort(Utils.sortByName);
    necklaces.value = Utils.getJewelery("necklace").sort(Utils.sortByName);
    piercingCards.value = Utils.getPiercingCards().sort(Utils.sortByName);
    cloaks.value = Utils.getCloaks().sort(Utils.sortByName);
    shields.value = Utils.getShields().sort(Utils.sortByLevel);
}

watch(() => props.character.data.constructor.name, updateDropdowns);

watch(
    () => props.character.data.mainhand,
    (newMainhand) => {
        if (newMainhand.twoHanded) {
            canUseOffhand.value = false;
            props.character.data.offhand = null;
        } else {
            canUseOffhand.value = true;
        }
    }
);

const offhands = ref([...shields.value]);
if (props.character.data instanceof Blade) {
    offhands.value = [...shields.value];
    offhands.value = offhands.value.concat(weapons.value);
}

function updateEquipment(newEquipment) {

    props.character.data.armor = byId(armors.value, newEquipment.armor);
    props.character.data.armorUpgrade = newEquipment.armorUpgrade;
    props.character.data.mainhandUpgrade = newEquipment.mainhandUpgrade;
    props.character.data.offhandUpgrade = newEquipment.offhandUpgrade;
    props.character.data.mainhand = byId(weapons.value, newEquipment.mainhand) || Utils.getItemByName("Wooden Sword");
    props.character.data.offhand = byId(offhands.value.concat(weapons.value), newEquipment.offhand);

    props.character.data.earringR = byId(earrings.value, newEquipment.earringR);
    props.character.data.earringL = byId(earrings.value, newEquipment.earringL);
    props.character.data.necklace = byId(necklaces.value, newEquipment.necklace);
    props.character.data.ringR = byId(rings.value, newEquipment.ringR);
    props.character.data.ringL = byId(rings.value, newEquipment.ringL);
    props.character.data.cloak = byId(cloaks.value, newEquipment.cloak);
    props.character.data.suitPiercing = byId(piercingCards.value, newEquipment.suitPiercing);
}

function byId(arr, id) {
    let obj = arr.find((o) => o.id == id);
    return obj ?? null;
}

defineExpose({ updateEquipment });
</script>

<template>
    <div class="char">
        <h3>Your Equipment</h3>

        <div class="box stats">
            <table class="stattable">
                <tbody>
                    <tr>
                        <td><h5>Armor set</h5></td>
                        <td>
                            <select
                                v-model="props.character.data.armor"
                                id="equipment-select"
                            >
                                <option disabled value="">Select an armor set...</option>
                                <option v-for="set in armors" :value="set" :key="set.id">
                                    {{ set.name.en }}
                                </option>
                            </select>
                        </td>
                        <td>
                            <button
                                class="btn-plus"
                                @click="
                                    {
                                        props.character.data.armor = null;
                                    }
                                "
                            >
                                x
                            </button>
                        </td>
                    </tr>

                    <tr>
                        <td><h5>Armor upgrade</h5></td>
                        <td>
                            <select
                                v-model="props.character.data.armorUpgrade"
                                id="equipment-select"
                                :disabled="!props.character.data.armor"
                            >
                                <option disabled value="">Select an upgrade level...</option>
                                <option v-for="(e, i) in 11" :value="i" :key="i">+{{ i }}</option>
                            </select>
                        </td>
                    </tr>

                    <tr>
                        <td><h5>Mainhand</h5></td>
                        <td>
                            <select
                                v-model="props.character.data.mainhand"
                                id="equipment-select"
                            >
                                <option disabled value="">Select a weapon...</option>
                                <option v-for="weapon in weapons" :value="weapon" :key="weapon.id">
                                    Lv. {{ weapon.level }} {{ weapon.name.en }}
                                </option>
                            </select>
                        </td>
                        <td></td>
                    </tr>

                    <tr>
                        <td><h5>Mainhand upgrade</h5></td>
                        <td>
                            <select
                                v-model="props.character.data.mainhandUpgrade"
                                id="equipment-select"
                            >
                                <option disabled value="">Select an upgrade level...</option>
                                <option v-for="(e, i) in 11" :value="i" :key="i">+{{ i }}</option>
                            </select>
                        </td>
                    </tr>

                    <tr>
                        <td><h5>Offhand</h5></td>
                        <td>
                            <select
                                v-model="props.character.data.offhand"
                                id="equipment-select"
                                :disabled="!canUseOffhand"
                            >
                                <option disabled value="">Select an offhand...</option>
                                <option v-for="offhand in offhands" :value="offhand" :key="offhand.id">
                                    Lv. {{ offhand.level }} {{ offhand.name.en }}
                                </option>
                            </select>
                        </td>
                        <td>
                            <button
                                class="btn-plus"
                                @click="
                                    {
                                        props.character.data.offhand = null;
                                    }
                                "
                            >
                                x
                            </button>
                        </td>
                    </tr>

                    <tr>
                        <td><h5>Offhand upgrade</h5></td>
                        <td>
                            <select
                                v-model="props.character.data.offhandUpgrade"
                                id="equipment-select"
                                :disabled="!props.character.data.offhand"
                            >
                                <option disabled value="">Select an upgrade level...</option>
                                <option v-for="(e, i) in 11" :value="i" :key="i">+{{ i }}</option>
                            </select>
                        </td>
                    </tr>

                    <tr>
                        <td><h5>Earring</h5></td>
                        <td>
                            <select
                                v-model="props.character.data.earringR"
                                id="equipment-select"
                            >
                                <option disabled value="">Select an earring...</option>
                                <option v-for="earring in earrings" :value="earring" :key="earring.id">
                                    Lv. {{ earring.level }} {{ earring.name.en }}
                                </option>
                            </select>
                        </td>
                        <td>
                            <button
                                class="btn-plus"
                                @click="
                                    {
                                        props.character.data.earringR = null;
                                    }
                                "
                            >
                                x
                            </button>
                        </td>
                    </tr>

                    <tr>
                        <td><h5>Earring</h5></td>
                        <td>
                            <select
                                v-model="props.character.data.earringL"
                                id="equipment-select"
                            >
                                <option disabled value="">Select an earring...</option>
                                <option v-for="earring in earrings" :value="earring" :key="earring.id">
                                    Lv. {{ earring.level }} {{ earring.name.en }}
                                </option>
                            </select>
                        </td>
                        <td>
                            <button
                                class="btn-plus"
                                @click="
                                    {
                                        props.character.data.earringL = null;
                                    }
                                "
                            >
                                x
                            </button>
                        </td>
                    </tr>

                    <tr>
                        <td><h5>Necklace</h5></td>
                        <td>
                            <select
                                v-model="props.character.data.necklace"
                                id="equipment-select"
                            >
                                <option disabled value="">Select a necklace...</option>
                                <option v-for="necklace in necklaces" :value="necklace" :key="necklace.id">
                                    Lv. {{ necklace.level }} {{ necklace.name.en }}
                                </option>
                            </select>
                        </td>
                        <td>
                            <button
                                class="btn-plus"
                                @click="
                                    {
                                        props.character.data.necklace = null;
                                    }
                                "
                            >
                                x
                            </button>
                        </td>
                    </tr>

                    <tr>
                        <td><h5>Ring</h5></td>
                        <td>
                            <select
                                v-model="props.character.data.ringR"
                                id="equipment-select"
                            >
                                <option disabled value="">Select a ring...</option>
                                <option v-for="ring in rings" :value="ring" :key="ring.id">
                                    Lv. {{ ring.level }} {{ ring.name.en }}
                                </option>
                            </select>
                        </td>
                        <td>
                            <button
                                class="btn-plus"
                                @click="
                                    {
                                        props.character.data.ringR = null;
                                    }
                                "
                            >
                                x
                            </button>
                        </td>
                    </tr>

                    <tr>
                        <td><h5>Ring</h5></td>
                        <td>
                            <select
                                v-model="props.character.data.ringL"
                                id="equipment-select"
                            >
                                <option disabled value="">Select a ring...</option>
                                <option v-for="ring in rings" :value="ring" :key="ring.id">
                                    Lv. {{ ring.level }} {{ ring.name.en }}
                                </option>
                            </select>
                        </td>
                        <td>
                            <button
                                class="btn-plus"
                                @click="
                                    {
                                        props.character.data.ringL = null;
                                    }
                                "
                            >
                                x
                            </button>
                        </td>
                    </tr>

                    <tr>
                        <td><h5>Cloak</h5></td>
                        <td>
                            <select
                                v-model="props.character.data.cloak"
                                id="equipment-select"
                            >
                                <option disabled value="">Select a cloak...</option>
                                <option v-for="cloak in cloaks" :value="cloak" :key="cloak.id">
                                    {{ cloak.name.en }}
                                </option>
                            </select>
                        </td>
                        <td>
                            <button
                                class="btn-plus"
                                @click="
                                    {
                                        props.character.data.cloak = null;
                                    }
                                "
                            >
                                x
                            </button>
                        </td>
                    </tr>

                    <tr>
                        <td><h5>Suit Piercing</h5></td>
                        <td>
                            <select
                                v-model="props.character.data.suitPiercing"
                                id="equipment-select"
                            >
                                <option disabled value="">Select a card...</option>
                                <option v-for="card in piercingCards" :value="card" :key="card.id">
                                    {{ card.name.en }}
                                </option>
                            </select>
                        </td>
                        <td>
                            <button
                                class="btn-plus"
                                @click="
                                    {
                                        props.character.data.suitPiercing = null;
                                    }
                                "
                            >
                                x
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style scoped lang="scss">
input[type="text"] {
    width: auto;
    border-radius: 10px;
    margin: auto 10px;
}

select#equipment-select {
    margin-right: 20px;
    width: 140px;
    text-align: center;
}

select:disabled {
    opacity: 0.3;
}

button.btn-plus {
    padding: 0px 5px;
}
</style>
