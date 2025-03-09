import upgradeBonus from "../assets/UpgradeBonus.json";
import * as Utils from "../flyff/flyffutils"

/**
 * An instance of an in-game item.
 */
export default class ItemElem {
    itemProp = null; // Static game item property from the API
    element = "none";
    upgradeLevel = 0;
    elementUpgradeLevel = 0;
    piercings = [];
    ultimateJewels = [];
    statRanges = []; // Values for item abilities when the item is ultimate with a range
    randomStats = [null, null]; // Random stats if the item has possible random stats
    originAwake = null;
    skillAwake = null;
    petStats = { F: 1, E: null, D: null, C: null, B: null, A: null, S: null }; // default value
    statAwake = null;


    constructor(itemProp) {
        this.itemProp = itemProp;

        // Stat ranges
        if (itemProp.abilities != undefined) {
            for (const ability of itemProp.abilities) {
                if (ability.addMax != undefined) {
                    const a = { ...ability, value: Math.floor(ability.add + (ability.addMax - ability.add) / 2) };
                    this.statRanges.push(a);
                }
            }
        }

        // Random stats for ultimate
        if (itemProp.possibleRandomStats != undefined && itemProp.possibleRandomStats.length >= 2) {
            for (let i = 0; i < 2; ++i) {
                // Just initialize with the first two
                const stat = itemProp.possibleRandomStats[i];
                this.randomStats[i] = { ...stat, id: i, value: Math.floor(stat.add + (stat.addMax - stat.add) / 2) };
            }
        }
    }

    toJSON() {
        const { itemProp, piercings, ultimateJewels, ...rest } = this;
        const shrinked = {
            ...rest,
            // Add ID so itemProp can be restored later
            id: itemProp.id,
            // Serialize only IDs for piercing cards and ultimate jewels because everything else is unnecessary
            piercings: piercings.map(itemElem => itemElem.itemProp.id),
            ultimateJewels: ultimateJewels.map(itemElem => itemElem.itemProp.id),
        };

        // Strip even further by removing properties with default values and thus reducing the JSON size substantially.
        // When ItemElem gets deserialized the default properties are restored.
        if (shrinked.element === 'none') {
            delete shrinked.element;
        }

        if (shrinked.upgradeLevel === 0) {
            delete shrinked.upgradeLevel;
        }

        if (shrinked.elementUpgradeLevel === 0) {
            delete shrinked.elementUpgradeLevel;
        }

        if (shrinked.piercings.length === 0) {
            delete shrinked.piercings;
        }

        if (shrinked.ultimateJewels.length === 0) {
            delete shrinked.ultimateJewels;
        }

        if (shrinked.statRanges.length === 0) {
            delete shrinked.statRanges;
        }

        if (shrinked.randomStats.length === 2 && shrinked.randomStats[0] === null && shrinked.randomStats[1] === null) {
            delete shrinked.randomStats;
        }

        if (shrinked.originAwake === null) {
            delete shrinked.originAwake;
        }

        if (shrinked.skillAwake === null) {
            delete shrinked.skillAwake;
        }

        if (this.itemProp.category !== 'raisedpet') {
            delete shrinked.petStats;
        }

        return shrinked;
    }

    /**
     * @returns Whether or not this item can take an origin awake (of STR, etc).
     */
    isOriginAwakeAble() {
        return false; // TODO: Add something to the API. There are tons of combinations
        //return this.itemProp.category == "weapon" || this.itemProp.category == "armor";
    }

    /**
     * @returns Whether or not this item can be element upgraded.
     */
    isElementUpgradeAble() {
        return this.itemProp.category == "weapon" || this.itemProp.subcategory == "suit";
    }

    /**
     * @returns Whether or not this item can be skill awakened.
     */
    isSkillAwakeAble() {
        return this.itemProp.category == "weapon" || this.itemProp.subcategory == "shield";
    }

    /**
     * @returns Whether or not this item can be stat awakened.
     */
    isStatAwakeAble() {
        return this.itemProp.category == "weapon" || this.itemProp.subcategory == "shield" || this.itemProp.category == "armor"; 
    }

    /**
     * @returns The maximum number of upgrade levels this item can get to.
     */
    getMaximumUpgradeLevel() {
        if (this.itemProp.category == "jewelry" && this.itemProp.upgradeLevels != undefined) {
            return this.itemProp.upgradeLevels.length - 1;
        }

        if (this.itemProp.category == "collector") {
            return 5;
        }

        if (this.itemProp.category == "weapon" || this.itemProp.category == "armor") {
            if (this.itemProp.rarity == "ultimate") {
                return 5;
            }

            return 10;
        }

        return 0;
    }

    /**
     * @returns The maximum number of allowed piercing slots this item can have.
     */
    getMaximumPiercingSlots() {
        if (this.itemProp.subcategory == "suit") {
            return 4;
        }

        if (this.itemProp.subcategory == "shield") {
            return 5;
        }

        if (this.itemProp.category == "weapon") {
            if (this.itemProp.twoHanded) {
                return 10;
            }

            return 5;
        }

        return 0;
    }

    /**
     * @returns The maximum number of allowed ultimate jewel slots this item can have.
     */
    getMaximumUltimateJewelSlots() {
        if (this.itemProp.rarity != "ultimate") {
            return 0;
        }

        if (this.itemProp.category != "weapon") {
            return 0;
        }

        return this.upgradeLevel;
    }

    /**
     * @returns The attack or defense multiplier from the upgrade level for a weapon or armor.
     */
    getUpgradeMultiplier() {
        if (this.itemProp.category != "weapon" && this.itemProp.category != "armor") {
            return 0;
        }

        let value = 1;
        let upgradeLevel = this.upgradeLevel;
        if (this.itemProp.rarity == "ultimate") {
            upgradeLevel += 10;
        }

        if (upgradeLevel > 0) {
            let upgradeFactor = upgradeBonus[upgradeLevel - 1].weaponAttack;

            switch (this.itemProp.subcategory) {
                case "helmet":
                    upgradeFactor = upgradeBonus[upgradeLevel - 1].helmetDefense;
                    break;
                case "suit":
                    upgradeFactor = upgradeBonus[upgradeLevel - 1].suitDefense;
                    break;
                case "gauntlet":
                    upgradeFactor = upgradeBonus[upgradeLevel - 1].gauntletDefense;
                    break;
                case "boots":
                    upgradeFactor = upgradeBonus[upgradeLevel - 1].bootsDefense;
                    break;
            }

            value += value * upgradeFactor / 100;
        }

        return value;
    }
}