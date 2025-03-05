import Context from "./flyffcontext";
import ItemElem from "./flyffitemelem";
import * as Utils from "./flyffutils";

/**
 * A Flyff character or monster.
 */
export default class Entity {
    monsterProp = null;

    job = Utils.getClassById(9686); // Vagrant
    equipment = {
        mainhand: Utils.DEFAULT_WEAPON,
        offhand: null,
        cloak: null,
        mask: null,
        ring1: null,
        earring1: null,
        necklace: null,
        ring2: null,
        earring2: null,
        helmet: null,
        suit: null,
        gauntlets: null,
        boots: null,
        fashHelmet: null,
        fashSuit: null,
        fashGauntlets: null,
        fashBoots: null,
        pet: null
    };
    skillLevels = {};
    activeBuffs = {};
    activePersonalHousingNpcs = [];
    activeCoupleHousingNpcs = [];
    activeGuildHousingNpcs = [];
    activeItems = [];
    equipSets = []; // Current armor sets equipped. Cached because the lookup is really slow.
    level = 1;
    str = 15;
    sta = 15;
    dex = 15;
    int = 15;
    bufferStr = 15;
    bufferSta = 15;
    bufferDex = 15;
    bufferInt = 15;

    constructor(monsterProp) {
        this.monsterProp = monsterProp;

        if (monsterProp != null) {
            this.str = monsterProp.str;
            this.sta = monsterProp.sta;
            this.dex = monsterProp.dex;
            this.int = monsterProp.int;
            this.level = monsterProp.levelHidden ? -1 : monsterProp.level;
        }
    }

    /**
     * Serialize this player into a JSON string.
     */
    serialize() {
        return JSON.stringify(this);
    }

    /**
     * Unserialize this instance into a player represented by the given JSON string.
     * @param {string} json The JSON string representing a character.
     */
    unserialize(json) {
        Object.assign(this, JSON.parse(json));

        // Need to unserialize any items to ItemElem instances

        for (const [slot, item] of Object.entries(this.equipment)) {
            if (item == null) {
                continue;
            }

            const itemElem = new ItemElem(item.itemProp);
            this.equipment[slot] = Object.assign(itemElem, item);

            for (let i = 0; i < itemElem.piercings.length; i++) {
                const cardElem = new ItemElem(itemElem.piercings[i].itemProp);
                itemElem.piercings[i] = cardElem;
            }

            for (let i = 0; i < itemElem.ultimateJewels.length; i++) {
                const jewelElem = new ItemElem(itemElem.ultimateJewels[i].itemProp);
                itemElem.ultimateJewels[i] = jewelElem;
            }
        }

        const tempItems = [];
        for (let item of this.activeItems) {
            let itemElem = new ItemElem(item.itemProp);
            itemElem = Object.assign(itemElem, item);
            tempItems.push(itemElem);
        }

        this.activeItems = tempItems;
    }

    isMonster() {
        return this.monsterProp != null;
    }

    isPlayer() {
        return !this.isMonster();
    }

    /**
     * Reset this entity's equipment, wearing only a default weapon (hands).
     */
    resetEquipment() {
        for (const slot of Object.keys(this.equipment)) {
            this.equipment[slot] = null;
        }

        this.equipment.mainhand = Utils.DEFAULT_WEAPON;
    }

    /**
     * @returns The total number of stat points this player has available.
     */
    getRemainingStatPoints() {
        if (this.isMonster()) {
            return 0;
        }

        const total = this.level * 2 - 2;
        const extra = (this.str + this.sta + this.dex + this.int) - 60;
        return total - extra;
    }

    /**
     * @returns The total number of skill points this player has available.
     */
    getRemainingSkillPoints() {
        if (this.isMonster()) {
            return 0;
        }

        // TODO: This level based stuff isn't correct past level 120

        let total = 0;
        if (this.level <= 20) {
            total = 2 * this.level - 2;
        }
        else if (this.level <= 40) {
            total = 3 * this.level - 22;
        }
        else if (this.level <= 60) {
            total = 4 * this.level - 62;
        }
        else if (this.level <= 80) {
            total = 5 * this.level - 122;
        }
        else if (this.level <= 100) {
            total = 6 * this.level - 202;
        }
        else {
            total = 7 * this.level - 302;
        }

        // Job change quest reward

        switch (this.job.name.en) {
            case "Mercenary":
                total += 40;
                break;
            case "Acrobat":
                total += 50;
                break;
            case "Assist":
                total += 60;
                break;
            case "Magician":
                total += 90;
                break;
            case "Knight":
            case "Blade":
                total += 120;
                break;
            case "Ranger":
            case "Jester":
                total += 150;
                break;
            case "Ringmaster":
                total += 160;
                break;
            case "Billposter":
            case "Psykeeper":
                total += 180;
                break;
            case "Elementor":
                total += 390;
                break;
            default:
                break;
        }

        // Subtract allocated points

        for (const [skillId, level] of Object.entries(this.skillLevels)) {
            const skillProp = Utils.getSkillById(skillId);

            if (!this.canUseSkill(skillProp)) {
                continue; // Skill could have points saved but can't use it
            }

            let multiplier = 1;
            if (skillProp.level >= 60) {
                multiplier = 3;
            }
            else if (skillProp.level >= 15) {
                multiplier = 2;
            }

            total -= level * multiplier;
        }

        return total;
    }

    /**
     * Whether or not this player can equip the given item.
     * @param {object} itemProp The item property to check.
     */
    canEquip(itemProp) {
        if (this.isMonster()) {
            return false;
        }

        if (itemProp.level > this.level) {
            return false;
        }

        if (itemProp.class != undefined && !Utils.isAnteriorJob(this.job.id, itemProp.class)) {
            return false;
        }

        return true;
    }

    /**
     * Whether or not this player can use the given skill.
     * @param {object} skillProp The skill to check.
     */
    canUseSkill(skillProp) {
        if (this.isMonster()) {
            return false;
        }

        if (skillProp.class != undefined && !Utils.isAnteriorJob(this.job.id, skillProp.class)) {
            return false;
        }

        if (skillProp.level > this.level) {
            return false;
        }

        if (skillProp.weapon != undefined && this.equipment.mainhand.itemProp.subcategory != skillProp.weapon) {
            return false;
        }

        if (skillProp.requirements != undefined) {
            for (const req of skillProp.requirements) {
                if (!(req.skill in this.skillLevels)) {
                    return false;
                }

                if (req.level > this.skillLevels[req.skill]) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Whether or not this player can use the given item.
     * @param {object} itemProp The item to check.
     */
    canUseItem(itemProp) {
        if (this.isMonster()) {
            return false;
        }

        if (itemProp.level != undefined && itemProp.level > this.level) {
            return false;
        }

        if (itemProp.class != undefined && !Utils.isAnteriorJob(this.job.id, itemProp.class)) {
            return false;
        }

        return true;
    }

    getSkillLevel(skillId) {
        if (skillId in this.skillLevels) {
            return this.skillLevels[skillId];
        }

        return 0;
    }

    /**
     * @param {String} stat The base stat to get (str, sta, dex, or int)
     * @returns The total value of the given stat.
     */
    getBaseStat(stat) {
        const allowed = ["sta", "str", "dex", "int"];
        if (!allowed.includes(stat)) {
            return 0;
        }

        return this[stat] + this.getStat(stat, false);
    }

    /**
     * @returns This player's maximum health.
     */
    getHP() {
        if (this.isMonster()) {
            return this.monsterProp.hp;
        }

        // Base HP calculation
        const levelFactor = this.job.hp * this.level;
        const baseValue = 150;
        const statScale = 1 + this.getBaseStat("sta") * 0.01;
        const levelScale = levelFactor * 20;
        const baseHP = Math.floor(baseValue + statScale * levelScale);

        // Extra HP
        const maxRate = 1 + this.getStat("maxhp", true) / 100;
        const maxFlat = Math.max(0, this.getStat("maxhp", false));

        return Math.floor((baseHP + maxFlat) * maxRate);
    }

    /**
     * @returns This player's maximum MP.
     */
    getMP() {
        if (this.isMonster()) {
            return this.monsterProp.mp;
        }

        // Base MP calculation
        const baseValue = 22;
        const levelScale = this.level * 2;
        const statScale = this.getBaseStat("int") * 9;
        const baseMP = Math.floor(baseValue + this.job.mp * (levelScale + statScale));

        // Extra MP
        const maxRate = 1 + this.getStat("maxmp", true) / 100;
        const maxFlat = Math.max(0, this.getStat("maxmp", false));

        return Math.floor((baseMP + maxFlat) * maxRate);
    }

    /**
     * @returns This player's maximum FP.
     */
    getFP() {
        if (this.isMonster()) {
            return 0;
        }

        // Base FP calculation
        const levelScale = this.level * 2;
        const statScale = this.getBaseStat("sta") * 7;
        const baseFP = Math.floor(this.job.fp * (levelScale + statScale));

        // Extra FP
        const maxRate = 1 + this.getStat("maxfp", true) / 100;
        const maxFlat = Math.max(0, this.getStat("maxfp", false));

        return Math.floor((baseFP + maxFlat) * maxRate);
    }

    /**
     * @returns This entity's movement speed.
     */
    getMovementSpeed() {
        let speed = Math.floor((this.isMonster() ? this.monsterProp.speed : 0.116) / 0.116 * 100.0);
        const speedBonus = this.getStat("speed", true);
        if (speedBonus != 0) {
            speed += speed * speedBonus / 100;
        }

        return Math.floor(Math.max(speed, 0));
    }

    /**
     * @returns This player's attack speed.
     */
    getAttackSpeed() {
        if (this.isMonster()) {
            return 1;
        }

        const plusValue = [
            0.08, 0.16, 0.24, 0.32, 0.40,
            0.48, 0.56, 0.64, 0.72, 0.80,
            0.88, 0.96, 1.04, 1.12, 1.20,
            1.30, 1.38, 1.50
        ];

        const weaponAttackSpeed = this.equipment.mainhand.itemProp.attackSpeedValue;
        const dex = this.getBaseStat("dex");
        const statScale = 4 * dex + this.level / 8;

        const minBaseSpeed = 0.125;
        const maxBaseSpeed = 2.0;
        const baseSpeedScaling = 200.0;

        const baseDividend = baseSpeedScaling * minBaseSpeed;
        const maxBaseScaledSpeed = baseSpeedScaling - baseDividend / maxBaseSpeed;

        const baseSpeed = Math.floor(Math.min(this.job.attackSpeed + weaponAttackSpeed * statScale, maxBaseScaledSpeed));

        let speed = baseDividend / (baseSpeedScaling - baseSpeed);
        const plusValueIndex = Math.floor(Utils.clamp(baseSpeed / 10, 0, plusValue.length - 1));
        speed += plusValue[plusValueIndex];

        const attackSpeed = this.getStat("attackspeed", true) / 1000 * 20;
        speed += attackSpeed;

        const attackSpeedRate = this.getStat("attackspeedrate", true);
        if (attackSpeedRate > 0) {
            speed += speed * attackSpeedRate / 100;
        }

        speed = Utils.clamp(speed, 0.1, 2.0);

        return speed;
    }

    /**
     * @returns This player's displayed attack in the character window.
     */
    getAttack() {
        const hit = this.getHitMinMax(false);
        let average = (hit.min + hit.max) / 2;

        // Upcut stone here for some reason
        for (const itemElem of this.activeItems) {
            if (itemElem.itemProp.id == 8691) { // Upcut stone
                average = Math.floor(average * 1.2);
                break;
            }
        }

        const extraRate = this.getStat("attack", true);
        if (extraRate > 0) {
            average += average * extraRate / 100;
        }

        average += this.getStat("attack", false);
        return Math.floor(Math.max(average, 0));
    }

    getDefense() {
        let defense = 0;
        if (Context.attackFlags & Utils.ATTACK_FLAGS.MAGICSKILL
            || (Context.attackFlags & Utils.ATTACK_FLAGS.MAGIC && this.isPlayer())
        ) {
            // Magic defense
            if (this.isPlayer()) {
                defense = Math.floor(
                    this.job.magicDefenseIntFactor * this.getBaseStat("int") +
                    this.job.magicDefenseStaFactor * this.getBaseStat("sta") +
                    this.getStat("magicdefense", false));
            }
            else {
                defense = this.getStat("magicdefense", false);
            }
        }
        else if (Context.attackFlags & Utils.ATTACK_FLAGS.GENERIC || Context.isPVP()) {
            // Auto attacks
            const jobFactor = this.isPlayer() ? this.job.defense : 1;

            let level = this.level;
            let equipmentDefense = this.getEquipmentDefense();
            if (this.isMonster() && this.level == -1) {
                level = Context.attacker.level;
                equipmentDefense = equipmentDefense * level / 100;
            }

            const staFactor = 0.75;
            const levelScale = 2.0 / 2.8;
            const statScale = 0.5 / 2.8;

            const sta = this.getBaseStat("sta");
            defense = Math.floor(level * levelScale + (sta * statScale + (sta - 14) * jobFactor) * staFactor - 4);
            defense += Math.floor(equipmentDefense / 4);
            defense += this.getStat("def", false);
        }
        else {
            // Melee skill or wand attack
            if (this.isMonster()) {
                if (Context.attackFlags & Utils.ATTACK_FLAGS.MAGIC) {
                    defense = this.monsterProp.magicDefense;
                }
                else {
                    defense = this.monsterProp.defense;
                }

                if (this.level == -1) {
                    defense = defense * Context.attacker.level / 100;
                    if (Context.attackFlags & Utils.ATTACK_FLAGS.MAGIC) {
                        defense = Math.min(defense, 100);
                    }
                }

                defense = Math.floor(defense / 7 + 1);
            }
            else {
                defense = Math.floor((this.level + this.getBaseStat("sta") / 2 + this.getBaseStat("dex")) / 2.8 + this.level * 2 - 4);
                defense += Math.floor(this.getEquipmentDefense() / 4);
                defense += this.getStat("def", false);
            }
        }

        let defenseFactor = 1;
        if (Context.isPVP()) {
            defenseFactor *= 0.6; // pvp reduction

            if (Context.isSkillAttack()) {
                if (Context.skill.id == 5041 || Context.skill.id == 7156) {
                    // asal and hop
                    defenseFactor *= 0.5;
                }
            }
        }

        if (Context.isSkillAttack() && Context.skill.id == 9740) {
            // Armor penetrate
            defenseFactor *= 0.5;
        }

        defenseFactor *= 1 + this.getStat("def", true) / 100;
        defense = Math.floor(defense * defenseFactor);
        if (defense < 0) {
            defense = 0;
        }

        return defense;
    }

    /**
     * @returns This entity's parry.
     */
    getParry() {
        if (this.isMonster()) {
            if (this.level == -1) {
                return Math.floor(this.monsterProp.parry * Context.attacker.level / 100);
            }
            return this.monsterProp.parry;
        }

        return Math.floor(this.getBaseStat("dex") * 0.5) + this.getStat("parry", true);
    }

    /**
     * @param {Entity} defender The defender to check hit rate against.
     * @returns This entity's hit rate against the given defender. `prob` is used for parry, `probAdjusted` is overall chance.
     */
    getContextHitRate(defender) {
        let attackerLevel = this.level;
        if (this.isMonster() && this.level == -1) {
            attackerLevel = defender.level;
        }

        let defenderLevel = defender.level;
        if (defender.isMonster() && defender.level == -1) {
            defenderLevel = this.level;
        }

        let factor = 0;
        if (this.isMonster() && defender.isPlayer()) {
            factor = 1.5 * 2.0 * (attackerLevel * 0.5 / (attackerLevel + defenderLevel * 0.3));
        }
        else if (this.isPlayer() && defender.isMonster()) {
            factor = 1.6 * 1.5 * (attackerLevel * 1.2 / (attackerLevel + defenderLevel));
        }
        else { // pvp
            // no level difference factor in pvp
            factor = 1.6 * 1.2 * (attackerLevel * 1.2 / (attackerLevel * 2));
        }

        let attackerHitRate = this.getBaseStat("dex");
        if (this.isMonster()) {
            attackerHitRate = this.monsterProp.hitRate;
            if (this.level == -1) {
                attackerHitRate = attackerHitRate * defender.level / 100;
            }
        }

        const defenderParryRate = defender.getParry();
        const hitRate = attackerHitRate / (attackerHitRate + defenderParryRate);
        const hitProb = Math.floor(hitRate * factor * 100);

        return { prob: hitProb, probAdjusted: Utils.clamp(hitProb + this.getStat("hitrate", true), 20, 96) };
    }

    /**
     * Get the amount of resistance this entity has towards the given element.
     * @param {string} element The element to check for.
     */
    getElementResistance(element) {
        let stat;
        let resistance;

        switch (element) {
            case "fire":
                stat = "firedefense";
                resistance = this.isMonster() ? this.monsterProp.resistFire : 0;
                break;
            case "water":
                stat = "waterdefense";
                resistance = this.isMonster() ? this.monsterProp.resistWater : 0;
                break;
            case "elctricity":
                stat = "electricitydefense";
                resistance = this.isMonster() ? this.monsterProp.resistElectricity : 0;
                break;
            case "wind":
                stat = "winddefense";
                resistance = this.isMonster() ? this.monsterProp.resistWind : 0;
                break;
            case "earth":
                stat = "earthdefense";
                resistance = this.isMonster() ? this.monsterProp.resistEarth : 0;
                break;
            default:
                return 0;
        }

        return (this.getStat(stat, true) + resistance) / 100;
    }

    /**
     * Get the minimum and maximum hit for the weapon in the given hand.
     * @param {Boolean} leftHand Whether or not to use the left hand weapon.
     */
    getHitMinMax(leftHand) {
        const hit = { min: 0, max: 0 };

        if (this.isMonster()) {
            hit.min = this.monsterProp.minAttack + 1;
            hit.max = this.monsterProp.maxAttack + 1;
            return hit;
        }

        let weaponProp = this.equipment.mainhand.itemProp;
        if (leftHand && this.equipment.offhand != null) {
            weaponProp = this.equipment.offhand.itemProp;
        }

        hit.min = weaponProp.minAttack * 2;
        hit.max = weaponProp.maxAttack * 2;

        hit.min += this.getStat("minability", false);
        hit.max += this.getStat("maxability", false);

        const plus = this.getWeaponAttack(weaponProp.subcategory) + this.getStat("damage", false);
        hit.min += plus;
        hit.max += plus;

        const weaponElem = leftHand ? this.equipment.offhand : this.equipment.mainhand;
        if (weaponElem != null) {
            const upgradeFactor = weaponElem.getUpgradeMultiplier();
            hit.min = Math.floor(hit.min * upgradeFactor);
            hit.max = Math.floor(hit.max * upgradeFactor);

            const upgradeLevel = weaponElem.upgradeLevel + (weaponElem.itemProp.rarity == "ultimate" ? 10 : 0);
            if (upgradeLevel > 0) {
                const bonus = Math.floor(Math.pow(upgradeLevel, 1.5));
                hit.min += bonus;
                hit.max += bonus;
            }
        }

        const spiritStrike = this.getStat("spiritstrike", true);
        if (spiritStrike > 0) {
            const bonus = Math.floor(spiritStrike * this.getFP() / 100);
            hit.min += bonus;
            hit.max += bonus;
        }

        return hit;
    }

    /**
     * @param {String} subcategory The subcategory of the weapon.
     * @returns The attack given from a weapon of the given subcategory.
     */
    getWeaponAttack(subcategory) {
        let levelFactor = 0;
        let statValue = 0;
        let addValue = 0;

        switch (subcategory) {
            case "sword":
            case "yoyo":
                levelFactor = 1.1;
                statValue = this.getBaseStat("str") - 12;
                break;
            case "axe":
                levelFactor = 1.2;
                statValue = this.getBaseStat("str") - 12;
                break;
            case "staff":
            case "hand":
                levelFactor = 1.1;
                statValue = this.getBaseStat("str") - 10;
                break;
            case "stick":
                levelFactor = 1.3;
                statValue = this.getBaseStat("str") - 10;
                break;
            case "knuckle":
                levelFactor = 1.2;
                statValue = this.getBaseStat("str") - 10;
                break;
            case "wand":
                levelFactor = 1.2;
                statValue = this.getBaseStat("int") - 10;
                break;
            case "bow":
                levelFactor = 0.91;
                statValue = this.getBaseStat("dex") - 14;
                addValue = 0.14 * this.getBaseStat("str");
                break;
        }

        const plusAttack = this.getStat(subcategory + "attack", false);
        const statAttack = statValue * ((subcategory == "hand" || this.isMonster()) ? 1 : this.job.autoAttackFactors[subcategory]);
        const levelAttack = this.level * levelFactor;

        return plusAttack + Math.floor(statAttack + levelAttack + addValue);
    }

    /**
     * Get the total amount of a stat applied to this player through their equipment, buffs, and active items.
     * @param {string} stat The stat to check for.
     * @param {boolean} rate If the state is a percentage or not.
     * @param {number} skillChanceId The ID of the skill chance to check for if `stat == skillchance`.
     * @returns The total amount.
     */
    getStat(stat, rate, skillChanceId = 0) {
        if (this.isMonster()) {
            return 0;
        }

        // Some parameters affect multiple stats so need a list of them all
        let targetStats = [stat];
        if (stat == "sta" || stat == "str" || stat == "dex" || stat == "int") {
            targetStats.push("allstats");
        }

        if (stat == "meleeblock" || stat == "rangedblock") {
            targetStats.push("block");
        }

        let total = 0;

        // Individual item abilities

        for (const [, itemElem] of Object.entries(this.equipment)) {
            if (itemElem == null) {
                continue;
            }

            if (itemElem.itemProp.abilities != undefined) {
                for (let i = 0; i < itemElem.itemProp.abilities.length; ++i) {
                    const ability = itemElem.itemProp.abilities[i];
                    if (!targetStats.includes(ability.parameter) || ability.rate != rate) {
                        continue;
                    }

                    if (stat == "skillchance" && (ability.skill == undefined || ability.skill != skillChanceId)) {
                        continue;
                    }

                    if (ability.addMax != undefined && itemElem.statRanges.length - 1 >= i) { // Stat ranges
                        total += itemElem.statRanges[i].value;
                    }
                    else {
                        total += ability.add;
                    }
                }
            }

            for (const ability of itemElem.randomStats) {
                if (!ability) {
                    continue;
                }

                if (!targetStats.includes(ability.parameter) || ability.rate != rate) {
                    continue;
                }

                if (stat == "skillchance" && (ability.skill == undefined || ability.skill != skillChanceId)) {
                    continue;
                }

                total += ability.value;
            }

            // Accessories
            if (itemElem.itemProp.upgradeLevels != undefined) {
                for (const ability of itemElem.itemProp.upgradeLevels[itemElem.upgradeLevel].abilities) {
                    if (!targetStats.includes(ability.parameter) || ability.rate != rate) {
                        continue;
                    }

                    if (stat == "skillchance" && (ability.skill == undefined || ability.skill != skillChanceId)) {
                        continue;
                    }

                    total += ability.add;
                }
            }

            // Piercings
            for (const card of itemElem.piercings) {
                if (card.itemProp.abilities == undefined) {
                    continue;
                }

                for (const ability of card.itemProp.abilities) {
                    if (!targetStats.includes(ability.parameter) || ability.rate != rate) {
                        continue;
                    }

                    if (stat == "skillchance" && (ability.skill == undefined || ability.skill != skillChanceId)) {
                        continue;
                    }

                    total += ability.add;
                }
            }
        }

        // Armor set stuff

        const armorUpgrade = this.getArmorSetUpgradeLevel();
        if (armorUpgrade > 0) {
            const bonus = Utils.getUpgradeBonus(armorUpgrade);
            for (const ability of bonus.setAbilities) {
                if (!targetStats.includes(ability.parameter) || ability.rate != rate) {
                    continue;
                }

                if (stat == "skillchance" && (ability.skill == undefined || ability.skill != skillChanceId)) {
                    continue;
                }

                total += ability.add;
            }
        }

        for (const set of this.equipSets) {
            const equippedCount = this.getEquipSetPieceCountBySet(set);
            const bonuses = {};
            for (const bonus of set.bonus) {
                if (bonus.equipped > equippedCount) {
                    continue;
                }

                if (!targetStats.includes(bonus.ability.parameter) || bonus.ability.rate != rate) {
                    continue;
                }

                if (stat == "skillchance" && (bonus.ability.skill == undefined || bonus.ability.skill != skillChanceId)) {
                    continue;
                }

                // Use the largest bonus
                if (bonuses[bonus.ability.parameter] == undefined) {
                    bonuses[bonus.ability.parameter] = bonus.ability.add;
                }
                else if (bonuses[bonus.ability.parameter] < bonus.ability.add) {
                    bonuses[bonus.ability.parameter = bonus.ability.add];
                }
                else {
                    continue;
                }

                total += bonus.ability.add;
            }
        }

        // powerups

        for (const itemElem of this.activeItems) {
            if (itemElem.itemProp.abilities != undefined) {
                for (const ability of itemElem.itemProp.abilities) {
                    if (!targetStats.includes(ability.parameter) || ability.rate != rate) {
                        continue;
                    }

                    if (stat == "skillchance" && (ability.skill == undefined || ability.skill != skillChanceId)) {
                        continue;
                    }

                    total += ability.add;
                }
            }
        }

        // Buffs

        for (const [id, level] of Object.entries(this.activeBuffs)) {
            const skillProp = Utils.getSkillById(id);
            const levelProp = skillProp.levels[level - 1];

            if (levelProp.abilities != undefined) {
                for (const ability of levelProp.abilities) {
                    if (!targetStats.includes(ability.parameter) || ability.rate != rate) {
                        continue;
                    }

                    if (stat == "skillchance" && (ability.skill == undefined || ability.skill != skillChanceId)) {
                        continue;
                    }

                    let add = ability.add;

                    for (const scale of levelProp.scalingParameters ?? []) {
                        if (scale.parameter != ability.parameter) {
                            continue;
                        }

                        if (scale.stat == "int") {
                            add += Math.floor(Math.min(this.bufferInt * scale.scale, scale.maximum));
                        }
                        else if (scale.stat == "str") {
                            add += Math.floor(Math.min(this.bufferStr * scale.scale, scale.maximum));
                        }
                        else if (scale.stat == "sta") {
                            add += Math.floor(Math.min(this.bufferSta * scale.scale, scale.maximum));
                        }
                        else if (scale.stat == "dex") {
                            add += Math.floor(Math.min(this.bufferDex * scale.scale, scale.maximum));
                        }
                    }

                    total += add;
                }
            }
        }

        // Pet

        if (this.equipment.pet) {
            const petData = Utils.getPetDefinitionByItemId(this.equipment.pet.itemProp.id)
            let valid = true;
            if (!targetStats.includes(petData.parameter) || petData.rate != rate) {
                valid = false;
            }
            
            if (stat == "skillchance" && (ability.skill == undefined || ability.skill != skillChanceId)) {
                valid = false;
            }
            
            if (valid) {
                total += Utils.getPetStatSum(petData, this.equipment.pet.petStats)
            }
        }

        // Personal Housing

        if (this.activePersonalHousingNpcs) {
            for (const personalHouseNpc of this.activePersonalHousingNpcs) {
                for (const ability of personalHouseNpc.abilities) {
                    if (!targetStats.includes(ability.parameter) || ability.rate != rate) {
                        continue;
                    }

                    total += ability.add;
                }
            }
        }

        // Couple Housing

        if (this.activeCoupleHousingNpcs) {
            for (const coupleHouseNpc of this.activeCoupleHousingNpcs) {
                for (const ability of coupleHouseNpc.abilities) {
                    if (!targetStats.includes(ability.parameter) || ability.rate != rate) {
                        continue;
                    }

                    total += ability.add;
                }
            }
        }

        //Guild Housing

        if (this.activeGuildHousingNpcs) {
            for (const guildHouseNpc of this.activeGuildHousingNpcs) {
                for (const ability of guildHouseNpc.abilities) {
                    if (!targetStats.includes(ability.parameter) || ability.rate != rate) {
                        continue;
                    }

                    total += ability.add;
                }
            }
        }

        return total;
    }

    /**
     * Remove an attribute from this entity and return true if there was at least one instance of the attribute present.
     * @param {string} attribute The attribute to check for.
     * @returns Whether or not the attribute was removed.
     */
    removeAttribute(attribute) {
        const toRemove = [];

        for (const [id, level] of Object.entries(this.activeBuffs)) {
            const skillProp = Utils.getSkillById(id);
            const levelProp = skillProp.levels[level - 1];

            if (levelProp.abilities != undefined) {
                for (const ability of levelProp.abilities) {
                    if (ability.parameter == "attribute" && ability.attribute == attribute) {
                        toRemove.push(id);
                    }
                }
            }
        }

        for (const id of toRemove) {
            delete this.activeBuffs[id];
        }

        return toRemove.length > 0;
    }

    getEquipmentDefense() {
        if (this.isMonster()) {
            return this.monsterProp.defense;
        }

        let defense = { min: 0, max: 0 };
        for (const [, piece] of Object.entries(this.equipment)) {
            if (piece == null) {
                continue;
            }

            if (piece.itemProp.category != "armor") {
                continue;
            }

            const upgradeLevel = piece.upgradeLevel + (piece.itemProp.rarity == "ultimate" ? 10 : 0);
            let upgradeValue = 0;
            if (upgradeLevel > 0) {
                upgradeValue = Math.floor(Math.pow(upgradeLevel, 1.5));
            }
            const factor = piece.getUpgradeMultiplier();
            defense.min += Math.floor(piece.itemProp.minDefense * factor) + upgradeValue;
            defense.max += Math.floor(piece.itemProp.maxDefense * factor) + upgradeValue;
        }

        defense.min += this.getStat("minability", false);
        defense.max += this.getStat("maxability", false);

        const value = defense.max - defense.min;

        if (value > 0) {
            defense.min += Math.floor(Math.random() * value);
        }

        return defense.min;
    }

    getCriticalChance() {
        let chance = this.getBaseStat("dex") / 10;

        if (this.isPlayer()) {
            chance = Math.floor(chance * this.job.critical);
        }

        chance += this.getStat("criticalchance", true);
        return Math.max(chance, 0);
    }

    /**
     * Get this entity's block chance against the given attacker.
     * @param {boolean} ranged Whether this attack is ranged or not.
     * @param {Entity} attacker The current attacker.
     */
    getBlockChance(ranged, attacker) {
        if (this.isPlayer()) {
            // minimum of 6.25% chance to block
            // maxmium of 93.75% chance to block

            // Block based on dex and level
            const attackerLevel = attacker.level == -1 ? this.level : attacker.level;
            const blockLevel = this.level / ((this.level + attackerLevel) * 15);

            let attackerDex = attacker.getBaseStat("dex");
            if (attacker.level == -1) {
                attackerDex = 15 + (attackerDex - 15) * this.level / 100;
            }

            let blockDex = (this.getBaseStat("dex") + attackerDex + 2) * ((this.getBaseStat("dex") - attackerDex) / 800);
            blockDex = Math.min(blockDex, 10);

            let blockBase = blockLevel + blockDex;
            blockBase = Math.max(blockBase, 0);

            // Block based on job factor and dex
            const blockJob = this.getBaseStat("dex") / 8 * this.job.block;

            // Add block stat bonus
            let blockBonus = this.getStat("meleeblock", true);
            if (ranged) {
                blockBonus = this.getStat("rangedblock", true);
            }

            if (Context.isPVP()) {
                blockBonus += this.getStat("pvpblock", true);
            }

            let blockRate = Math.floor(blockJob + blockBase + blockBonus);
            blockRate = Math.max(blockRate, 0);

            // Divide block rate by 2 for giants
            if (attacker.isMonster()) {
                if (attacker.monsterProp.rank == "giant" || attacker.monsterProp.rank == "violet") {
                    blockRate /= 2;
                }
            }

            let blockPenetration = attacker.getStat("blockpenetration", true);
            if (Context.isPVP()) {
                blockPenetration += attacker.getStat("pvpblockpenetration", true);
            }

            blockRate = blockRate * (1 - blockPenetration / 100);

            return blockRate;
        }
        else {
            // maximum of 95% chance blockrate
            // minimum of 5% chance blockrate
            const defenderLevel = this.level == -1 ? attacker.level : this.level;
            let blockRate = Math.floor((this.getParry() - defenderLevel) * 0.5);
            const blockPenetration = attacker.getStat("blockpenetration", true);
            blockRate = blockRate * (1 - blockPenetration / 100);
            blockRate = Math.min(blockRate, 0);

            return blockRate;
        }
    }

    getStatScale(parameter, skillProp, level) {
        const levelProp = skillProp.levels[level];
        if (levelProp == undefined) {
            console.error("Skill level not found", skillProp, level);
            return 0;
        }

        if (levelProp.scalingParameters == undefined) {
            return 0;
        }

        let total = 0;
        for (const [, scale] of Object.entries(levelProp.scalingParameters)) {
            if (scale.parameter != parameter) {
                continue;
            }

            if (Context.isPVP() && !scale.pvp) {
                continue;
            }

            if (Context.isPVE() && !scale.pve) {
                continue;
            }

            let statValue = this.getBaseStat(scale.stat);
            if (scale.maximum != undefined && statValue > scale.max) {
                statValue = scale.maximum;
            }

            const realScale = (scale.scale * 50 - level + 1) / 5;
            total += Math.floor(((realScale / 10) * statValue) + ((level - 1) * (statValue / 50)));
        }

        return total;
    }

    /**
     * Check if this entity currently has the given skill activated. 
     */
    hasSkillBuff(skillId) {
        return skillId in this.activeBuffs;
    }

    /**
     * Get the current collective upgrade value of the equipped armor.
     */
    getArmorSetUpgradeLevel() {
        if (!this.equipment.helmet || !this.equipment.suit || !this.equipment.gauntlets || !this.equipment.boots) {
            return 0;
        }

        let lowestLevel = 999;
        lowestLevel = Math.min(lowestLevel, this.equipment.helmet.upgradeLevel);
        lowestLevel = Math.min(lowestLevel, this.equipment.suit.upgradeLevel);
        lowestLevel = Math.min(lowestLevel, this.equipment.gauntlets.upgradeLevel);
        lowestLevel = Math.min(lowestLevel, this.equipment.boots.upgradeLevel);
        return lowestLevel;
    }

    /**
     * Get the amount of pieces equipped of the set for the given item.
     * @param {object} itemProp The piece to check equipped parts of a set.
     */
    getEquipSetPieceCountByItem(itemProp) {
        const set = Utils.getEquipSetByItemId(itemProp.id);
        if (set == null) {
            return 0;
        }

        return Object.entries(this.equipment).filter(([, itemElem]) => itemElem != null && set.parts.includes(itemElem.itemProp.id)).length;
    }

    /**
     * Get the amount of pieces equipped of the given set.
     * @param {object} set The set to check pieces of.
     */
    getEquipSetPieceCountBySet(set) {
        return Object.entries(this.equipment).filter(([, itemElem]) => itemElem != null && set.parts.includes(itemElem.itemProp.id)).length;
    }

    /**
     * Update the currently cached equipped sets.
     */
    updateEquipSets() {
        this.equipSets = [];

        const pieces = [
            this.equipment.helmet,
            this.equipment.suit,
            this.equipment.gauntlets,
            this.equipment.boots,
            this.equipment.ring1,
            this.equipment.earring1,
            this.equipment.necklace,
            this.equipment.earring2,
            this.equipment.ring2
        ];

        const setIds = [];
        for (const piece of pieces) {
            if (piece == null) {
                continue;
            }

            const set = Utils.getEquipSetByItemId(piece.itemProp.id);
            if (set == null || setIds.includes(set.id)) {
                continue;
            }

            setIds.push(set.id);
            this.equipSets.push(set);
        }

        console.log("Updated currently equipped sets.");
    }
}