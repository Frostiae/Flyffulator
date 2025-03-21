import Context from "./flyffcontext";
import * as Utils from "./flyffutils";

let leftHanded = false; // If this attack is using the left hand weapon.
let elementDefenseFactor = 0; // Element defense factor
let lifestealPercent = 0;

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
    elementDefenseFactor = 0;
    lifestealPercent = 0;
    Context.afterDamageProps = {};

    // Check for miss is the first thing
    if (Context.settings.missingEnabled && !Context.isSkillAttack() && (Context.attackFlags & Utils.ATTACK_FLAGS.MAGIC) == 0) {
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
        totalDamage += triggerSkills();
        totalDamage += damage;
    }

    // if (not damage over time)
    // Various multipliers
    totalDamage += Math.floor(totalDamage * Context.attacker.getStat(Context.isPVP() ? "pvpdamage" : "pvedamage", true) / 100);

    totalDamage += Math.floor(totalDamage * Math.max(Context.defender.getStat("incomingdamage", true), -50) / 100);
    if (Context.defender.isMonster() && Context.defender.monsterProp.rank == "giant") {
        totalDamage += Math.floor(totalDamage * Context.attacker.getStat("bossmonsterdamage", true) / 100);
    }

    if (Context.defender.isPlayer()) {
        totalDamage -= Math.floor(totalDamage * Math.min(20, Context.defender.getStat(Context.isPVP() ? "pvpdamagereduction" : "pvedamagereduction", true)) / 100);
        totalDamage -= Math.floor(totalDamage * Context.defender.getStat("damageoffload", true) / 100);
    }

    totalDamage = Math.max(totalDamage, 1);

    if (lifestealPercent > 0) {
        const stealAmount = Math.floor(totalDamage * (lifestealPercent / 100));
        totalDamage += stealAmount;
        Context.afterDamageProps.lifesteal = stealAmount;
    }

    // Spirit strike here

    return totalDamage;
}

function triggerSkills() {
    let extraDamage = 0;

    if ((Context.attackFlags & Utils.ATTACK_FLAGS.DAMAGE_OVER_TIME) != 0 && Context.attacker.isPlayer()) {
        // spiritual overcharge
        // healing grace

        if (Context.skill?.id == 9730 || Context.skill?.id == 4636) {
            // Merkaba and arrow rain can waterbomb

        }
    }

    if ((Context.attackFlags & Utils.ATTACK_FLAGS.DAMAGE_OVER_TIME) == 0 && Context.attacker.isPlayer()) {
        // Damage slow rate

        /* Waterbomb doesn't really do damage to the target that it was casted from, only surrounding targets
        if (Context.settings.waterbombEnabled && Context.skill?.id != 11389 && Math.random() * 100 <= Context.attacker.getStat("skillchance", true, 11389)) {
            // Waterbomb
            const oldSkill = Context.skill;
            const oldFlags = Context.attackFlags;

            Context.attacker.skillLevels[11389] = 1;
            Context.skill = Utils.getSkillById(11389);
            Context.attackFlags = Context.skill.magic ? Utils.ATTACK_FLAGS.MAGICSKILL : Utils.ATTACK_FLAGS.MELEESKILL; // its always magic

            extraDamage += getDamage(false);

            //delete Context.attacker.skillLevels[11389];
            Context.skill = oldSkill;
            Context.attackFlags = oldFlags;
            Context.afterDamageProps.triggeredSkill = 11389;
        }
        */
    }

    if ((Context.attackFlags & Utils.ATTACK_FLAGS.MAGICSKILL) != 0 && Context.attacker.isPlayer()) {
        if (Context.skill?.id == 447 || Context.skill?.id == 5041 || Context.skill?.id == 9730) {
            // Bgvur, Asal, and Merk can stun
            // Stun chance
        }

        // Healing grace
    }

    // Last stand if defender is less than or equal to 25% HP here

    if ((Context.attackFlags & (Utils.ATTACK_FLAGS.GENERIC | Utils.ATTACK_FLAGS.MELEESKILL)) != 0 && Context.attacker.isPlayer()) {
        // Stun chance
        // poison, bleed
        // spiritual overcharge
        // pranksters escape
        // healing grace

        if (Context.settings.lifestealEnabled && Math.random() * 100 <= Context.attacker.getStat("skillchance", true, 7513)) {
            // Lifesteal
            const lifestealSkillProp = Utils.getSkillById(7513);
            // TODO: Don't really have a clean way at all to get the skill level of the triggered skill... (getChgParam)

            lifestealPercent = lifestealSkillProp.levels.at(-1).abilities[0].add;
            // Lifesteal is added later. see lifestealPercent
        }

        // Yoyo knockback and swordcross here
        if (Context.settings.swordcrossEnabled && (Context.attackFlags & (Utils.ATTACK_FLAGS.GENERIC | Utils.ATTACK_FLAGS.MELEESKILL)) != 0) {
            if (Context.attacker.equipment.mainhand.itemProp.triggerSkill != undefined && Context.attacker.equipment.mainhand.itemProp.triggerSkill == 3124) {
                if (Math.random() * 100 <= Context.attacker.equipment.mainhand.itemProp.triggerSkillProbability) {
                    Context.defender.activeBuffs[3124] = 1;
                }
            }
        }
    }

    // Skills triggering skills here, only burning arrow triggers burning field it seems

    return extraDamage;
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
        const elementFactor = getElementDamageFactorAutoAttack();
        const hit = Context.attacker.getHitMinMax(leftHanded);
        attack = Math.floor(Math.random() * (Math.floor(hit.max) - Math.ceil(hit.min) + 1) + Math.ceil(hit.min));
        attack = Math.floor((attack * elementFactor) / 10000);

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
        sumPower += Context.attacker.getStat("skilldamage", true);
        if (Context.skill.target == "single") {
            // 1v1 skill damage. not used at all rn
        }
    }

    // Achievement bonus
    if (Context.attacker.isPlayer() && Context.defender.isMonster()) {
        sumPower += Context.settings.achievementAttackBonus;
    }

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

function getElementAdditionalAttack(leftHand) {
    let plusAttack = 0;
    if (leftHand && Context.attacker.attackResistLeft != 255) {
        plusAttack = 2000;
    }
    else if (Context.attacker.attackResistRight != 255) {
        plusAttack = 2000;
    }
    return plusAttack;
}

function getElementAdditionalDefense() {
    let plusDefense = 0;
    if (Context.defender.defenseResist != 255) {
        plusDefense = 2000;
    }
    return plusDefense;
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
            damage += getElementDamageFactorMeleeSkill();
        }
    }

    damage = applyElementDefense(damage);

    // Asal PvE damage
    if (Context.isSkillAttack() && Context.skill.id == 5041 && Context.isPVE()) {
        // Asal damage
        const skillLevel = Context.attacker.getSkillLevel(5041);
        const add = [20, 30, 40, 50, 60, 70, 80, 90, 100, 150][skillLevel - 1];
        const mp = Context.attacker.getMP();
        const totalBonus = Math.floor(((Context.attacker.getBaseStat("str") / 10) * skillLevel) * (5 + mp / 10) + add);
        damage = damage > 0 ? (damage + totalBonus) : totalBonus;
    }

    if (damage <= 0) {
        return 0;
    }

    // Party skills
    damage += computePartyLinkGlobalAttackDamage(damage)

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

        let weapon = Context.attacker.equipment.mainhand;
        if (leftHanded && Context.attacker.equipment.offhand) {
            weapon = Context.attacker.equipment.offhand;
        }

        // Skill awakes
        if (weapon != null && weapon.skillAwake != null && weapon.skillAwake.skill != undefined
            && weapon.skillAwake.skill == Context.skill.id) {
            factor *= 1 + weapon.skillAwake.add / 100;
        }
    }

    if (Context.attacker.isMonster()) {
        const berserkThreshold = Context.attacker.monsterProp.berserkThresholdHP;
        if (berserkThreshold != undefined && berserkThreshold > 0 && Context.settings.targetHealthPercent <= berserkThreshold) {
            factor *= 1 + Context.attacker.monsterProp.berserkAttackPower / 100;
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
    if (Context.attacker.isPlayer() || !Context.attacker.monsterProp.noLevelReduction) {
        const defenderLevel = Context.defender.level == -1 ? Context.attacker.level : Context.defender.level;
        const attackerLevel = Context.attacker.level == -1 ? Context.defender.level : Context.attacker.level;
        let delta = defenderLevel - attackerLevel;
        if (delta > 0) {
            if (Context.isPVE()) {
                const maxLevelDifference = 16;
                const reductionFactor = [1.0, 1.0, 0.98, 0.95, 0.91, 0.87, 0.81, 0.75, 0.67, 0.59, 0.51, 0.42, 0.32, 0.22, 0.12, 0.01];
                delta = Math.min(delta, maxLevelDifference - 1);
                factor *= reductionFactor[delta];
            }
            else if (Context.isPVP()) {
                factor *= 1; // No level difference in pvp
            }
        }
    }

    // Herd would be here

    damage = Math.floor(damage * factor);

    // TODO: afterDamage like riposte, aura burst, etc
    return damage;
}

/**
 * Get the element damage factor for auto attacks.
 */
function getElementDamageFactorAutoAttack() {
    let attackFactor = 10000;
    elementDefenseFactor = 10000;

    let attackType = "none";
    let attackLevel = 0;
    let plusAttack = 0;

    if (Context.attacker.isPlayer()) {
        let weapon = Context.attacker.equipment.mainhand;
        if (leftHanded && Context.attacker.equipment.offhand) {
            weapon = Context.attacker.equipment.offhand;
        }

        if (weapon.element != "none") {
            attackType = weapon.element;
            attackLevel = weapon.elementUpgradeLevel + Context.attacker.getStat("elementattack", false);
        }
        else {
            attackType = weapon.itemProp.element;
        }

        // TODO: Element upcuts here I think
        plusAttack = getElementAdditionalAttack(leftHanded);
    }
    else {
        attackType = Context.attacker.monsterProp.element;
        attackLevel = 1; // 1 on 90% of monsters it seems
    }

    let defenseType = "none";
    let defenseLevel = 0;
    let plusDefense = 0;

    if (Context.defender.isPlayer()) {
        if (Context.defender.equipment.suit != null) {
            defenseType = Context.defender.equipment.suit.element;
            defenseLevel = Context.defender.equipment.suit.elementUpgradeLevel;
        }

        // TODO: Def element upcut or something idk
        plusDefense = getElementAdditionalDefense();
    }
    else {
        defenseType = Context.defender.monsterProp.element;
        defenseLevel = 1;
    }

    if (attackType == "none" && defenseType == "none") {
        return attackFactor;
    }

    const relations = {
        None: 0, // One has no element
        Same: 1, // Same element
        Weak: 2, // Attacker element is weak
        Strong: 3 // Attacker element is strong
    };

    const table = [
        [relations.None, relations.None, relations.None, relations.None, relations.None, relations.None],
        [relations.None, relations.Same, relations.Weak, relations.None, relations.Strong, relations.None],
        [relations.None, relations.Strong, relations.Same, relations.Weak, relations.None, relations.None],
        [relations.None, relations.None, relations.Strong, relations.Same, relations.None, relations.Weak],
        [relations.None, relations.Weak, relations.None, relations.None, relations.Same, relations.Strong],
        [relations.None, relations.None, relations.None, relations.Strong, relations.Weak, relations.Same]
    ];

    const result = table[Utils.ELEMENT_PROP_TYPE[attackType]][Utils.ELEMENT_PROP_TYPE[defenseType]];

    let factor = 0;
    let level = 0;

    switch (result) {
        case relations.Weak:
            level = (attackLevel - 5) - defenseLevel;
            elementDefenseFactor += plusDefense;
            break;
        case relations.Strong:
            level = attackLevel - (defenseLevel > 5 ? defenseLevel - 5 : 0);
            if (level > 0) {
                factor += (Utils.getUpgradeBonus(Math.min(level, 10)).elementAttackStrong * 100) ?? 0;
            }
            attackFactor += plusAttack;
            break;
        default:
            if (attackLevel > 0 && defenseLevel == 0) {
                factor += (Utils.getUpgradeBonus(Math.min(attackLevel, 10)).elementAttack * 100) ?? 0;
            }
            else if (attackLevel == 0 && defenseLevel > 0) {
                factor -= (Utils.getUpgradeBonus(Math.min(Math.max(defenseLevel - 3, 1), 10)).elementDefense * 100) ?? 0;
            }
            else if (attackLevel > 0 && defenseLevel > 0) {
                level = attackLevel - defenseLevel;
            }
            break;
    }

    if (level != 0) {
        if (level > 0) {
            factor += (Utils.getUpgradeBonus(Math.min(level, 10)).elementAttack * 100) ?? 0;
        }
        else {
            factor -= (Utils.getUpgradeBonus(Math.min(-level, 10)).elementDefense * 100) ?? 0;
        }
    }

    attackFactor += factor;
    elementDefenseFactor += factor;

    return Math.floor(attackFactor);
}

/**
 * Get the element damage factor for melee skills.
 */
function getElementDamageFactorMeleeSkill() {
    let element = "none";
    let attack = 0;

    if (Context.attacker.isMonster()) {
        element = Context.attacker.monsterProp.element;
        attack = 1; // This value is 1 on every monster in the game it seems
    }
    else {
        let weapon = Context.attacker.equipment.mainhand;
        if (leftHanded && Context.attacker.equipment.offhand) {
            weapon = Context.attacker.equipment.offhand;
        }

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
    let weapon = Context.attacker.equipment.mainhand;
    if (leftHanded && Context.attacker.equipment.offhand) {
        weapon = Context.attacker.equipment.offhand;
    }

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
        const totalBonus = Math.floor(((Context.attacker.getBaseStat("str") / 10) * skillLevel) * (5 + mp / 10) + add);
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
    defense = Math.floor((defense * elementDefenseFactor) / 10000);

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

        const blockFactor = Context.settings.blockingEnabled ? getBlockFactor() : 1;
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

        // 7.5% chance to take full damage
        if (r <= 5) {
            return 1;
        }

        // 7.5% chance to block the attack
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
    if (!Context.isSkillAttack() || Context.skill == null) {
        return 1;
    }

    let attack = getBaseSkillPower();
    attack += attack * Context.attacker.getStat("magicattack", true) / 100.0;

    // Elements
    let bonus = 0;
    switch (Context.skill.elementType) {
        case "fire": bonus = Context.attacker.getStat("firemastery", true); break;
        case "fireearth": bonus = Context.attacker.getStat("firemastery", true) + Context.attacker.getStat("earthmastery", true); break;
        case "water": bonus = Context.attacker.getStat("watermastery", true); break;
        case "electricity": bonus = Context.attacker.getStat("electricitymastery", true); break;
        case "electricitywind": bonus = Context.attacker.getStat("electricitymastery", true) + Context.attacker.getStat("windmastery", true); break;
        case "wind": bonus = Context.attacker.getStat("windmastery", true); break;
        case "earth": bonus = Context.attacker.getStat("earthmastery", true); break;
        case "earthwind": bonus = Context.attacker.getStat("earthmastery", true) + Context.attacker.getStat("windmastery", true); break;
        case "earthwater": bonus = Context.attacker.getStat("earthmastery", true) + Context.attacker.getStat("watermastery", true); break;
        default: break;
    }

    if (bonus != 0) {
        return Math.floor(attack * (1 + bonus / 100));
    }

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

function computePartyLinkGlobalAttackDamage(damage) {
    let factor = 0
    if (Context.attacker.isPlayer() && Context.defender.isMonster() && damage > 0) {
        let multiplier = 0;

        if (Context.attacker.activePartyBuffs.includes(1093) && Context.settings.partyLeaderEnabled) {
            multiplier = 0.05;
        }
        else if (Context.attacker.activePartyBuffs.includes(4686)) {
            multiplier = 0.025;
        }

        factor = Math.floor(damage * Context.attacker.activePartyMembers * multiplier);
    }
    return factor;
}
