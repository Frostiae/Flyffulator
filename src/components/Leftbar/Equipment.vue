<script setup>
import { reactive, watch, ref } from "vue";
import { Blade } from "../../calc/jobs";
import { Utils } from "../../calc/utils";

const props = defineProps(["character"]);

const weapons = reactive({
    data: Utils.getJobWeapons(props.character.data.jobId).sort(Utils.sortByLevel),
});
const armors = reactive({
    data: Utils.getJobArmors(props.character.data.jobId).sort(Utils.sortByLevel),
});
const rings = reactive({ data: Utils.getJewelery("ring").sort(Utils.sortByName) });
const earrings = reactive({ data: Utils.getJewelery("earring").sort(Utils.sortByName) });
const necklaces = reactive({ data: Utils.getJewelery("necklace").sort(Utils.sortByName) });
const piercingCards = reactive({ data: Utils.getPiercingCards().sort(Utils.sortByName) });
const cloaks = reactive({ data: Utils.getCloaks().sort(Utils.sortByName) });
const shields = reactive({ data: Utils.getShields().sort(Utils.sortByLevel) });

const canUseOffhand = ref(false);

function updateDropdowns() {
    weapons.data = Utils.getJobWeapons(props.character.data.jobId).sort(Utils.sortByLevel);
    armors.data = Utils.getJobArmors(props.character.data.jobId).sort(Utils.sortByLevel);
    rings.data = Utils.getJewelery("ring").sort(Utils.sortByName);
    earrings.data = Utils.getJewelery("earring").sort(Utils.sortByName);
    necklaces.data = Utils.getJewelery("necklace").sort(Utils.sortByName);
    piercingCards.data = Utils.getPiercingCards().sort(Utils.sortByName);
    cloaks.data = Utils.getCloaks().sort(Utils.sortByName);
    shields.data = Utils.getShields().sort(Utils.sortByLevel);
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

const offhands = reactive({ data: [...shields.data] });
if (props.character.data instanceof Blade) {
    offhands.data = [];
    offhands.data = [...shields.data];
    offhands.data = offhands.data.concat(weapons.data);
}

function updateEquipment(newEquipment) {
    props.character.armor = byId(armors.data, newEquipment.armor);
    props.character.armorUpgrade = newEquipment.armorUpgrade;
    props.character.mainhandUpgrade = newEquipment.mainhandUpgrade;
    props.character.offhandUpgrade = newEquipment.offhandUpgrade;
    props.character.mainhand = byId(weapons.data, newEquipment.mainhand) || Utils.getItemByName("Wooden Sword");

    props.character.offhand = byId(offhands.data.concat(weapons.data), newEquipment.offhand);
    props.character.earringR = byId(earrings.data, newEquipment.earringR);
    props.character.earringL = byId(earrings.data, newEquipment.earringL);
    props.character.necklace = byId(necklaces.data, newEquipment.necklace);
    props.character.ringR = byId(rings.data, newEquipment.ringR);
    props.character.ringL = byId(rings.data, newEquipment.ringL);
    props.character.cloak = byId(cloaks.data, newEquipment.cloak);
    props.character.suitPiercing = byId(piercingCards.data, newEquipment.suitPiercing);
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
                                @change="updateEquipment"
                            >
                                <option disabled value="">Select an armor set...</option>
                                <option v-for="set in armors.data" :value="set" :key="set.id">
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
                                        updateEquipment();
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
                                @change="updateEquipment"
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
                                @change="updateEquipment"
                            >
                                <option disabled value="">Select a weapon...</option>
                                <option v-for="weapon in weapons.data" :value="weapon" :key="weapon.id">
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
                                @change="updateEquipment"
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
                                @change="updateEquipment"
                                :disabled="!canUseOffhand"
                            >
                                <option disabled value="">Select an offhand...</option>
                                <option v-for="offhand in offhands.data" :value="offhand" :key="offhand.id">
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
                                        updateEquipment();
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
                                @change="updateEquipment"
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
                                @change="updateEquipment"
                            >
                                <option disabled value="">Select an earring...</option>
                                <option v-for="earring in earrings.data" :value="earring" :key="earring.id">
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
                                        updateEquipment();
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
                                @change="updateEquipment"
                            >
                                <option disabled value="">Select an earring...</option>
                                <option v-for="earring in earrings.data" :value="earring" :key="earring.id">
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
                                        updateEquipment();
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
                                @change="updateEquipment"
                            >
                                <option disabled value="">Select a necklace...</option>
                                <option v-for="necklace in necklaces.data" :value="necklace" :key="necklace.id">
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
                                        updateEquipment();
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
                                @change="updateEquipment"
                            >
                                <option disabled value="">Select a ring...</option>
                                <option v-for="ring in rings.data" :value="ring" :key="ring.id">
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
                                        updateEquipment();
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
                                @change="updateEquipment"
                            >
                                <option disabled value="">Select a ring...</option>
                                <option v-for="ring in rings.data" :value="ring" :key="ring.id">
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
                                        updateEquipment();
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
                                @change="updateEquipment"
                            >
                                <option disabled value="">Select a cloak...</option>
                                <option v-for="cloak in cloaks.data" :value="cloak" :key="cloak.id">
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
                                        updateEquipment();
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
                                @change="updateEquipment"
                            >
                                <option disabled value="">Select a card...</option>
                                <option v-for="card in piercingCards.data" :value="card" :key="card.id">
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
                                        updateEquipment();
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
