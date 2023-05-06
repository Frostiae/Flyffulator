import { Utils } from "./utils.js";
import Moverutils from "./moverutils.js";
import { Blade, Knight, Psykeeper } from "./jobs.js";

export class DamageCalculator {
    constructor(attacker, defender) {
        this.attacker = attacker;
        this.defender = defender;
        this.weapon = attacker.mainhand;
        this.skill = attacker.focusSkill == -1 ? null : attacker.focusSkill;
        this.isSkill = this.skill != null; // Using a skill or not
        this.damage = 0;
        this.attackContext = Moverutils.AttackContext.AC_PVE;
        this.attackType = this.getAttackType();
        this.defenseFactor = 0;

        this.damage = -1;
    }

    /**
     * Returns the current attack type.
     */
    getAttackType() {
        if (this.isSkill) {
            if (this.skill.magic == false) {
                return Moverutils.AttackType.MELEE_SKILL;
            } else {
                return Moverutils.AttackType.MAGIC_SKILL;
            }
        } else if (this.attacker instanceof Psykeeper) {
            return Moverutils.AttackType.MAGIC_HIT;
        }

        return Moverutils.AttackType.AUTO_ATTACK;
    }

    /**
     * Returns the final damage of the current attack.
     */
    computeDamage() {
        if (this.damage > -1) {
            return this.damage;
        }

        const attack = this.computeAttack();
        const damage = this.applyDefense(attack);

        this.damage = damage;
        return damage;
    }

    /**
     * Returns the damage after the application of defense.
     */
    applyDefense(attack) {
        // if forced attack return attack, no defense

        let damage = attack;

        // Defense formula based on the type of attack
        switch (this.attackType) {
            case Moverutils.AttackType.MAGIC_SKILL:
                damage = this.applyMagicSkillDefense(attack);
                break;
            case Moverutils.AttackType.AUTO_ATTACK:
                damage = this.applyGenericDefense(attack);
                break;
            default: // Melee skills
                damage = this.applyDefenseParryCritical(attack);
                if (damage > 0) {
                    damage += this.getElementDamage();
                }
                break;
        }

        damage = this.applyElementDefense(damage);

        if (this.isSkill) {
            if (this.skill.id == 5041) {
                // Asal formula
                if (damage > 0) {
                    damage += this.computeAsalraalaikumDamage();
                } else {
                    damage = this.computeAsalraalaikumDamage();
                }
            }
        }

        if (damage <= 0) {
            return 0;
        }

        // TODO: Enable link attack calculations
        // damage += computePartyLinkDamage(damage);
        damage = Math.floor(damage * this.getDamageMultiplier());

        // Process events after we have final damage
        damage = this.afterDamage(damage);

        return damage;
    }

    /**
     * Returns the effective hit rate in this fight.
     */
    getHitRate() {
        if (this.attackType != Moverutils.AttackType.AUTO_ATTACK) {
            return 100;
        }

        let factor = 1.6 * 1.5 * ((this.attacker.level * 1.2) / (this.attacker.level + this.defender.level));
        let attackerHitRate = this.attacker.dex;
        let defenderParryRate = this.defender.parry;
        const hitRate = attackerHitRate / (attackerHitRate + defenderParryRate);
        const hitProb = Math.floor(hitRate * factor * 100.0);

        return Utils.clamp(hitProb + this.attacker.getExtraParam("hitrate", true), 20, 96);
    }

    /**
     * Return any applicable damage multipliers for the current attack.
     */
    getDamageMultiplier() {
        let factor = 1.0;
        //let probability = 0.0;

        if (this.isSkill) {
            const skillLevel = this.skill.levels.length;
            const skillLevelProp = this.skill.levels[skillLevel - 1];

            if (skillLevelProp.damageMultiplier != undefined) {
                factor = skillLevelProp.damageMultiplier;
            }

            if (skillLevelProp.probability != undefined) {
                //probability = skillLevelProp.probability;
            }

            // if (skillLevelProp.skillCount)

            // Vital Stab / Silent Shot
            if (this.skill.id == 5162 || this.skill.id == 8916) {
                if (this.attacker.hasBuff(7395))
                    // Dark Illusion
                    factor *= 1.4;
            }

            switch (this.skill.id) {
                case 5162: // Vital Stab
                    // Double damage 60% of the time = 1.6
                    factor *= 1 - skillLevelProp.probability / 100.0 + 2 * (skillLevelProp.probability / 100.0);
                    break;
                case 6910: // Aimed Shot
                case 9538: // Spring Attack
                    factor = 1 - skillLevelProp.probability / 100.0 + 2 * (skillLevelProp.probability / 100.0);
                    break;
                case 1526: // Junk Arrow
                    factor *= skillLevelProp.probability / 100.0;
                    factor *= 4; // Hits 4 times
                    break;
                case 7156: // Hit of Penya
                    factor *= 4; // skillLevelProp->destData[0] / 100
                    break;
            }

            // TODO: Skill awake bonuses
        }

        // Blade 0.75x damage if hitting with left hand
        if (this.attacker instanceof Blade) {
            factor *= this.getAverageChanceMultiplier(25, 0.75);
        }

        // Sword cross multiplier
        if (this.attacker instanceof Knight && this.weapon.triggerSkillProbability != undefined) {
            factor *= this.getAverageChanceMultiplier(this.weapon.triggerSkillProbability, 2.0);
        }

        // Level difference reductions
        let delta = this.defender.level - this.attacker.level;
        if (delta > 0) {
            const reduceFactor = [
                1.0, 1.0, 0.98, 0.95, 0.91, 0.87, 0.81, 0.75, 0.67, 0.59, 0.51, 0.42, 0.32, 0.22, 0.12, 0.01,
            ];

            delta = Math.min(delta, reduceFactor.length - 1);
            factor *= reduceFactor[delta];
        }

        return factor;
    }

    /**
     * Calculations after main damage computation.
     */
    afterDamage(damage) {
        if (this.isSkill && this.skill.id == 1947) {
            // Reflex hit
            //const skillLevel = this.skill.levels.length;
            //const reflexPercent = 100; // destData[0]
            // TODO: Reflex hit damage addition
        }

        return damage;
    }

    /**
     * Return the generic defense. (for auto attacks)
     */
    applyGenericDefense(attack) {
        let defense = this.computeDefense();
        defense = Math.floor((defense * this.defenseFactor) / Moverutils.ATTACK_ELEMENT_FACTOR);

        let damage = this.applyAttackDefense(attack, defense);

        if (damage > 0) {
            // Critical damage stuff
            const criticalChance = this.getCriticalProbability();
            let minCritical = 1.1;
            let maxCritical = 1.4;

            if (this.attacker.level > this.defender.level) {
                minCritical = 1.2;
                maxCritical = 2.0;
            }

            const criticalFactor = (minCritical + maxCritical) / 2.0;
            const criticalBonus = Math.max(0.1, 1.0 + this.attacker.getExtraParam("criticaldamage", true) / 100.0);
            const criticalDamage = Math.floor(criticalFactor * criticalBonus * damage);

            damage = Math.floor(Utils.lerp(damage, criticalDamage, criticalChance / 100));

            // Block stuff
            const blockFactor = this.getBlockFactor();
            if (blockFactor < 1.0) {
                damage = Math.floor(damage * blockFactor);
            }
        } else {
            damage = 0;
        }

        // TODO: Monster attacking player stuff here...

        return damage;
    }

    /**
     * Returns the block factor of the defender.
     */
    getBlockFactor() {
        // For monsters only
        // 5% of the time factor = 1
        // 5% of the time factor = 0.1
        // 90% of the time it does the full calculation
        const minBlock = 0.1;
        const regularBlock = 0.2;
        let factor = 1.0;

        let blockRate = Math.floor((this.defender.parry - this.defender.level) * 0.5);
        blockRate = Math.max(blockRate, 0);

        // This is the average multiplier you get on your damage in terms of blocking
        factor = 1 - blockRate / 100.0 + ((minBlock + regularBlock) / 2.0) * (blockRate / 100.0);

        return factor;
    }

    /**
     * Returns element resistance defense.
     */
    applyElementDefense(attack) {
        let damage = attack;

        let skillElement = Moverutils.Elements.none;
        if (this.isSkill) {
            skillElement = Moverutils.Elements[this.skill.element];
        }

        // Get the weapon element
        let weaponElement = Moverutils.Elements.none;
        if (this.attacker.mainhandElement != Moverutils.Elements.none) {
            weaponElement = this.attacker.mainhandElement;
        } else if (this.weapon.element) {
            weaponElement = Moverutils.Elements[this.weapon.element];
        }

        const attackerElement = skillElement != Moverutils.Elements.none ? skillElement : weaponElement;

        damage = Math.floor(attack * (1.0 - this.getElementResist(attackerElement)));

        if (skillElement != Moverutils.Elements.none) {
            // Apply more damage if the skill and weapon match elements
            if (skillElement == weaponElement) {
                return Math.floor(damage * 1.1);
            }

            // 10% less damage if the weapon's element is weak compared to the skill
            if (
                (weaponElement == Moverutils.Elements.water && skillElement == Moverutils.Elements.fire) ||
                (weaponElement == Moverutils.Elements.electricity && skillElement == Moverutils.Elements.water) ||
                (weaponElement == Moverutils.Elements.earth && skillElement == Moverutils.Elements.electricity) ||
                (weaponElement == Moverutils.Elements.wind && skillElement == Moverutils.Elements.earth) ||
                (weaponElement == Moverutils.Elements.fire && skillElement == Moverutils.Elements.wind)
            ) {
                return Math.floor(damage * 0.9);
            }
        }

        return damage;
    }

    /**
     * Returns the magic skill defense.
     */
    applyMagicSkillDefense(attack) {
        if (!this.isSkill) {
            return 0;
        }

        if (this.attackContext == Moverutils.AttackContext.AC_PVP) {
            attack -= (attack * this.defender.getExtraParam("magicDefense", true)) / 100;
        }

        // Spirit bomb
        if (this.skill.id == 6206) {
            attack *= Math.min(100.0 / 90.0, 1.0) * 2.0; // 100% mana
        }

        const defense = this.computeDefense();
        return this.applyAttackDefense(attack, defense);
    }

    /**
     * Returns the amount of elemental resistance the defender has against the given element.
     */
    getElementResist(element) {
        switch (element) {
            case Moverutils.Elements.fire:
                return this.defender.resistFire;
            case Moverutils.Elements.water:
                return this.defender.resistWater;
            case Moverutils.Elements.earth:
                return this.defender.resistEarth;
            case Moverutils.Elements.wind:
                return this.defender.resistWind;
            case Moverutils.Elements.electricity:
                return this.defender.resistElectricity;
            default:
                return 0;
        }
    }

    /**
     * Returns the additional element damage amount.
     */
    getElementDamage() {
        let element = Moverutils.Elements.none;
        let attack = 0;

        // TODO: Element upgrade calculations here
        element = Moverutils.Elements[this.weapon.element];
        if (element != Moverutils.Elements.none) {
            attack = 16; // API does not include itemProp->elementAttack
        }

        if (element != Moverutils.Elements.none) {
            return Math.floor(attack * (1.0 - this.getElementResist(element)));
        } else {
            return 0;
        }
    }

    /**
     * Returns the damage after application of defense for regular hits.
     */
    applyDefenseParryCritical(attack) {
        let damage;

        if (this.isSkill && (this.skill.id == 5041 || this.skill.id == 7156)) {
            // Asal and HoP ignore defense completely
            damage = attack;
        } else {
            const defense = this.computeDefense();
            damage = this.applyAttackDefense(attack, defense);
        }

        if (damage < 0) {
            damage = 0;
        }

        if (!this.isSkill) {
            const criticalChance = this.getCriticalProbability();

            let criticalFactor = 2.3;
            const criticalBonus = Math.max(0.1, 1.0 + this.attacker.getExtraParam("criticaldamage", true) / 100.0);
            const criticalDamage = Math.floor(criticalFactor * criticalBonus * damage);

            return Math.floor(damage * (1 - criticalChance / 100.0) + criticalDamage * (criticalChance / 100.0));
        }

        return damage;
    }

    /**
     * Returns whether or not
     */
    getCriticalProbability() {
        if (this.isSkill) {
            return 0.0;
        }

        const probFactor = 1.0; // Critical resist would factor here
        return Math.floor(this.attacker.getCriticalChance() * probFactor);
    }

    /**
     * Apply the defender defense onto the current attack.
     */
    applyAttackDefense(attack, defense) {
        const factor = 2.0;
        let value = 0.0;
        const sum = defense + factor * attack;

        if (defense > 0 && sum > 1.0) {
            value = Math.sqrt(defense / sum);
        }

        const corr = Math.floor(Utils.lerp(defense, attack, value));

        return attack - corr;
    }

    /**
     * Returns the defense of the defender for this current attack.
     */
    computeDefense() {
        let defense;

        if (this.attackType == Moverutils.AttackType.MAGIC_SKILL) {
            if (this.attackContext == Moverutils.AttackContext.AC_PVE)
                defense = 0; // Magic skills have no defense in PvE
            else defense = this.defender.getExtraParam("magicDefense");
        } else if (this.attackType == Moverutils.AttackType.AUTO_ATTACK) {
            defense = this.computeGenericDefense();
        } else if (this.attackType == Moverutils.AttackType.MAGIC_HIT) {
            defense = Math.floor(this.defender.magicDefense / 7.0 + 1);
        } else {
            defense = Math.floor(this.defender.defense / 7.0 + 1);
        }

        let defenseFactor = 1.0;
        // Armor penetrate multiplier would be added here
        // ExtraParam defense rate added here for players

        defense = Math.floor(defense * defenseFactor);
        if (defense < 0) {
            defense = 0;
        }

        return defense;
    }

    /**
     * Return the regular defense for this auto attack.
     */
    computeGenericDefense() {
        const jobFactor = 1.0; // Monsters just use a flat 1.0
        const level = this.defender.level;
        let equipmentDefense = this.defender.defense;

        const staFactor = 0.75;
        const levelScale = 2.0 / 2.8;
        const statScale = 0.5 / 2.8;

        let defense = Math.floor(
            level * levelScale + (this.defender.sta * statScale + (this.defender.sta - 14) * jobFactor) * staFactor - 4
        );
        equipmentDefense /= 4;
        defense += equipmentDefense;
        // players would add flat defense bonuses here

        return defense;
    }

    /**
     * Returns the attack value based on the current attack.
     */
    computeAttack() {
        let attack = 0;
        // let count = 0;

        // Find attack based on the attack type
        switch (this.attackType) {
            case Moverutils.AttackType.MELEE_SKILL:
                attack = this.getMeleeSkillPower();
                break;
            case Moverutils.AttackType.MAGIC_SKILL:
                attack = this.getMagicSkillPower();
                break;
            case Moverutils.AttackType.MAGIC_HIT:
                attack = this.getMagicHitPower();
                break;
            case Moverutils.AttackType.AUTO_ATTACK:
                attack = this.getHitPower();
                break;
        }

        attack = Math.floor(attack * this.getAttackMultiplier());
        // if (count > 0) attack *= 0.1;
        // if (!isDamageOverTime()) {...}
        attack += this.attacker.getExtraParam("attack");

        return Math.max(attack, 0);
    }

    /**
     * Returns the power of a melee skill.
     */
    getMeleeSkillPower() {
        const skill = this.skill;

        // TODO: Allow customization of skill level
        const skillLevel = skill.levels.length - 1;
        const levelProp = skill.levels[skillLevel];

        const weaponAttack = this.getWeaponAttackPower();

        const referStat = this.getStatScale(
            skillLevel,
            levelProp,
            this.attackContext == Moverutils.AttackContext.AC_PVP
        );

        let powerMin, powerMax;

        powerMin =
            ((weaponAttack[0] + (levelProp.minAttack + this.weapon.additionalSkillDamage) * 5 + referStat - 20) *
                (16 + skillLevel)) /
            13;
        powerMax =
            ((weaponAttack[1] + (levelProp.maxAttack + this.weapon.additionalSkillDamage) * 5 + referStat - 20) *
                (16 + skillLevel)) /
            13;

        const weaponDamage = this.attacker.getExtraParam(this.weapon.subcategory + "attack");

        powerMin = this.attacker.getExtraParam("damage") + Math.floor(powerMin) + weaponDamage;
        powerMax = this.attacker.getExtraParam("damage") + Math.floor(powerMax) + weaponDamage;

        const final = (powerMin + powerMax) / 2.0;

        return Math.max(Math.floor(final), 1);
    }

    /**
     * Returns the power of a magic skill.
     */
    getMagicSkillPower() {
        let attack = this.getMeleeSkillPower();
        const skill = this.skill;

        attack += (attack * this.attacker.getExtraParam("magicattack", true)) / 100.0;

        let bonus = 0;
        switch (skill.element) {
            case "fire":
                bonus = this.attacker.getExtraParam("firemastery", true);
                break;
            case "earth":
                bonus = this.attacker.getExtraParam("earthmastery", true);
                break;
            case "water":
                bonus = this.attacker.getExtraParam("watermastery", true);
                break;
            case "wind":
                bonus = this.attacker.getExtraParam("windmastery", true);
                break;
            case "electricity":
                bonus = this.attacker.getExtraParam("electricitymastery", true);
                break;
        }

        if (bonus != 0) {
            return Math.floor(attack * (1.0 + bonus / 100.0));
        }

        return attack;
    }

    /**
     * Returns the power of a magic hit.
     */
    getMagicHitPower() {
        let minMax = this.getWeaponAttackPower();
        const attack = this.getWeaponAttack("wand");

        minMax[0] += attack;
        minMax[1] += attack;

        let damage = Math.floor((minMax[0] + minMax[1]) / 2.0);
        damage += this.attacker.getExtraParam("damage");

        const wandChargeFactor = 0.6; // This is the factor at 0 charge
        damage = Math.floor(damage * wandChargeFactor);
        return damage;
    }

    /**
     * Returns the power of regular hit.
     */
    getHitPower() {
        const attackFactor = this.getDamagePropertyFactor();

        const minmax = this.getHitMinMax();
        let attack = Math.floor((minmax[0] + minmax[1]) / 2);
        attack = Math.floor((attack * attackFactor) / Moverutils.ATTACK_ELEMENT_FACTOR);

        return attack;
    }

    /**
     * Returns the min and max hit.
     */
    getHitMinMax() {
        let min = this.weapon.minAttack * 2;
        let max = this.weapon.maxAttack * 2;

        // Not used in anything right now
        // min += this.attacker.getExtraParam("minability");
        // max += this.attacker.getExtraParam("maxability");

        const plus = this.getWeaponAttack(this.weapon.subcategory) + this.attacker.getExtraParam("damage");
        min += plus;
        max += plus;

        const factor = this.getWeaponMultiplier();
        min = Math.floor(min * factor);
        max = Math.floor(max * factor);

        if (this.attacker.mainhandUpgrade > 0) {
            const value = Math.floor(Math.pow(this.attacker.mainhandUpgrade, 1.5));
            min += value;
            max += value;
        }

        // Spirit strike / Heart of Fury
        const spiritStrike = this.attacker.getExtraParam("spiritstrike", true);
        if (spiritStrike > 0) {
            const bonus = (spiritStrike * this.attacker.fp) / 100.0;
            min += bonus;
            max += bonus;
        }

        return [min, max];
    }

    /**
     * Returns the attack and defense factors.
     */
    getDamagePropertyFactor() {
        let attackFactor = Moverutils.ATTACK_ELEMENT_FACTOR;
        this.defenseFactor = Moverutils.ATTACK_ELEMENT_FACTOR;

        // Attacker element stuff
        let attackType = Moverutils.Elements.none;
        let attackLevel = 0;
        let plusAttack = 0;

        if (this.attacker.mainhandElement != Moverutils.Elements.none) {
            // Weapon element upgrade
            attackType = this.attacker.mainhandElement;
            attackLevel = this.attacker.mainhandElementUpgrade + this.attacker.getExtraParam("elementattack");
        } else {
            // Inherent element
            if (Moverutils.Elements[this.attacker.mainhand.element] != undefined) {
                attackType = Moverutils.Elements[this.attacker.mainhand.element];
            }
        }

        // plusAttack = getElementAdditionalAttack(part);

        // Defender element stuff
        let defenseType = "none";
        let defenseLevel = 0;
        let plusDefense = 0;

        if (this.attackContext == Moverutils.AttackContext.AC_PVE) {
            if (Moverutils.Elements[this.defender.element] != undefined) {
                defenseType = Moverutils.Elements[this.defender.element];
            }
            defenseLevel = 1; // monster element attack, usually 1
        }

        if (attackType == Moverutils.Elements.none && defenseType == Moverutils.Elements.none) {
            return attackFactor;
        }

        const Relation = {
            None: 0, // One has no element.
            Same: 1, // Same element.
            Weak: 2, // Attacker element is weak.
            Strong: 3, // Attacker element is strong.
        };

        // Element matchup table
        const table = [
            [Relation.None, Relation.None, Relation.None, Relation.None, Relation.None, Relation.None],
            [Relation.None, Relation.Same, Relation.Weak, Relation.None, Relation.Strong, Relation.None],
            [Relation.None, Relation.Strong, Relation.Same, Relation.Weak, Relation.None, Relation.None],
            [Relation.None, Relation.None, Relation.Strong, Relation.Same, Relation.None, Relation.Weak],
            [Relation.None, Relation.Weak, Relation.None, Relation.None, Relation.Same, Relation.Strong],
            [Relation.None, Relation.None, Relation.None, Relation.Strong, Relation.Weak, Relation.Same],
        ];

        const result = table[attackType][defenseType];

        let factor = 0;
        let level = 0;

        // Bonus attack based on upgrade levels
        const upgradeFactors = {
            attackDamage: [5.0, 5.22, 5.6, 6.12, 6.8, 7.63, 8.6, 9.73, 11.01, 12.44],
            damage: [2, 2.21, 2.56, 3.05, 3.68, 4.46, 5.37, 6.42, 7.61, 8.95],
        };

        switch (result) {
            case Relation.Weak:
                level = attackLevel - 5 - defenseLevel;
                this.defenseFactor += plusDefense;
                break;
            case Relation.Strong:
                level = attackLevel - (defenseLevel > 5 ? defenseLevel - 5 : 0);
                if (level > 0) {
                    factor += upgradeFactors.attackDamage[Math.min(level, 10) - 1];
                }
                attackFactor += plusAttack;
                break;
            default:
                if (attackLevel > 0 && defenseLevel == 0) {
                    factor += upgradeFactors.damage[Math.min(attackLevel, 10) - 1];
                } else if (attackLevel == 0 && defenseLevel > 0) {
                    let lvl = defenseLevel - 3;
                    if (lvl <= 0) {
                        factor -= 0;
                    } else {
                        upgradeFactors.damage[Math.min(lvl, 10) - 1];
                    }
                } else if (attackLevel > 0 && defenseLevel > 0) {
                    level = attackLevel - defenseLevel;
                }
                break;
        }

        if (level != 0) {
            if (level > 0) {
                factor += upgradeFactors.damage[Math.min(level, 10) - 1];
            } else {
                factor -= upgradeFactors.damage[Math.min(-level, 10) - 1];
            }
        }

        attackFactor += factor;
        this.defenseFactor += factor;

        return attackFactor;
    }

    /**
     * Returns the attack power multiplier for the current attack.
     */
    getAttackMultiplier() {
        let sumPower = this.attacker.getExtraParam("attack", true);
        const achievementBonus = 0; // Assuming you have level one achievement

        if (this.isSkill) {
            sumPower += this.attacker.getExtraParam("skilldamage", true);
        }

        if (this.attackContext == Moverutils.AttackContext.AC_PVE) {
            sumPower += achievementBonus;
            sumPower += Math.max(0, this.attacker.getExtraParam("pvedamage", true));
        } else {
            sumPower += Math.max(0, this.attacker.getExtraParam("pvpdamage", true));
        }

        let factor = 1.0 + sumPower / 100.0;
        // Upcut stone
        if (this.attacker.activePremiumItems.find((buff) => buff.id == 8691 && buff.enabled)) {
            factor *= 1.2;
        }

        return factor;
    }

    /**
     * Returns the attack for the specified weapon type.
     */
    getWeaponAttack(type) {
        let levelFactor = 0;
        let statValue = 0;
        let addValue = 0;

        switch (type) {
            case "sword":
            case "yoyo":
                levelFactor = 1.1;
                statValue = this.attacker.str - 12;
                break;
            case "axe":
                levelFactor = 1.2;
                statValue = this.attacker.str - 12;
                break;
            case "staff":
                levelFactor = 1.1;
                statValue = this.attacker.str - 10;
                break;
            case "stick":
                levelFactor = 1.3;
                statValue = this.attacker.str - 10;
                break;
            case "knuckle":
                levelFactor = 1.2;
                statValue = this.attacker.str - 10;
                break;
            case "wand":
                levelFactor = 1.2;
                statValue = this.attacker.int - 10;
                break;
            case "bow":
                levelFactor = 0.91;
                statValue = this.attacker.dex - 14;
                addValue = 0.14 * this.attacker.str;
                break;
            default:
                levelFactor = 1.1;
                statValue = this.attacker.str - 10;
                break;
        }

        const plusAttack = this.attacker.getExtraParam(type + "attack");
        const statAttack = statValue * this.attacker.constants[type];
        const levelAttack = this.attacker.level * levelFactor;

        const attack = plusAttack + Math.floor(statAttack + levelAttack + addValue);
        return attack;
    }

    /**
     * Calculate and return Asal damage.
     */
    computeAsalraalaikumDamage() {
        const skillLevel = this.skill.levels.length;
        let add;

        switch (skillLevel) {
            case 1:
                add = 20;
                break;
            case 2:
                add = 30;
                break;
            case 3:
                add = 40;
                break;
            case 4:
                add = 50;
                break;
            case 5:
                add = 60;
                break;
            case 6:
                add = 70;
                break;
            case 7:
                add = 80;
                break;
            case 8:
                add = 90;
                break;
            case 9:
                add = 100;
                break;
            case 10:
                add = 150;
                break;
            default:
                return 0;
        }

        const mana = Math.floor(this.attacker.mp);
        return Math.floor(this.attacker.str / 10) * skillLevel * (5 + Math.floor(mana / 10)) + add;
    }

    /**
     * Returns the attack power of the currently equipped weapon.
     */
    getWeaponAttackPower() {
        let f = 1.0;
        let add = 0;

        const upgrade = this.attacker.mainhandUpgrade;
        if (upgrade > 0) {
            add = Math.floor(Math.pow(upgrade, 1.5));
        }

        f = this.getWeaponMultiplier();

        let power = [this.weapon.minAttack, this.weapon.maxAttack];
        // If the attacker is a monster, this is where we add its min and max attack to power

        power[0] *= f;
        power[1] *= f;
        power[0] += add;
        power[1] += add;

        return power;
    }

    /**
     * Returns the attack multiplier for the currently equipped weapon.
     */
    getWeaponMultiplier() {
        let value = 1.0;
        let upgrade = this.attacker.mainhandUpgrade;

        if (this.weapon.rarity == "ultimate") {
            upgrade = 10;
        }

        if (upgrade > 0) {
            value += (value * this.attacker.mainhandUpgradeBonus.weaponAttack) / 100.0;
        }

        return value;
    }

    /**
     * Returns the scaled attack for this skill.
     */
    getStatScale(level, levelProp, isPVP) {
        let total = 0;
        let spellContext = isPVP ? Moverutils.AttackContext.AC_PVP : Moverutils.AttackContext.AC_PVE;

        for (let scale of levelProp.scalingParameters) {
            if (scale.parameter == "attack" && scale[spellContext]) {
                let statValue = 0;

                switch (scale.stat) {
                    case "int":
                        statValue = this.attacker.int;
                        break;
                    case "sta":
                        statValue = this.attacker.sta;
                        break;
                    case "str":
                        statValue = this.attacker.str;
                        break;
                    case "dex":
                        statValue = this.attacker.dex;
                        break;
                }

                // TODO: Maximum check
                const realValue = Utils.convertStatScale(scale.scale, level);
                total += (realValue / 10.0) * statValue + (level * statValue) / 50.0;
            }
        }

        return Math.floor(total);
    }

    ///
    /// Damage calculation utilities
    ///

    /**
     * Returns the average damage multiplier at a given chance
     */
    getAverageChanceMultiplier(chance, multiplier) {
        return 1 - chance / 100.0 + multiplier * (chance / 100.0);
    }

    /**
     * Returns the damage per second for the current attack.
     */
    getDamagePerSecond() {
        let dps = 1;
        let hitsPerSecond = 0;
        const damage = this.computeDamage();

        if (this.attackType == Moverutils.AttackType.AUTO_ATTACK) {
            const hitRate = this.getHitRate();
            const attackSpeed = this.attacker.aspd;
            hitsPerSecond = this.attacker.constants.hps * attackSpeed * (hitRate / 100);
        } else if (this.isSkill) {
            const skillLevel = this.skill.levels.length;
            const skillLevelProp = this.skill.levels[skillLevel - 1];

            const frames = 55.0; // Most skills are around this range
            const cooldown = skillLevelProp.cooldown != undefined ? skillLevelProp.cooldown : 0;
            hitsPerSecond = ((30 / frames) * this.attacker.DCT) / (cooldown + 1);
            // TODO: Damage over time
        }

        dps = damage * hitsPerSecond;
        return dps.toFixed(0);
    }

    /**
     * Returns the number of seconds required to kill the current monster.
     */
    getTimeToKill() {
        return (this.defender.hp / this.getDamagePerSecond()).toFixed(2);
    }
}
