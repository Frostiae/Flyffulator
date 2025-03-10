import ItemElem from "./flyffitemelem";
import pets from "../assets/Pets.json";
import items from "../assets/Items.json";
import skills from "../assets/Skills.json";
import classes from "../assets/Classes.json";
import equipSets from "../assets/EquipSets.json";
import statAwakes from "../assets/StatAwakes.json";
import partySkills from "../assets/PartySkills.json";
import upgradeBonus from "../assets/UpgradeBonus.json";

export const JOBS = {
    9686: 0, // Vagrant

    764: 1, // Mercenary
    9098: 2, // Acrobat
    8962: 3, // Assist
    9581: 4, // Magician
    0: 5,

    5330: 6, // Knight
    2246: 7, // Blade
    3545: 8, // Jester
    9295: 9, // Ranger
    9389: 10, // Ringmaster
    7424: 11, // Billposter
    5709: 12, // Psykeeper
    9150: 13, // Elementor
    1: 14,
    2: 15
};

export const DEFAULT_WEAPON = new ItemElem({
    id: -1,
    minAttack: 1,
    maxAttack: 2,
    attackSpeedValue: 0.07,
    category: "weapon",
    subcategory: "hand",
    additionalSkillDamage: 0,
    element: "none"
});

export const TRAINING_DUMMY = {
    name: { en: "Training Dummy" },
    levelHidden: true,
    level: 1,
    element: "none",
    rank: "captain",
    hp: Infinity,
    minAttack: 1,
    maxAttack: 1,
    defense: 133,
    magicDefense: 0,
    parry: 82,
    str: 15,
    sta: 1,
    dex: 1,
    int: 15,
    resistFire: 0,
    resistWater: 0,
    resistWind: 0,
    resistEarth: 0,
    resistElectricity: 0,
    experience: 0,
    speed: 0,
    minDropGold: 1,
    maxDropGold: 1,
    dummy: true,
    hitRate: 1
};

export const ATTACK_FLAGS = {
    GENERIC: 1 << 0,
    MISS: 1 << 1, // Miss (due to attacker hit rate).
    MAGIC: 1 << 2, // Magic attack.
    MELEESKILL: 1 << 3, // Melee skill usage.
    MAGICSKILL: 1 << 4, // Magic skill usage.
    CRITICAL: 1 << 5, // Critical attack (high damage).
    BLOCKING: 1 << 6, // Blocked attack (low damage).
    FORCE: 1 << 7, // Forced attack (no defense).
    RANGE: 1 << 8, // Range attack.
    FLYING: 1 << 9, // Attack making the defenser fly.
    PARRY: 1 << 11, // Parry (miss due to defender parry rate).
    DAMAGE_OVER_TIME: 1 << 12, // Damage-Over-Time due to poison/bleeding skill.
    NO_TARGET: 1 << 13, // Attack without a specific target.
    DOUBLE: 1 << 14, // Target takes double damage.
    REGION: 1 << 15 // AoE skill.
};

export function getClassById(id) {
    return classes[id];
}

export function getItemById(id) {
    return items[id];
}

export function getSkillById(id) {
    return skills[id];
}

export function getPartySkillById(id) {
    return partySkills[id];
}

/**
 * @param {Number} baseJobId The ID of the job to compare to.
 * @param {Number} otherJobId The ID of the job to check.
 * @returns Whether or not the base job is or has been through the given job.
 */
export function isAnteriorJob(baseJobId, otherJobId) {
    if (otherJobId == 9686 || otherJobId == baseJobId) {
        return true;
    }

    const defineId = JOBS[otherJobId];
    if (defineId > JOBS[9686] && defineId < 6) {
        if (defineId * 2 + 4 == JOBS[baseJobId] || defineId * 2 + 5 == JOBS[baseJobId]) {
            return true;
        }
    }

    return false;
}

/**
 * @param {Number} classId The base class ID.
 * @returns A list of class IDs the given class has been through.
 */
export function getAnteriorClassIds(classId) {
    const ids = [classId];

    for (const [id,] of Object.entries(classes)) {
        if (id != classId && isAnteriorJob(classId, id)) {
            ids.push(id);
        }
    }

    return ids.reverse();
}

export function getClassSkills(classId) {
    const res = [];
    for (const [, skill] of Object.entries(skills)) {
        if (skill.class == classId) {
            res.push(skill);
        }
    }

    return res;
}

export function getEquipSetByItemId(id) {
    // this is kinda slow but what can you do
    for (const [, set] of Object.entries(equipSets)) {
        if (set.parts.includes(id)) {
            return set;
        }
    }

    return null;
}

export function getPetDefinitionByItemId(itemId) {
    for (const [, pet] of Object.entries(pets)) {
        if (pet.petItemId == itemId) {
            return pet;
        }
    }

    return null;
}

export function getPetTierByLevels(levels) {
    switch (Object.values(levels).filter((el) => el).length) {
        case 1: return "F";
        case 2: return "E";
        case 3: return "D";
        case 4: return "C";
        case 5: return "B";
        case 6: return "A";
        case 7: return "S";
        default: "Oops";
    }
}

export function getPetOptionsForTier(tier) {
    switch (tier) {
        case "F": return [1];
        case "E": return [1, 2];
        case "D": return [1, 2, 3];
        case "C": return [1, 2, 3, 4];
        case "B": return [1, 2, 3, 4, 5];
        case "A": return [1, 2, 3, 4, 5, 6, 7];
        case "S": return [1, 2, 3, 4, 5, 6, 7, 8, 9];
        default: return [];
    }
}

export function getPetStatSum(raisedPetDefinition, levels) {
    return Object.values(levels).reduce((prevSum, currentLevel) => {
        if (!currentLevel) return prevSum;

        return prevSum + raisedPetDefinition.values[currentLevel - 1];
    }, 0);
}

export function getPetModelPath(itemId) {
    switch (itemId) {
        case 5851: return "/model/pettiger.glb";
        case 9941: return "/model/petlion.glb";
        case 5471: return "/model/petrabbit.glb";
        case 4817: return "/model/petfox.glb";
        case 885: return "/model/petdragon.glb";
        case 2563: return "/model/petgriffin.glb";
        case 148: return "/model/petunicorn.glb";
        case 1644: return "/model/petangel.glb";
        case 6296: return "/model/petcrab.glb";
        default: return "/model/pettiger.glb";
    }
}

export function getPetCameraPosition(itemId) {
    switch (itemId) {
        case 5851: return [1, 1.5, 2];
        case 9941: return [1, 0.7, 2];
        case 5471: return [1, 0.5, 1.5];
        case 4817: return [1, 1, 2];
        case 885: return [1, 1.8, 2];
        case 2563: return [1, 1.6, 2.3];
        case 148: return [2, 1.5, 2.5];
        case 1644: return [1, 2.3, 2];
        case 6296: return [3, 1.5, 5];
        default: return [1, 1.5, 2];
    }
}

export function getPetCameraLookAt(itemId) {
    switch (itemId) {
        case 5851: return [0, 0.7, 0.6];
        case 9941: return [0, 0.5, 0.6];
        case 5471: return [0, 0.3, 0.2];
        case 4817: return [0, 0.6, 0.6];
        case 885: return [0, 1.2, 0.4];
        case 2563: return [0, 1.2, 0.7];
        case 148: return [0, 0.8, 0.8];
        case 1644: return [0, 2.2, 0.2];
        case 6296: return [0, 0.7, 0.6];
        default: return [0, 0.7, 0.6];
    }
}

export function getUpgradeBonus(upgradeLevel) {
    return upgradeBonus[upgradeLevel - 1];
}

export function getItemNameColor(itemProp) {
    switch (itemProp.rarity) {
        case "uncommon": return "#c46200";
        case "rare": return "#00aa00";
        case "veryrare":
        case "unique":
            return "#d20000";
        case "ultimate": return "#7f00ff";
        default: return "#78d9ff";
    }
}

export function getWeakElement(element) {
    switch (element) {
        case "fire": return "water";
        case "water": return "electricity";
        case "wind": return "fire";
        case "electricity": return "earth";
        case "earth": return "wind";
        default: return "fire";
    }
}

export function getStrongElement(element) {
    switch (element) {
        case "fire": return "wind";
        case "water": return "fire";
        case "wind": return "earth";
        case "electricity": return "water";
        case "earth": return "electricity";
        default: return "fire";
    }
}

/**
 * @param {string} otherOption The current other parameter set
 * @param {number} itemLevel The level of the item
 * @returns An object containing the possible options that can be set alongside the given option
 */
export function getPossibleStatAwakeParams(otherOption, itemLevel) {
    if (otherOption == null || otherOption == "none") {
        return {
            "none": "None",
            "str": "STR",
            "sta": "STA",
            "dex": "DEX",
            "int": "INT"
        };
    }

    const res = { "none": "None" };
    for (const awake of statAwakes) {
        const params = awake.abilities.map((e) => e.parameter);
        if (!params.includes(otherOption) || params.length < 2) {
            continue;
        }

        const p = params.find((e) => e != otherOption);
        if (!Object.keys(res).includes(p)) {
            res[p] = p.toUpperCase();

            if (Object.keys(res).length >= 4) {
                break;
            }
        }
    }

    return res;
}

/**
 * @param {string} currentOption The current option to check allowed values for
 * @param {string} otherOption The other option currently set
 * @param {number} otherValue The value of the other set option
 * @param {number} itemLevel The level of the item
 * @returns A list of allowed values the current option can be set to
 */
export function getPossibleStatAwakeValues(currentOption, otherOption, otherValue, itemLevel) {
    if (currentOption == "none") {
        return [0];
    }

    if (otherOption == null || otherOption == "none") {
        return [1, 2, 3, 4];
    }

    const values = [1];
    for (const awake of statAwakes) {
        if (awake.abilities.length != 2) {
            continue;
        }

        const currentAbility = awake.abilities.find((e) => e.parameter == currentOption);
        const otherAbility = awake.abilities.find((e) => e.parameter == otherOption);

        if (!currentAbility || !otherAbility) {
            continue;
        }

        if (otherAbility.add != otherValue) {
            continue;
        }

        if (!values.includes(currentAbility.add)) {
            values.push(currentAbility.add);
        }
    }

    return values;
}

/**
 * @param {ItemElem} itemElem The item with a stat awake
 * @param {object} i18n Localization
 * @returns A string matching the appropriate stat awake title
 */
export function getStatAwakeTitle(itemElem, i18n) {
    const awakes = itemElem.statAwake.filter((e) => e);
    if (awakes.length == 0) {
        return "";
    }

    var shortLanguageCode = "en";
    if (i18n.resolvedLanguage) {
        shortLanguageCode = i18n.resolvedLanguage.split('-')[0];
    }


    for (const statAwake of statAwakes) {
        if (statAwake.abilities.length != awakes.length) {
            continue;
        }

        let match = true;
        for (const awake of awakes) {
            if (!statAwake.abilities.find((e) => e.parameter == awake.parameter && e.add == awake.value)) {
                match = false;
                break;
            }
        }

        if (match) {
            return statAwake.title[shortLanguageCode] ?? statAwake.title.en;
        }
    }

    console.error("Could not find an appropriate stat awake with the chosen values.");
    return "";
}

/**
 * Clamp a value between a minimum and maximum.
 * @param {Number} value The value to clamp.
 * @param {Number} min The minimum acceptable value.
 * @param {Number} max The maximum acceptable value.
 * @returns The clamped value.
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation.
 * @param {Number} a The starting value.
 * @param {Number} b The ending value.
 * @param {Number} t The interpolation factor.
 */
export function mix(a, b, t) {
    return a * (1 - t) + b * t;
}

/**
 * Get a new unique identifier.
 */
export function getGuid() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
}
