import Context from "./flyffcontext";
import * as Utils from "./flyffutils";

let leftHanded = false; // If this attack is using the left hand weapon.

/**
 * Get the amount of healing done by the current attacker to **themself** using the given skill.
 * @param {object} skillProp The skill property to calculate healing for.
 * @returns The amount of healing done.
 */
export function getHealing(skillProp) {
    const skillLevel = Context.attacker.skillLevels[skillProp.id];
    if (skillLevel == null) {
        return 0;
    }

    let add = 0;

    const levelProp = skillProp.levels[skillLevel - 1];
    if (levelProp.abilities == undefined) {
        return 0
    }

    for (const ability of levelProp.abilities) {
        if (ability.parameter == "hp") {
            add = ability.add;
            break;
        }
    }

    if (add <= 0) {
        return 0;
    }

    const referStat = Context.attacker.getStatScale("hp", skillProp, skillLevel - 1);
    add += referStat;

    add += add * Context.attacker.getStat("healing", true) / 100;
    add += add * Context.attacker.getStat("incominghealing", true) / 100;

    return Math.floor(add);
}

/**
 * Get the damage done by a simulated attack in the current context.
 * @param {boolean} leftHand If the attacker is using their left hand for this attack.
 * @returns The amount of damage done for this attack.
 * @see {@link Context}
 */
export function getDamage(leftHand) {
    leftHanded = leftHand;

    // Check for miss is the first thing
    if (!Context.isSkillAttack() && (Context.attackFlags & Utils.ATTACK_FLAGS.MAGIC) == 0) {
        const hitResult = checkHitRate();
        if (hitResult != 0) {
            Context.attackFlags |= hitResult;
            return 0;
        }
    }

    let totalDamage = 0;
    const attack = computeAttack();
    const damage = applyDefense(attack);

    if (damage > 0) {
        // Just apply swordcross here manually
        if ((Context.attackFlags & (Utils.ATTACK_FLAGS.GENERIC | Utils.ATTACK_FLAGS.MELEESKILL)) != 0) {
            if (Context.attacker.equipment.mainhand.itemProp.triggerSkill != undefined && Context.attacker.equipment.mainhand.itemProp.triggerSkill == 3124) {
                if (Math.random() * 100 < Context.attacker.equipment.mainhand.itemProp.triggerSkillProbability) {
                    Context.defender.activeBuffs[3124] = 1;
                }
            }
        }

        totalDamage += damage;
    }

    // if (not damage over time)
    // Various multipliers
    totalDamage += totalDamage * Context.attacker.getStat(Context.isPVP() ? "pvpdamage" : "pvedamage", true) / 100;

    totalDamage += totalDamage * Math.max(Context.defender.getStat("incomingdamage", true), -50) / 100;
    if (Context.defender.isMonster() && Context.defender.monsterProp.rank == "giant") {
        totalDamage += totalDamage * Context.attacker.getStat("bossmonsterdamage", true) / 100;
    }

    if (Context.defender.isPlayer()) {
        totalDamage -= totalDamage * Math.min(20, Context.defender.getStat(Context.isPVP() ? "pvpdamagereduction" : "pvedamagereduction", true)) / 100;
        totalDamage -= totalDamage * Context.defender.getStat("damageoffload", true) / 100;
    }

    totalDamage = Math.max(totalDamage, 1);

    // Lifesteal here
    // Spirit strike here

    return totalDamage;
}

/**
 * @returns The result of this attack in terms of hit or miss. 0 = hit, otherwise the relevant flag is returned.
 */
function checkHitRate() {
    const res = Context.attacker.getContextHitRate(Context.defender);

    const randValue = Math.floor(Math.random() * 100);
    if (randValue < res.probAdjusted) {
        return 0; // hit
    }

    const probDiv = 100 - res.probAdjusted;
    if (probDiv != 0) {
        const val = (randValue - res.probAdjusted) / probDiv;
        if (res.prob < val) {
            return Utils.ATTACK_FLAGS.PARRY;
        }
    }

    return Utils.ATTACK_FLAGS.MISS;
}

function computeAttack() {
    let attack = 0;

    if (Context.attackFlags & Utils.ATTACK_FLAGS.MELEESKILL) {
        // Melee skills
        attack = getBaseSkillPower();
    }
    else if (Context.attackFlags & Utils.ATTACK_FLAGS.MAGICSKILL) {
        // Magic skills
        attack = getMagicSkillPower();
    }
    else if (Context.attackFlags & Utils.ATTACK_FLAGS.MAGIC) {
        // Wand attacks
        attack = getMagicHitPower();
    }
    else if (Context.attackFlags & Utils.ATTACK_FLAGS.GENERIC) {
        // Regular autos
        // Element Factor here
        const hit = Context.attacker.getHitMinMax(leftHanded);
        attack = Math.floor(Math.random() * (Math.floor(hit.max) - Math.ceil(hit.min) + 1) + Math.ceil(hit.min));
        // element
        // Bow charge factor here
    }

    attack = Math.floor(attack * getAttackMultiplier());

    // TODO: Skills with multiple hits have a 10% factor here

    attack += Context.attacker.getStat("attack", false);

    if (Context.isPVE()) {
        attack += Context.attacker.getStat("pvedamage", false);
    }

    // Damage event multiplier here

    return Math.max(attack, 0);
}

function getAttackMultiplier() {
    let sumPower = Context.attacker.getStat("attack", true);
    if (Context.isSkillAttack()) {
        sumPower += Context.attacker.getStat("skilldamage", true) / 10;
        if (Context.skill.target == "single") {
            // 1v1 skill damage. not used at all rn
        }
    }

    // Achievement bonus is here

    let factor = 1 + sumPower / 100;

    // Upcut is hardcoded for some reason
    if (Context.attacker.isPlayer()) {
        for (const itemElem of Context.attacker.activeItems) {
            if (itemElem.itemProp.id == 8691) { // Upcut stone
                factor *= 1.2;
                break;
            }
        }
    }

    return factor;
}

function applyDefense(attack) {
    // Monster attacks are always reduced by level difference.
    if (!Context.isSkillAttack() && Context.attacker.isMonster() && Context.defender.isPlayer()) {
        const attackerLevel = Context.attacker.level == -1 ? Context.defender.level : Context.attacker.level;
        const delta = attackerLevel - Context.defender.level;
        if (delta > 0) {
            const power = 1 + 0.05 * delta;
            attack = Math.floor(attack * power);
        }
    }

    let damage = attack;
    if (Context.attackFlags & Utils.ATTACK_FLAGS.MAGICSKILL) {
        // Magic skills
        damage = applyMagicSkillDefense(attack);
    }
    else if (Context.attackFlags & Utils.ATTACK_FLAGS.GENERIC) {
        // Regular autos
        damage = applyAutoAttackDefense(attack);
    }
    else {
        // Melee Skills or wand auto attacks
        damage = applyMeleeSkillDefense(attack);
        if (damage > 0) {
            damage += getElementDamage();
        }
    }

    damage = applyElementDefense(damage);

    // Asal PvE damage
    if (Context.isSkillAttack() && Context.skill.id == 5041 && Context.isPVE()) {
        // Asal damage
        const skillLevel = Context.attacker.getSkillLevel(5041);
        const add = [20, 30, 40, 50, 60, 70, 80, 90, 100, 150][skillLevel - 1];
        const mp = Context.attacker.getMP();
        const totalBonus = Math.floor(((Context.attacker.getStr() / 10) * skillLevel) * (5 + mp / 10) + add);
        damage = damage > 0 ? (damage + totalBonus) : totalBonus;
    }

    if (damage <= 0) {
        return 0;
    }

    // TODO: Party link/global attack here

    let factor = 1;
    if (Context.isSkillAttack()) {
        const skillLevel = Context.attacker.getSkillLevel(Context.skill.id);
        const levelProp = Context.skill.levels[skillLevel - 1];
        let probability = 0;

        if (Context.isPVP() && levelProp.probabilityPVP != undefined) {
            probability = levelProp.probabilityPVP;
        }
        else if (levelProp.probability != undefined) {
            probability = levelProp.probability;
        }

        factor = levelProp.damageMultiplier != undefined ? levelProp.damageMultiplier : factor;

        // Vital stab/silent shot with dark illusion
        if (Context.skill.id == 5162 || Context.skill.id == 8916) {
            if (Context.attacker.hasSkillBuff(7395)) {
                factor *= 1.4;
            }
        }

        switch (Context.skill.id) {
            case 6910: // Aimed Shot
            case 9538: // Spring Attack
                if (Math.random() * 100 < probability) {
                    factor = 2;
                    Context.attackFlags |= Utils.ATTACK_FLAGS.DOUBLE;
                }
                break;
            case 1526: // Junk Arrow
                if (Math.random() * 100 < probability) {
                    factor = 0;
                }
                break;
            case 7156: // Hit of Penya
                // TODO: Multiplier from skill level. this is assuming max level
                factor *= 3;
                break;
        }

        let weapon = leftHanded ? Context.attacker.equipment.offhand : Context.attacker.equipment.mainhand;

        // Skill awakes
        if (weapon != null && weapon.skillAwake != null && weapon.skillAwake.skill != undefined
            && weapon.skillAwake.skill == Context.skill.id) {
            factor *= 1 + weapon.skillAwake.add / 100;
        }
    }

    if (Context.isPVP()) {
        factor *= 0.6;
    }
    if (leftHanded) {
        factor *= 0.75;
    }

    if (Context.defender.removeAttribute("double")) {
        factor *= 2.0;
        Context.attackFlags |= Utils.ATTACK_FLAGS.DOUBLE;
    }

    // Level difference
    if (Context.isPVE()) {
        const defenderLevel = Context.defender.level == -1 ? Context.attacker.level : Context.defender.level;
        let delta = defenderLevel - Context.attacker.level;
        if (delta > 0) {
            const maxLevelDifference = 16;
            const reductionFactor = [1.0, 1.0, 0.98, 0.95, 0.91, 0.87, 0.81, 0.75, 0.67, 0.59, 0.51, 0.42, 0.32, 0.22, 0.12, 0.01];
            delta = Math.min(delta, maxLevelDifference - 1);
            factor *= reductionFactor[delta];
        }
    }

    // Herd would be here

    damage = Math.floor(damage * factor);

    // TODO: afterDamage like riposte, aura burst, etc
    return damage;
}

function getElementDamage() {
    let element = "none";
    let attack = 0;

    if (Context.attacker.isMonster()) {
        element = Context.attacker.monsterProp.element;
        attack = 1; // This value is 1 on every monster in the game it seems
    }
    else {
        const weapon = leftHanded ? Context.attacker.equipment.offhand : Context.attacker.equipment.mainhand;
        if (weapon != null && weapon.element != "none") {
            element = weapon.element;
            attack = weapon.elementUpgradeLevel;

            attack *= 4;
            attack += Context.attacker.getStat("elementattack", false);
        }
        else if (weapon != null) {
            element = weapon.itemProp.element;
            attack = weapon.itemProp.elementAttack != undefined ? weapon.itemProp.elementAttack : 0;
        }
    }

    if (element != "none") {
        return Math.floor(attack * (1 - Context.defender.getElementResistance(element)));
    }
    else {
        return 0;
    }
}

function applyElementDefense(attack) {
    let skillElement = "none";
    if (Context.isSkillAttack()) {
        skillElement = Context.skill.element;

        if (skillElement == "none") {
            return attack;
        }
    }

    let weaponElement = "none";
    const weapon = leftHanded ? Context.attacker.equipment.offhand : Context.attacker.equipment.mainhand;
    if (weapon.element != "none") {
        weaponElement = weapon.element;
    }
    else {
        weaponElement = weapon.itemProp.element;
    }

    // Prioritize the skill element
    let attackerElement = skillElement != "none" ? skillElement : weaponElement;
    if (Context.attacker.isMonster() && skillElement == "none") {
        attackerElement = Context.attacker.monsterProp.element;
    }

    const resistance = Context.defender.getElementResistance(attackerElement);
    attack = Math.floor(attack * (1 - resistance));

    if (skillElement != "none") {
        // More damage if the skill and weapon match
        if (skillElement == weaponElement) {
            return Math.floor(attack * 1.1);
        }

        // Less damage if they go against each other
        if ((weaponElement == "water" && skillElement == "fire") ||
            (weaponElement == "electricity" && skillElement == "water") ||
            (weaponElement == "earth" && skillElement == "electricity") ||
            (weaponElement == "wind" && skillElement == "earth") ||
            (weaponElement == "fire" && skillElement == "wind")) {
            return Math.floor(attack * 0.9);
        }
    }

    return attack;
}

function applyMagicSkillDefense(attack) {
    if (!Context.isSkillAttack()) { // Should never happen
        return 0;
    }

    // Spirit bomb
    if (Context.skill.id == 6206) {
        attack *= 2;
    }

    if (Context.attackFlags & Utils.ATTACK_FLAGS.MAGICSKILL) { // What's the point of this check
        attack -= attack * Context.defender.getStat("magicdefense", true) / 100;
    }

    // Asal
    if (Context.skill.id == 5041 && Context.isPVP()) {
        const skillLevel = Context.attacker.getSkillLevel(5041);
        const add = [20, 30, 40, 50, 60, 70, 80, 90, 100, 150][skillLevel - 1];
        const mp = Context.attacker.getMP();
        const totalBonus = Math.floor(((Context.attacker.getStr() / 10) * skillLevel) * (5 + mp / 10) + add);
        attack = attack > 0 ? (attack + totalBonus) : totalBonus;
    }

    const defense = Context.defender.getDefense();
    return applyAttackDefense(attack, defense);
}

function applyMeleeSkillDefense(attack) {
    // applyDefenseParryCritical
    let damage = 0;

    // Asal and HoP ignore defense in pve
    if (Context.isSkillAttack() && Context.isPVE() && (Context.skill.id == 5041 || Context.skill.id == 7156)) {
        damage = attack;
    }
    else {
        const defense = Math.floor(Context.defender.getDefense());
        damage = applyAttackDefense(attack, defense);
    }

    damage = Math.max(damage, 0);

    // This is purely wand auto attacks
    if (isCriticalAttack()) {
        Context.attackFlags |= Utils.ATTACK_FLAGS.CRITICAL;

        const criticalFactor = 2.3;

        // 4th attack or charged wand attacks have a stronger critical factor (2.6)

        const criticalBonus = Math.max(0.1, 1 + Context.attacker.getStat("criticaldamage", true) / 100);
        damage = Math.floor(criticalFactor * criticalBonus * damage);

        if (Context.isPVP()) {
            damage += damage * (Context.attacker.getStat("pvpcriticaldamage", true) / 100);
        }

        // Fly back here
    }

    return damage;
}

function applyAutoAttackDefense(attack) {
    let defense = Math.floor(Context.defender.getDefense());
    // TODO: Element defense factor

    let damage = applyAttackDefense(attack, defense);
    if (damage > 0) {
        if (isCriticalAttack()) {
            Context.attackFlags |= Utils.ATTACK_FLAGS.CRITICAL;

            let minCritical = 1.1;
            let maxCritical = 1.4;

            const defenderLevel = Context.defender.level == -1 ? Context.attacker.level : Context.defender.level;
            if (Context.attacker.level > defenderLevel) {
                if (Context.attacker.isMonster()) {
                    minCritical = 1.4;
                    maxCritical = 1.8;
                }
                else if (Context.defender.isMonster()) {
                    minCritical = 1.2;
                    maxCritical = 2.0;
                }
            }

            const criticalFactor = minCritical + Math.random() * (maxCritical - minCritical);
            const criticalBonus = Math.max(0.1, 1 + Context.attacker.getStat("criticaldamage", true) / 100);
            damage = Math.floor(criticalFactor * criticalBonus * damage);

            // Knock down here
        }

        const blockFactor = getBlockFactor();
        if (blockFactor < 1) {
            Context.attackFlags |= Utils.ATTACK_FLAGS.BLOCKING;
            damage = Math.floor(damage * blockFactor);
        }
    }
    else {
        damage = 0;
    }

    if (Context.attacker.isMonster() && Context.defender.isPlayer()) {
        const damageMin = Math.max(0, Math.floor(attack * 0.1));
        damage = Math.max(damage, damageMin);
    }

    return damage;
}

function applyAttackDefense(attack, defense) {
    const factor = 2;
    let value = 0;
    const sum = defense + factor * attack;
    if (defense > 0 && sum > 1) {
        value = Math.sqrt(defense / sum);
    }

    const correction = Math.floor(Utils.mix(defense, attack, value));
    return attack - correction;
}

function isCriticalAttack() {
    // TODO: Damage over time
    if (Context.isSkillAttack()) {
        return false;
    }

    let critChance = Context.attacker.getCriticalChance();

    if (Context.isPVP()) {
        const extra = Context.attacker.getStat("pvpcriticalchance", true);
        if (extra > 0) {
            critChance += critChance * (extra / 100);
        }
    }

    const chanceFactor = Math.min(1, 1 - Context.defender.getStat("criticalresist", true) / 100);
    return (critChance * chanceFactor) > Math.random() * 100;
}

function getBlockFactor() {
    // TODO: Damage over time
    const isYoyo = Context.attacker.isPlayer() && Context.attacker.equipment.mainhand != null && Context.attacker.equipment.mainhand.subcategory == "yoyo";
    const ranged = isYoyo || (Context.attackFlags & Utils.ATTACK_FLAGS.RANGE) != 0;

    if (Context.defender.isPlayer()) {
        const minBlock = Context.attacker.isPlayer() ? 0.3 : 0.2;
        const r = Math.floor(Math.random() * 80);

        // 6.25% chance to take full damage
        if (r <= 5) {
            return 1;
        }

        // 6.25% chance to block the attack
        if (r >= 75) {
            return minBlock;
        }

        if (Context.defender.getBlockChance(ranged, Context.attacker) > r) {
            return minBlock;
        }
    }
    else {
        const r = Math.floor(Math.random() * 100);

        // 5% chance to take full damage
        if (r <= 5) {
            return 1;
        }

        // 5% chance to block the attack
        if (r >= 95) {
            return 0.2;
        }

        if (Context.defender.getBlockChance(ranged, Context.attacker) > r) {
            return 0.2;
        }
    }
}

function getBaseSkillPower() {
    if (!Context.isSkillAttack()) {
        return 1;
    }

    const skillLevel = Context.attacker.skillLevels[Context.skill.id] - 1;
    const levelProp = Context.skill.levels[skillLevel];
    const weapon = Context.attacker.equipment.mainhand;
    const weaponAttack = getWeaponAttackPower(weapon);

    const referStat = Context.attacker.getStatScale("attack", Context.skill, skillLevel);

    let power = {
        min: (((weaponAttack.min + (levelProp.minAttack + weapon.itemProp.additionalSkillDamage) * 5 + referStat - 20) * (16 + skillLevel) / 13)),
        max: (((weaponAttack.max + (levelProp.maxAttack + weapon.itemProp.additionalSkillDamage) * 5 + referStat - 20) * (16 + skillLevel) / 13))
    };

    const weaponDamage = Math.floor(Context.attacker.getStat(weapon.itemProp.subcategory + "attack", false));
    power.min += Context.attacker.getStat("damage", false) + weaponDamage;
    power.max += Context.attacker.getStat("damage", false) + weaponDamage;

    let minMax = (power.max - power.min) + 1;
    minMax = Math.max(1, minMax);

    return Math.floor(power.min + Math.random() * minMax);
}

function getMagicSkillPower() {
    let attack = getBaseSkillPower();
    attack += attack * Context.attacker.getStat("magicattack", true) / 100.0;

    // TODO: There is a spellType property here for element masteries

    return Math.floor(attack);
}

function getMagicHitPower() {
    let weaponAttack = getWeaponAttackPower(Context.attacker.equipment.mainhand);

    const attack = Context.attacker.getWeaponAttack("wand");
    weaponAttack.min += attack;
    weaponAttack.max += attack;

    let damage = Math.floor(weaponAttack.min + Math.random() * (weaponAttack.max - weaponAttack.min));
    damage += Context.attacker.getStat("damage", false);

    // Wand charge multiplier here
    // No charge = 0.6f multiplier
    damage *= 0.6;

    return damage;
}

function getWeaponAttackPower(weaponElem) {
    let f = weaponElem.getUpgradeMultiplier();
    let add = 0;

    const upgrade = weaponElem.upgradeLevel + (weaponElem.itemProp.rarity == "ultimate" ? 10 : 0);
    if (upgrade > 0) {
        add = Math.floor(Math.pow(upgrade, 1.5));
    }

    let power = {
        min: weaponElem.itemProp.minAttack + Context.attacker.getStat("minability", false),
        max: weaponElem.itemProp.maxAttack + Context.attacker.getStat("maxability", false)
    };

    if (Context.attacker.isMonster()) {
        power.min += Context.attacker.monsterProp.minAttack;
        power.max += Context.attacker.monsterProp.maxAttack;

        // Scaling
        if (Context.attacker.level == -1) {
            power.min = power.min * Context.defender.level / 100;
            power.max = power.max * Context.defender.level / 100;
        }
    }

    power.min = Math.floor(power.min * f + add);
    power.max = Math.floor(power.max * f + add);

    return power;
}