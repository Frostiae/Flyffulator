import { Vagrant, Assist, Billposter, Ringmaster, Acrobat, Jester, Ranger, Magician, Psykeeper, Elementor, Mercenary, Blade, Knight } from "./jobs.js";
import { Utils } from "./utils.js";
/**
 * The mover class is the base of all characters. Acts as a helper class for a lot of functions.
 */
export class Mover {
    update_stats(str, sta, int, dex, level, assist_buffs, assist_int) {
        this.level = parseInt(level);
        this.str = parseInt(str);
        this.sta = parseInt(sta);
        this.int = parseInt(int);
        this.dex = parseInt(dex);
        this.assist_int = assist_int;
        
        this.apply_assist_buffs(assist_buffs);
        this.skills_damage = this.average_skill_dmg();

        return this;
    }

    apply_assist_buffs(enabled) {
        // TODO: Finish this
        if (enabled && !this.assist_buffs) {                // Add buffs
            this.active_buffs = [
                Utils.get_skill_by_name('Cannon Ball'),
                Utils.get_skill_by_name('Beef Up'),
                Utils.get_skill_by_name('Heap Up'),
                Utils.get_skill_by_name('Mental Sign'),
                Utils.get_skill_by_name('Patience'),
                Utils.get_skill_by_name('Haste'),
                Utils.get_skill_by_name('Cat\'s Reflex'),
                Utils.get_skill_by_name('Accuracy')
            ];

            this.str += this.buff_param('str', this.assist_int);
            this.sta += this.buff_param('sta', this.assist_int);
            this.int += this.buff_param('int', this.assist_int);
            this.dex += this.buff_param('dex', this.assist_int);
            this.assist_buffs = true;
        } else if (!enabled && this.assist_buffs) {         // Remove buffs
            this.assist_buffs = false;
            this.str -= this.buff_param('str', this.assist_int);
            this.sta -= this.buff_param('sta', this.assist_int);
            this.int -= this.buff_param('int', this.assist_int);
            this.dex -= this.buff_param('dex', this.assist_int);

            this.active_buffs = [];
        }
    }

    get remaining_points() {
        let points = this.level * 2 - 2;
        points -= (this.str + this.sta + this.dex + this.int) - 60;     // Don't count the base 15
        if (this.assist_buffs && this.active_buffs.length) {
            points += this.buff_param('dex', this.assist_int) + 
                      this.buff_param('sta', this.assist_int) + 
                      this.buff_param('str', this.assist_int) + 
                      this.buff_param('int', this.assist_int);
        }
        return points;
    }

    weapon_attack() {
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

    armor_param(param) {
        var add = 0;
        if (this.armor && this.armor.bonus) {
            this.armor.bonus.forEach(bonus => {
                if (bonus.ability.parameter == param)
                    add = bonus.ability.add;
            });
        }
        return add;
    }

    weapon_param(param) {
        var add = 0;
        if (this.weapon && this.weapon.abilities) {
            this.weapon.abilities.forEach(bonus => {
                if (bonus.parameter == param) {
                    add = bonus.add;
                }
            });
        }
        return add;
    }

    buff_param(param) {
        var add = 0;
        this.active_buffs.forEach(buff => {
            let level = buff.levels.slice(-1)[0];
            let abilities = level.abilities;
            abilities.forEach(ability => {
                if (ability.parameter == param) {
                    let extra = level.scalingParameters[1].scale * this.assist_int;
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
    hit_result(monster) {
        // CMover::GetAttackResult
        let hit_rate = Math.floor(((this.dex * 1.6) / (this.dex + monster.parry)) * 1.5 *
            (this.level * 1.2 / (this.level + monster.level)) * 100.0);

        hit_rate += this.hitrate;
        hit_rate = hit_rate > 100 ? 100 : hit_rate;
        hit_rate = hit_rate < 20 ? 20 : hit_rate;

        return hit_rate;
    }

    /**
     * @param monster   The monster to find the time to kill for.
     * @returns         The time to kill the monster using auto attacks.
     */
    ttk_monster(monster) {
        if (!monster) return 0;
        let res = {};
        const auto = this.ttk_auto(monster);
        res.auto = auto;    // Auto attack
        
        return res;
    }


    ttk_auto(monster) {
        // Auto attack
        let damage = 1;
        damage = this.get_damage_against(monster);
        const hits_to_kill = monster.hp / damage;

        const hitrate = this instanceof Psykeeper ? 100 : this.hit_result(monster);
        let hits_sec = this.constants.hps * this.aspd / 100;
        hits_sec *= hitrate / 100;

        return hits_to_kill / hits_sec;
    }

    get_damage_against(opponent, index=null) {
        // TODO: Incorporate elements from skills
        var factor = 1.0;
        if (index && this.constants.skills[index].name.en == "Spirit Bomb") factor = 1.5;
        
        var delta = opponent.level - this.level;
        if (delta > 0) {
            let max_over = 16;
            delta = Math.min(delta, (max_over - 1));
            let radian = (Math.PI * delta) / (max_over * 2.0);
            factor *= Math.cos(radian);
        }
        
        if (index === null || Object.values(this.skills_damage).length <= index) {
            var damage = (this.average_aa * factor) - opponent.defense;
        } else {
            var damage = (Object.values(this.skills_damage)[index] * factor) - opponent.defense;
        }

        return damage < 1 ? 1 : damage;
    }

    average_skill_dmg() {
        let res = {}
        this.constants.skills.forEach(skill => {
            if (skill) {
                let damage = this.skill_dmg(skill);
                damage *= this.damage_multiplier(skill);
                res[skill.name.en] = damage;
            }
        });

        return res;
    }

    damage_multiplier(skill=null) {
        let factor = 1.0;

        if (skill) {
            switch (skill.name.en) {
                case "Spirit Bomb":
                    factor = 1.5;
                    break;
            }
        }

        const weapon_bonus = this.weapon_param('attack') / 100;
        factor += this instanceof Blade ? weapon_bonus * 2 : weapon_bonus;
        factor += this.armor_param('attack') / 100;

        return factor;
    }

    skill_dmg(skill) {
        const params = skill.levels.slice(-1)[0];       // Cannot use at() because of Safari compatibility
        let weapon_min = 3;
        let weapon_max = 4;

        if (this.weapon) {
            weapon_min = this.weapon.minAttack;
            weapon_max = this.weapon.maxAttack;
        }

        const stat = params.scalingParameters[0].stat;
        var refer_stat = this.str;
        switch (stat) {
            case 'sta':
                refer_stat = this.sta;
                break;
            case 'dex':
                refer_stat = this.dex;
                break;
            case 'int':
                refer_stat = this.int;
                break;
            default:
                refer_stat = this.str;
        }

        const level = skill.levels.length;
        const base = refer_stat * params.scalingParameters[0].scale;
        const power_min = ((weapon_min + (params.minAttack + 0) * 5 + base - 20) * (16 + level) / 13);
        const power_max = ((weapon_max + (params.maxAttack + 0) * 5 + base - 20) * (16 + level) / 13);
        let final = (power_min + power_max) / 2;
        
        // Maybe add a defines file and avoid string comparison
        if (skill.name.en == "Asalraalaikum") { final += (((this.str / 10) * level) * (5 + this.mp / 10) + 150); }
        return final;
    }
}