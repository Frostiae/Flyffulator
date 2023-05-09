<script setup>
const props = defineProps(["character"]);
console.log("render");

function escapeRegex(string) {
    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
}

const getTooltip = (premiumItem) => {
    let tooltip = premiumItem.name.en + "\n";
    if (premiumItem.abilities) {
        premiumItem.abilities.forEach((ability) => {
            let effect = "";
            effect += ability.parameter;
            let add = ability.add;
            effect += "+" + add;
            if (ability.rate) effect += "%";
            effect += "\n";
            tooltip += effect;
        });
    }
    return tooltip;
};

const getImageUrl = (img, store) => {
    const rx = new RegExp(escapeRegex(img), "i");
    store = store || import.meta.glob("@/**/*.png", { eager: true });
    for (const i in store) {
        if (i.match(rx)) {
            let url = store[i].default;
            if (url.startsWith(".") || url.startsWith("/")) {
                return store[i].default.trimStart(".").trimStart("/");
            }
            return store[i].default;
        }
    }
    return getImageUrl("syssysquentskil");
};
const getIconUrl = (img) => {
    const itemIconImages = import.meta.globEager("@/assets/icons/items/**/*.png");
    return getImageUrl(img, itemIconImages);
};

const onChange = () => {
    props.character.data.forceUpdate = !props.character.data.forceUpdate;
};
</script>

<template>
    <div class="char">
        <h3>Premium Items</h3>
        <h5>Add premium items through the 'Your Character' module</h5>
        <div class="stats">
            <ul>
                <li
                    v-for="premiumItem in props.character.data.activePremiumItems"
                    :value="premiumItem"
                    :key="premiumItem.id"
                >
                    <input
                        type="checkbox"
                        name="enable-premiumItem"
                        id="enable-premiumItem"
                        v-model="premiumItem.enabled"
                        @change="onChange"
                    />
                    <img
                        :src="getIconUrl(premiumItem.icon)"
                        alt=""
                        :title="getTooltip(premiumItem)"
                        :class="{ disabled: premiumItem.enabled == false }"
                    />
                </li>
            </ul>
        </div>
    </div>
</template>
  
 
  
  <style scoped lang='scss'>
ul {
    list-style: none;
    padding: 10px;
    width: 100%;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
}

li {
    position: relative;
}

h5 {
    opacity: 0.5;
    margin: 0;
    margin-bottom: 20px;
}

input[type="checkbox"] {
    position: absolute;
    opacity: 0.8;
    z-index: 200;
}

img {
    transition: 0.2s;

    &.disabled {
        opacity: 0.2;
        transition: 0.2s;
    }
}
</style>
  