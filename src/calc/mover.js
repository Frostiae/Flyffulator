/* eslint-disable */
import { Vagrant, Assist, Billposter, Ringmaster, Acrobat, Jester, Ranger, Magician, Psykeeper, Elementor, Mercenary, Blade, Knight } from "./jobs.js";
import { Utils } from "./utils.js";
import Moverutils from "./moverutils.js";
/**
 * The mover class is the base of all characters. Acts as a helper class for a lot of functions.
 */
export class Mover {
    applyData(json) { Object.assign(this, json); } // Importing a character

    update() {
        this.applyBaseGearStats();
        this.applyAssistBuffs();
        this.applySelfBuffs();

        this.skillsRawDamage = this.updateSkillDamage();
        this.remainingPoints = this.getRemainingPoints();
        this.criticalChance = this.getCriticalChance();
        this.aspd = this.getAspd();
        this.DCT = this.getDCT();
        this.attack = this.getAttack();
        this.criticalDamage = this.getCriticalDamage();
        this.averageAA = this.getAverageAA();
        this.hitrate = this.getHitrate();
        return this;
    }

    applyBaseGearStats() {
        this.str = 15 + Utils.addedStr + this.getExtraGearParam("str");
        this.sta = 15 + Utils.addedSta + this.getExtraGearParam("sta");
        this.dex = 15 + Utils.addedDex + this.getExtraGearParam("dex");
        this.int = 15 + Utils.addedInt + this.getExtraGearParam("int");
    }

    applyAssistBuffs() {
        if (this.assistBuffs) { // Add buffs
            if (this.activeAssistBuffs.length == 0) {
                this.activeAssistBuffs = [
                    Utils.getSkillByName('Cannon Ball'),
                    Utils.getSkillByName('Beef Up'),
                    Utils.getSkillByName('Heap Up'),
                    Utils.getSkillByName('Mental Sign'),
                    Utils.getSkillByName('Patience'),
                    Utils.getSkillByName('Haste'),
                    Utils.getSkillByName('Cat\'s Reflex'),
                    Utils.getSkillByName('Accuracy')
                ];
            }

            this.str += this.assistBuffParam('str');
            this.sta += this.assistBuffParam('sta');
            this.int += this.assistBuffParam('int');
            this.dex += this.assistBuffParam('dex');
        } else if (!this.assistBuffs && this.activeAssistBuffs.length != 0) { // Remove buffs
            this.activeAssistBuffs = [];
        }
    }

    applySelfBuffs() {
        // TODO: Add 1st job buffs here, like sword mastery
        if (this.selfBuffs && this.activeSelfBuffs.length == 0) {
            this.activeSelfBuffs = this.constants.buffs;

            this.str += this.selfBuffParam('str');
            this.sta += this.selfBuffParam('sta');
            this.int += this.selfBuffParam('int');
            this.dex += this.selfBuffParam('dex');
        } else if (!this.selfBuffs && this.activeSelfBuffs.length != 0) {
            this.str -= this.selfBuffParam('str');
            this.sta -= this.selfBuffParam('sta');
            this.int -= this.selfBuffParam('int');
            this.dex -= this.selfBuffParam('dex');

            this.activeSelfBuffs = [];
        }
    }

    // TODO: Remove the use of this in autoratio and get rid of it
    getRemainingPoints() {
        let points = this.level * 2 - 2;
        points -= (this.str + this.sta + this.dex + this.int) - 60; // Don't count the base 15
        if (this.assistBuffs && this.activeAssistBuffs.length) {
            points += this.getExtraBuffParam('dex') +
                this.getExtraBuffParam('sta') +
                this.getExtraBuffParam('str') +
                this.getExtraBuffParam('int');
        }
        return points;
    }

    get parry() { return this.dex / 2; }

    get defense() {
        // TODO: Use the formula?
        let defense = Math.floor(((((this.level * 2) + (this.sta / 2)) / 2.8) - 4) + ((this.sta - 14) * this.constants.Def));
        defense += this.getExtraParam('def');
        defense *= 1 + (this.getExtraParam('def', true) / 100);
        return defense;
    }

    getAspd() {
        const weaponAspd = Utils.getWeaponSpeed(this.mainhand);
        let a = Math.floor(this.constants.attackSpeed + (weaponAspd * (4.0 * this.dex + this.level / 8.0)) - 3.0);
        if (a >= 187.5) a = Math.floor(187.5);

        const index = Math.floor(Math.min(Math.max(a / 10, 0), 17));
        const arr = [
            0.08, 0.16, 0.24, 0.32, 0.40,
            0.48, 0.56, 0.64, 0.72, 0.80,
            0.88, 0.96, 1.04, 1.12, 1.20,
            1.30, 1.38, 1.50
        ];

        const plusValue = arr[index];
        let fspeed = ((50.0 / (200.0 - a)) / 2.0) + plusValue;

        fspeed = fspeed > 0.1 ? fspeed : 0.1;
        fspeed = fspeed < 2.0 ? fspeed : 2.0;

        let final = fspeed * 100 / 2;

        final += this.getExtraParam('attackspeed', true);
        final = final > 100 ? 100 : final;
        return Math.floor(final);
    }

    getCriticalChance() {
        let chance = this.dex / 10;
        chance = Math.floor(chance * this.constants.critical);
        chance = chance >= 100 ? 100 : chance;
        chance = chance < 0 ? 0 : chance;

        chance += this.getExtraParam('criticalchance', true);
        return chance > 100 ? 100 : chance;
    }

    getDCT() {
        let dct = 100; // Starts out as 100%
        dct += this.getExtraParam('decreasedcastingtime', true);
        return dct;
    }

    getAttack() {
        let pnMin = 3 * 2;
        let pnMax = 4 * 2;

        if (this.mainhand) {
            pnMin = this.mainhand.minAttack * 2;
            pnMax = this.mainhand.maxAttack * 2;
        }

        let plus = this.weaponAttack();
        pnMin += plus;
        pnMax += plus;

        let final = (pnMin + pnMax) / 2;

        final += this.getExtraParam("attack");
        final *= 1 + (this.getExtraParam("attack", true) / 100);
        return final;
    }

    /**
     * Get the total ADoCH%.
     */
    getCriticalDamage() {
        let adoch = 0;
        adoch += this.getExtraParam('criticaldamage', true);
        return adoch;
    }

    /**
     * Get the average critical auto attack hit damage.
     */
    getCriticalHit() {
        // CMover::GetHitPower
        const normalHit = this.attack;
        const critMinFactor = 1.2 + this.criticalDamage / 100;
        const critMaxFactor = 2.0 + this.criticalDamage / 100;
        const critAvgFactor = (critMinFactor + critMaxFactor) / 2;

        return normalHit * critAvgFactor;
    }

    /**
     * Get the average normal auto attack hit damage;
     */
    getAverageAA() {
        // Weapon element calculations are in CMover::CalcPropDamage
        const avgNormal = this.attack;
        const avgCrit = this.getCriticalHit();

        let final = ((avgCrit - avgNormal) * this.criticalChance / 100) + avgNormal;

        // Knight Swordcross calculation
        if (this instanceof Knight && this.mainhand && this.mainhand.triggerSkillProbability) {
            const swordcrossFactor = 1.0; // 100% extra damage
            const swordcrossChance = this.mainhand.triggerSkillProbability / 100;
            final += final * (swordcrossFactor * swordcrossChance);
        }

        // Blade offhand calculation
        if (this instanceof Blade) { final = (final + (final * 0.75)) / 2; }

        return final < avgNormal ? avgNormal : final; // we wont hit below our normal, non-crit hit
        // CMover::GetAtkMultiplier
    }

    getHitrate() {
        let hit = this.dex / 4;
        hit += this.getExtraParam('hitrate', true);
        return hit;
    }

    weaponAttack() {
        let weapon = "";
        if (this.mainhand)
            weapon = this.mainhand.subcategory;
        switch (weapon) {
            case 'axe':
                return Math.floor(((this.str - 12) * this.constants[weapon]) + ((this.level * 1.2)));
            case 'staff':
                return Math.floor(((this.str - 10) * this.constants[weapon]) + ((this.level * 1.1)));
            case 'stick':
                return Math.floor(((this.str - 10) * this.constants[weapon]) + ((this.level * 1.3)));
            case 'knuckle':
                return Math.floor(((this.str - 10) * this.constants[weapon]) + ((this.level * 1.2)));
            case 'wand':
                return Math.floor((this.int - 10) * this.constants[weapon] + this.level * 1.2);
            case 'bow': //  This is definitely incorrect for project M
                return Math.floor(((this.dex - 14) * this.constants[weapon] + (this.level * 1.3) * 0.7));
            default:
                return Math.floor(((this.str - 12) * this.constants[weapon]) + ((this.level * 1.1)));
        }
    }

    /**
     * Returns the amount of <param> found in all equipment and all buffs.
     * @param param The parameter to look for in all equipment and buffs 
     */
    getExtraParam(param, rate = false) {
        return this.getExtraGearParam(param, rate) + this.getExtraBuffParam(param, rate);
    }

    getExtraBuffParam(param, rate = false) {
        return this.assistBuffParam(param, rate) + this.selfBuffParam(param, rate);
    }

    getExtraGearParam(param, rate = false) {
        return this.armorParam(param, rate) + this.weaponParam(param, rate) + this.jeweleryParam(param, rate);
    }

    armorParam(param, rate = false) {
        var params = [param].concat(Utils.globalParams[param]);

        var add = 0;
        if (this.armor && this.armor.bonus) {
            const bonus = this.armor.bonus.find(a => params.includes(a.ability.parameter) && a.ability.rate == rate);
            if (bonus) add = bonus.ability.add;
        }

        // Suit Piercing
        if (this.suitPiercing) {
            const ability = this.suitPiercing.abilities[0]; // Piercing cards only have one ability
            if (params.includes(ability.parameter) && ability.rate == rate) {
                add += ability.add * 4; // 4 card piercing slots
            }
        }

        return add;
    }

    weaponParam(param, rate = false) {
        var add = 0;
        var params = [param].concat(Utils.globalParams[param]);

        // Mainhand bonus addition
        if (this.mainhand && this.mainhand.abilities) {
            const bonus = this.mainhand.abilities.find(a => params.includes(a.parameter) && a.rate == rate);
            if (bonus) add += bonus.add;
        }

        // Offhand bonus addition, including shields
        if (this.offhand && this.offhand.abilities) {
            if (this.offhand.subcategory == "shield") {
                this.offhand.abilities.forEach(ability => {
                    if (params.includes(ability.parameter) && ability.rate == rate) {
                        add += ability.add;
                    }
                });
            } else {
                const bonus = this.offhand.abilities.find(a => params.includes(a.parameter) && a.rate == rate);
                if (bonus) add += bonus.add;
            }
        }

        return add;
    }

    jeweleryParam(param, rate = false) {
        var add = 0;
        var params = [param].concat(Utils.globalParams[param]);

        if (this.earringR && this.earringR.abilities) {
            const bonus = this.earringR.abilities.find(a => params.includes(a.parameter) && a.rate == rate);
            if (bonus) add += bonus.add;
        }

        if (this.earringL && this.earringL.abilities) {
            const bonus = this.earringL.abilities.find(a => params.includes(a.parameter) && a.rate == rate);
            if (bonus) add += bonus.add;
        }

        if (this.ringR && this.ringR.abilities) {
            const bonus = this.ringR.abilities.find(a => params.includes(a.parameter) && a.rate == rate);
            if (bonus) add += bonus.add;
        }

        if (this.ringL && this.ringL.abilities) {
            const bonus = this.ringL.abilities.find(a => params.includes(a.parameter) && a.rate == rate);
            if (bonus) add += bonus.add;
        }

        if (this.necklace && this.necklace.abilities) {
            const bonus = this.necklace.abilities.find(a => params.includes(a.parameter) && a.rate == rate);
            if (bonus) add += bonus.add;
        }

        return add;
    }

    /**
     * Returns additions to a specific value from your active assist buffs
     * @param param The value to find additions for 
     */
    assistBuffParam(param, rate = false) {
        var add = 0;
        var params = [param].concat(Utils.globalParams[param]);

        this.activeAssistBuffs.forEach(buff => {
            let level = buff.levels.slice(-1)[0];
            let abilities = level.abilities;

            abilities.forEach(ability => { // forEach here and not .find() because there might be multiple buffs with param
                if (params.includes(ability.parameter) && level.scalingParameters.length > 1 && ability.rate == rate) {
                    let extra = level.scalingParameters[1].scale * this.assistInt;
                    extra = extra > level.scalingParameters[1].maximum ? level.scalingParameters[1].maximum : extra;
                    add += ability.add + extra;
                } else if (params.includes(ability.parameter) && ability.rate == rate) {
                    add += ability.add;
                }
            });
        });
        return add;
    }

    selfBuffParam(param, rate = false) {
        var add = 0;
        var params = [param].concat(Utils.globalParams[param]);

        this.activeSelfBuffs.forEach(buff => {
            let level = buff.levels.slice(-1)[0];
            let abilities = level.abilities;

            abilities.forEach(ability => {
                if (params.includes(ability.parameter) && ability.rate == rate) {
                    add += ability.add;
                }
            });
        });

        return add;
    }

    /**
     * @param monster   The monster to find the hit rate against.
     * @returns         The percentage of hits that will connect against the monster.
     */
    hitResult(monster) {
        // CMover::GetAttackResult
        let hitRate = Math.floor(((this.dex * 1.6) / (this.dex + monster.parry)) * 1.5 *
            (this.level * 1.2 / (this.level + monster.level)) * 100.0);

        hitRate += this.hitrate;
        hitRate = hitRate > 96 ? 96 : hitRate;
        hitRate = hitRate < 20 ? 20 : hitRate;

        return hitRate;
    }

    /**
     * @param monster   The monster to find the time to kill for.
     * @returns         The time to kill the monster using auto attacks.
     */
    ttkMonster(monster) {
        if (!monster) return 0;
        let res = {};
        const auto = this.ttkAuto(monster);
        const skill1 = this.ttkSkill(monster, 0);
        const skill2 = this.ttkSkill(monster, 1);
        const skill3 = this.ttkSkill(monster, 2);
        res.auto = auto; // Auto attack
        res.skill1 = skill1;
        res.skill2 = skill2;
        res.skill3 = skill3;

        return res;
    }

    ttkSkill(monster, index) {
        // Skills
        if (!this.constants.skills[index]) return;
        return monster.hp / this.getDPS(monster, index);
    }

    ttkAuto(monster) {
        // Auto attack
        return monster.hp / this.getDPS(monster);
    }

    /**
     * Gets the damage per second numbers against a specific monster.
     * @param monster The monster to get DPS against
     * @param skillIndex The skill to use, or auto attack if null
     */
    getDPS(monster, skillIndex = null) {
        let damage = 1;
        let dps = 1;

        if (skillIndex == null) {
            const hitrate = this instanceof Psykeeper ? 100 : this.hitResult(monster);
            damage = this.getDamage(monster);
            let hitsPerSec = this.constants.hps * this.aspd / 100; // This weighs very heavily on the DPS
            hitsPerSec *= hitrate / 100;

            dps = damage * hitsPerSec;
            this.dps.aa = dps;
        } else {
            // TODO: Add dotTick support here
            damage = this.getDamage(monster, skillIndex);
            const frames = 55;
            const hitsPerSec = (30 / frames) * (this.DCT / 100);
            let cooldown = this.constants.skills[skillIndex].levels.slice(-1)[0].cooldown;
            if (!cooldown) cooldown = 0;

            dps = damage * (hitsPerSec / (cooldown + 1))
            this.dps[skillIndex] = dps;
        }

        return dps;
    }

    /**
     * Get your damage against a specific monster
     * @param {monster} opponent The monster you are facing
     * @param {int} skillIndex The index of the skill you are using, null or -1 if none
     */
    getDamage(opponent, skillIndex = null) {
        // TODO: Incorporate element vs element calculation for skills (CAttackArbiter::PostCalcDamage)
        const deltaFactor = Moverutils.getDeltaFactor(opponent.level, this.level);
        var damage = 1;
        var defense = 1;

        if (skillIndex == null || skillIndex == -1) {
            damage = this.averageAA;
            defense = Moverutils.calcMonsterDefense(opponent);
        } else {
            var skill = this.constants.skills[skillIndex];
            defense = Moverutils.calcMonsterDefense(opponent, skill.magic);
            damage = Object.values(this.skillsRawDamage)[skillIndex];
        }

        damage -= Moverutils.calcDamageDefense(defense, damage);
        // damage -= defense; // OLD
        damage *= deltaFactor;

        return damage < 1 ? 1 : damage;
    }

    /**
     * Don't call this directly, use getDamage() instead.
     * Updates and caches each skill's raw damage inside this.skillsRawDamage.
     */
    updateSkillDamage() {
        let res = {}
        this.constants.skills.forEach(skill => {
            if (skill) {
                let damage = this.skillDmg(skill);
                res[skill.name.en] = damage;
            }
        });

        return res;
    }

    /**
     * Calculates the raw damage of a skill.
     * @param skill The skill to calculate raw damage for 
     */
    skillDmg(skill) {
        const params = skill.levels.slice(-1)[0]; // Cannot use at() because of Safari compatibility
        let weaponMin = 3;
        let weaponMax = 4;

        if (this.mainhand) {
            weaponMin = this.mainhand.minAttack;
            weaponMax = this.mainhand.maxAttack;
        }

        const stat = params.scalingParameters[0].stat;
        var referStat = this.str;
        switch (stat) {
            case 'sta':
                referStat = this.sta;
                break;
            case 'dex':
                referStat = this.dex;
                break;
            case 'int':
                referStat = this.int;
                break;
            default:
                referStat = this.str;
        }

        // CMover::GetMeleeSkillPower()
        // TODO: Skills aren't taking attack into consideration properly
        const level = skill.levels.length;
        const base = referStat * params.scalingParameters[0].scale;
        let powerMin = ((weaponMin + (params.minAttack + 0) * 5 + base - 20) * (16 + level) / 13);
        let powerMax = ((weaponMax + (params.maxAttack + 0) * 5 + base - 20) * (16 + level) / 13);

        // TODO: get extra weapon damage here (Damage with sword, etc)
        powerMin += this.getExtraParam("damage");
        powerMax += this.getExtraParam("damage");
        let final = (powerMin + powerMax) / 2;

        // BEGIN HARDCODING
        if (this instanceof Knight && this.mainhand.triggerSkillProbability) { final += final * (1.0 * (this.mainhand.triggerSkillProbability / 100)); } // Swordcross

        switch (skill.id) {
            case 6206: // Spirit bomb
                final *= 2.25;
                break;
            case 7156: // Hit of Penya
                final *= 4.0;
            case 5041: // Asal
                final += (((this.str / 10) * level) * (5 + this.mp / 10) + 150);
        }

        switch (skill.element) {
            case "fire":
                final *= 1 + (this.getExtraParam("firemastery", true) / 100);
            case "earth":
                final *= 1 + (this.getExtraParam("earthmastery", true) / 100);
            case "water":
                final *= 1 + (this.getExtraParam("watermastery", true) / 100);
            case "wind":
                final *= 1 + (this.getExtraParam("windmastery", true) / 100);
            case "electricity":
                final *= 1 + (this.getExtraParam("electricitymastery", true) / 100);
        }

        final *= 1 + (this.getExtraParam("skilldamage") / 100);

        return final;
    }

    /**
     * Calculates the best STR:DEX ratio against the given target
     * @param target The targetted monster.
     */
    getOptimalAutoRatio(target) {
        let dpsValues = [];
        let ratios = []
        
        // Calculating for at least level 15
        this.level = this.level < 15 ? 15 : this.level;

        this.str -= Utils.addedStr;
        this.sta -= Utils.addedSta;
        this.dex -= Utils.addedDex;
        this.int -= Utils.addedInt;

        let str, dex, dps, ratio, maxRatio;
        let maxDPS = -1;
        const points = this.level * 2 - 2;
        for (let i = 0; i < 10; i++) {
            str = Math.floor(points * (i / 10));
            dex = points - str;

            this.str += str;
            this.dex += dex;

            this.criticalChance = this.getCriticalChance();
            this.aspd = this.getAspd();
            this.attack = this.getAttack();
            this.averageAA = this.getAverageAA();
            this.hitrate = this.getHitrate();

            dps = parseInt(this.getDPS(target).toFixed(0));
            ratio = `Allocate ${str} STR, ${dex} DEX`;
            dpsValues = [...dpsValues, dps];
            ratios = [...ratios, ratio];

            if (dps > maxDPS || maxDPS == -1) {
                maxDPS = dps;
                maxRatio = i + 1;
            }

            this.str -= str;
            this.dex -= dex;
        }

        return { maxDPS, maxRatio, dpsValues, ratios };
    }
}