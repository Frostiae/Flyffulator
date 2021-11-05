/* eslint-disable */
import { Vagrant, Assist, Billposter, Ringmaster, Acrobat, Jester, Ranger, Magician, Psykeeper, Elementor, Mercenary, Blade, Knight } from "./jobs.js";
import { Utils } from "./utils.js";
/**
 * The mover class is the base of all characters. Acts as a helper class for a lot of functions.
 */
export class Mover {
    update() {
        // TODO: Move most of the get methods into regular methods and call them here instead to store in the object
        // to avoid doing all those calculations everytime we do character.aspd for example. Do it once and store it
        // instead.

        this.skillsDamage = this.averageSkillDmg();
        return this;
    }

    applyAssistBuffs(enabled) {
        // TODO: Finish this
        if (enabled && !this.assistBuffs) {                // Add buffs
            this.activeBuffs = [
                Utils.getSkillByName('Cannon Ball'),
                Utils.getSkillByName('Beef Up'),
                Utils.getSkillByName('Heap Up'),
                Utils.getSkillByName('Mental Sign'),
                Utils.getSkillByName('Patience'),
                Utils.getSkillByName('Haste'),
                Utils.getSkillByName('Cat\'s Reflex'),
                Utils.getSkillByName('Accuracy')
            ];

            this.str += this.buffParam('str', this.assistInt);
            this.sta += this.buffParam('sta', this.assistInt);
            this.int += this.buffParam('int', this.assistInt);
            this.dex += this.buffParam('dex', this.assistInt);
            this.assistBuffs = true;
        } else if (!enabled && this.assistBuffs) {         // Remove buffs
            this.assistBuffs = false;
            this.str -= this.buffParam('str', this.assistInt);
            this.sta -= this.buffParam('sta', this.assistInt);
            this.int -= this.buffParam('int', this.assistInt);
            this.dex -= this.buffParam('dex', this.assistInt);

            this.activeBuffs = [];
        }
    }

    get remainingPoints() {
        let points = this.level * 2 - 2;
        points -= (this.str + this.sta + this.dex + this.int) - 60;     // Don't count the base 15
        if (this.assistBuffs && this.activeBuffs.length) {
            points += this.buffParam('dex', this.assistInt) + 
                      this.buffParam('sta', this.assistInt) + 
                      this.buffParam('str', this.assistInt) + 
                      this.buffParam('int', this.assistInt);
        }
        return points;
    }

    weaponAttack() {
        let weapon = this.constants.weapon;
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

    armorParam(param) {
        var add = 0;
        if (this.armor && this.armor.bonus) {
            const bonus = this.armor.bonus.find(a => a.ability.parameter == param);
            if (bonus) add = bonus.ability.add;
        }
        return add;
    }

    weaponParam(param) {
        var add = 0;
        if (this.weapon && this.weapon.abilities) {
            const bonus = this.weapon.abilities.find(a => a.parameter == param);
            if (bonus) add = bonus.add;
        }
        return add;
    }

    buffParam(param) {
        var add = 0;
        this.activeBuffs.forEach(buff => {
            let level = buff.levels.slice(-1)[0];
            let abilities = level.abilities;
            abilities.forEach(ability => {          // forEach here and not .find() because there might be multiple buffs with param
                if (ability.parameter == param) {
                    let extra = level.scalingParameters[1].scale * this.assistInt;
                    extra = extra > level.scalingParameters[1].maximum ? level.scalingParameters[1].maximum : extra;
                    add += ability.add + extra;
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
        res.auto = auto;        // Auto attack
        res.skill1 = skill1;
        res.skill2 = skill2;
        res.skill3 = skill3;
        
        return res;
    }

    ttkSkill(monster, index) {
        // Skills
        if (!this.constants.skills[index]) return;
        
        let damage = 1;
        damage = this.getDamageAgainst(monster, index);
        const hitsToKill = monster.hp / damage;

        const frames = 55;
        const hitsPerSec = (30 / frames) * (this.DCT / 100);
        
        // Cooldown only matters if we need to hit more than once
        if (hitsToKill > 1) {
            const cooldown = this.constants.skills[index].levels.slice(-1)[0].cooldown;
            if (cooldown) return (hitsToKill / hitsPerSec) + (cooldown * hitsToKill); 
        }

        return (hitsToKill / hitsPerSec)
    }

    ttkAuto(monster) {
        // Auto attack
        let damage = 1;
        damage = this.getDamageAgainst(monster);
        const hitsToKill = monster.hp / damage;

        const hitrate = this instanceof Psykeeper ? 100 : this.hitResult(monster);
        let hitsSec = this.constants.hps * this.aspd / 100;
        hitsSec *= hitrate / 100;

        return hitsToKill / hitsSec;
    }

    getDamageAgainst(opponent, index=null) {
        // TODO: Incorporate elements from skills
        var factor = 1.0;
        
        var delta = opponent.level - this.level;
        if (delta > 0) {
            const maxOver = 16;
            delta = Math.min(delta, (maxOver - 1));
            let radian = (Math.PI * delta) / (maxOver * 2.0);
            factor *= Math.cos(radian);
        }
        
        if (index === null || Object.values(this.skillsDamage).length <= index || index == -1) {
            var damage = (this.averageAA * factor) - opponent.defense;
        } else {
            var damage = (Object.values(this.skillsDamage)[index] * factor) - opponent.defense;
        }

        return damage < 1 ? 1 : damage;
    }

    averageSkillDmg() {
        let res = {}
        this.constants.skills.forEach(skill => {
            if (skill) {
                let damage = this.skillDmg(skill);
                damage *= this.damageMultiplier(skill);
                res[skill.name.en] = damage;
            }
        });

        return res;
    }

    damageMultiplier(skill=null) {
        let factor = 1.0;
        let elementalBonus = {
            fire: this.armorParam('firemastery') + this.weaponParam('firemastery') + this.buffParam('firemastery'),
            earth: this.armorParam('earthmastery') + this.weaponParam('earthmastery') + this.buffParam('earthmastery'),
            water: this.armorParam('watermastery') + this.weaponParam('watermastery') + this.buffParam('watermastery'),
            wind: this.armorParam('windmastery') + this.weaponParam('windmastery') + this.buffParam('windmastery'),
            elec: this.armorParam('electricitymastery') + this.weaponParam('electricitymastery') + this.buffParam('electricitymastery'),
        };

        // Specific skill multipliers
        if (skill) {
            switch (skill.name.en) {
                case "Spirit Bomb":
                    factor += 1.25;
                    break;
            }
        }

        // Element multipliers
        if (skill && skill.element) {
            switch (skill.element) {
                case "fire":
                    factor += (elementalBonus.fire / 100);
                    break;
                case "earth":
                    factor += (elementalBonus.earth / 100);
                    break;
                case "water":
                    factor += (elementalBonus.water / 100);
                    break;
                case "wind":
                    factor += (elementalBonus.wind / 100);
                    break;
                case "electricity":
                    factor += (elementalBonus.elec / 100);
                    break;
            }
        }

        const weaponBonus = this.weaponParam('attack') / 100;
        factor += this instanceof Blade ? weaponBonus * 2 : weaponBonus;
        factor += this.armorParam('attack') / 100;

        return factor;
    }

    skillDmg(skill) {
        const params = skill.levels.slice(-1)[0];       // Cannot use at() because of Safari compatibility
        let weaponMin = 3;
        let weaponMax = 4;

        if (this.weapon) {
            weaponMin = this.weapon.minAttack;
            weaponMax = this.weapon.maxAttack;
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

        const level = skill.levels.length;
        const base = referStat * params.scalingParameters[0].scale;
        const powerMin = ((weaponMin + (params.minAttack + 0) * 5 + base - 20) * (16 + level) / 13);
        const powerMax = ((weaponMax + (params.maxAttack + 0) * 5 + base - 20) * (16 + level) / 13);
        let final = (powerMin + powerMax) / 2;
        
        if (skill.id == 5041) { final += (((this.str / 10) * level) * (5 + this.mp / 10) + 150); }      // Asal formula
        if (this instanceof Knight) { final += final * (1.0 * (this.weapon.triggerSkillProbability / 100)); }   // Swordcross
        return final;
    }
}