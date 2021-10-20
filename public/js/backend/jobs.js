import { Utils } from "./utils.js";

export class Vagrant {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        this.weapon_img = img || "woodensword.png";
        this.armor = armor || null;
        this.weapon = weapon || Utils.get_item_by_name("Wooden Sword");
        this.assist_buffs = false;
        this.constants = constants || {
            'skills': [Utils.get_skill_by_name("Clean Hit"), 
                       Utils.get_skill_by_name("Flurry"), 
                       Utils.get_skill_by_name("Over Cutter")],
            'weapon': 'sword',  // Change this to weaponType when we have weapon integration
            'attackSpeed': 75.0,
            'hps': 4,
            'HP': 0.9,
            'MP': 0.3,
            'FP': 0.3,
            'Def': 1,
            'block': 0.2,
            'critical': 1.0,
            'sword': 4.5,
            'axe': 5.5,
            'staff': 0.8,
            'stick': 3.0,
            'knuckle': 5.0,
            'wand': 6.0,
            'yoyo': 4.2
        };
        this.skills_damage = {};

        this.str = parseInt(str);
        this.sta = parseInt(sta);
        this.int = parseInt(int);
        this.dex = parseInt(dex);
        this.level = parseInt(level);

        this.active_buffs = [];

        this.base_str = 0;
        this.base_sta = 0;
        this.base_int = 0;
        this.base_dex = 0;

        this.bonus_str = 0;
        this.bonus_sta = 0;
        this.bonus_int = 0;
        this.bonus_dex = 0;
    }

    get health() {
        let health = Math.floor(80 + this.sta * 10.0 + this.level * (this.level + 1) * 0.1125 + this.level * (this.level + 1) * this.sta * 0.00225);
        health += health * this.armor_param('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weapon_param('maxhp') / 100;
        return this.assist_buffs ? Math.floor(health * 1.15) : health;
    }

    get fp() {
        let fp = Math.floor(this.level*0.6+this.sta*2.1);
        fp += fp * this.armor_param('maxfp') / 100
        fp += fp * this.weapon_param('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*0.6+this.int*2.7);
        mp += mp * this.armor_param('maxmp') / 100
        mp += mp * this.weapon_param('maxmp') / 100
        return mp
    }

    get aspd() {
        const weapon_aspd = Utils.get_weapon_speed(this.weapon);
        let a = Math.floor(this.constants.attackSpeed + (weapon_aspd * (4.0 * this.dex + this.level / 8.0)) - 3.0);
        if (a >= 187.5) a = Math.floor(187.5);

        const index = Math.floor(Math.min(Math.max(a / 10, 0), 17));
        const arr = [
            0.08, 0.16, 0.24, 0.32, 0.40,
            0.48, 0.56, 0.64, 0.72, 0.80,
            0.88, 0.96, 1.04, 1.12, 1.20,
            1.30, 1.38, 1.50
        ];

        const plus_value = arr[index];
        let fspeed = ((50.0 / (200.0 - a)) / 2.0) + plus_value;

        fspeed = fspeed > 0.1 ? fspeed : 0.1;
        fspeed = fspeed < 2.0 ? fspeed : 2.0;

        let final = fspeed * 100 / 2;
        final = this.assist_buffs ? final + 23 : final;

        const weapon_bonus = this.weapon_param('attackspeed');
        final += this instanceof Blade ? weapon_bonus * 2 : weapon_bonus;
        final += this.armor_param('attackspeed');

        final = final > 100 ? 100 : final;
        return Math.floor(final);
    }

    get critical_chance() {
        let chance = this.dex / 10;
        chance = Math.floor(chance * this.constants.critical);
        chance = chance >= 100 ? 100 : chance;
        chance = chance < 0 ? 0 : chance;

        const weapon_bonus = this.weapon_param('criticalchance');
        chance += this instanceof Blade ? weapon_bonus * 2 : weapon_bonus;
        chance += this.armor_param('criticalchance');
        return chance > 100 ? 100 : chance;
    }

    get attack() {
        let pn_min = 3 * 2;
        let pn_max = 4 * 2;

        if (this.weapon) {
            pn_min = this.weapon.minAttack * 2;
            pn_max = this.weapon.maxAttack * 2;
        }

        let plus = this.weapon_attack();
        pn_min += plus;
        pn_max += plus;

        let final = (pn_min + pn_max) / 2;
        final *= this.damage_multiplier();
        
        return final;
    }

    get critical_damage() {
        const weapon_bonus = this.weapon_param('criticaldamage');
        const armor_bonus = this.armor_param('criticaldamage');
        return this instanceof Blade ? weapon_bonus * 2 + armor_bonus : weapon_bonus + armor_bonus;
    }

    get average_aa() {
        // TODO: Swordcross
        let pn_min = 3 * 2;
        let pn_max = 4 * 2;

        if (this.weapon) {
            pn_min = this.weapon.minAttack * 2;
            pn_max = this.weapon.maxAttack * 2;
        }
        
        const plus = this.weapon_attack();
        pn_max += plus;
        pn_min += plus;


        let avg_normal = (pn_min + pn_max) / 2;
        avg_normal *= this.damage_multiplier();
        if (this instanceof Blade) { avg_normal += (avg_normal * 0.75) / 2; }

        const crit_min_factor = 1.4 + this.critical_damage / 100;
        const crit_max_factor = 2.0 + this.critical_damage / 100;
        const crit_avg_factor = (crit_min_factor + crit_max_factor) / 2;
        const avg_crit = avg_normal * crit_avg_factor;

        const final = ((avg_crit - avg_normal) * this.critical_chance / 100) + avg_normal;
        return final < avg_normal ? avg_normal : final;   // we wont hit below our normal, non-crit hit
        // CMover::GetAtkMultiplier
    }

    get hitrate() {
        let hit = this.dex / 4;
        const weapon_bonus = this.weapon_param('hitrate');
        hit += this instanceof Blade ? weapon_bonus * 2 : weapon_bonus;
        hit += this.armor_param('hitrate');
        return this.assist_buffs ? hit + 26 : hit;
    }

    get parry() {
        return this.dex / 2;
    }

    get defense() {
        let defense = Math.floor(((((this.level * 2) + (this.sta / 2)) / 2.8) - 4) + ((this.sta - 14) * this.constants.Def));
        defense += this.armor_param('def');
        defense += this.weapon_param('def');
        return defense;
    }

    
    get remaining_points() {
        let points = this.level * 2 - 2;
        points -= (this.str + this.sta + this.dex + this.int) - 60;
        if (this.assist_buffs) {
            points += this.bonus_dex + this.bonus_int + this.bonus_sta + this.bonus_str;
        }
        return points;
    }
    
    average_skill_dmg() {
        let res = {}
        this.constants.skills.forEach(skill => {
            if (skill) {
                let damage = this.skill_dmg(skill);
                if (skill.name.en == "Spirit Bomb") console.log(damage);
                damage *= this.damage_multiplier(skill);
                if (skill.name.en == "Spirit Bomb") console.log(damage);
                res[skill.name.en] = damage;
            }
        });

        return res;
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

    apply_assist_buffs(assist_int, enabled) {
        // TODO: Finish this
        if (enabled) {
            this.active_buffs = [
                Utils.get_skill_by_name('Cannon Ball'),
                Utils.get_skill_by_name('Beef Up'),
                Utils.get_skill_by_name('Heap Up'),
                Utils.get_skill_by_name('Mental Sign'),
                Utils.get_skill_by_name('Cannon Ball'),
            ]
        }


        assist_int = assist_int > 500 ? 500 : assist_int;
        this.bonus_str = 20 + (assist_int / 25);
        this.bonus_sta = 30 + (assist_int / 25);
        this.bonus_dex = 20 + (assist_int / 25);
        this.bonus_int = 20 + (assist_int / 25);
    }

    update_stats(str, sta, int, dex, level, assist_buffs, assist_int) {
        this.apply_assist_buffs(assist_int);
        
        this.level = parseInt(level);
        this.base_str = parseInt(str);
        this.base_sta = parseInt(sta);
        this.base_int = parseInt(int);
        this.base_dex = parseInt(dex);

        if (assist_buffs && !this.assist_buffs) {
            this.str = this.base_str + this.bonus_str;
            this.sta = this.base_sta + this.bonus_sta;
            this.int = this.base_int + this.bonus_int;
            this.dex = this.base_dex + this.bonus_dex;
            this.assist_buffs = true;
        } else if (!assist_buffs && this.assist_buffs) {
            this.str = this.base_str - this.bonus_str;
            this.sta = this.base_sta - this.bonus_sta;
            this.int = this.base_int - this.bonus_int;
            this.dex = this.base_dex - this.bonus_dex;
            this.assist_buffs = false;
        } else {
            this.str = this.base_str;
            this.sta = this.base_sta;
            this.int = this.base_int;
            this.dex = this.base_dex;
        }

        this.skills_damage = this.average_skill_dmg();

        return this;
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
}


export class Assist extends Vagrant {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "overamknuckle.png";
        armor = armor || Utils.get_armor_by_name("Sayram Set");
        weapon = weapon || Utils.get_item_by_name("Paipol Knuckle");
        constants = constants || {
            'weapon': 'knuckle',
            'skills': [Utils.get_skill_by_name("Power First"), 
                       Utils.get_skill_by_name("Temping Hole"), 
                       Utils.get_skill_by_name("Burst Crack")],
            'attackSpeed': 75.0,  // Might be 70
            'HP': 1.4,
            'hps': 4,
            'MP': 1.3,
            'FP': 0.6,
            'Def': 1.2,
            'block': 0.5,
            'critical': 1.0,
            'sword': 4.5,
            'axe': 5.5,
            'staff': 0.8,
            'stick': 3.0,
            'knuckle': 5.0,
            'wand': 6.0,
            'yoyo': 4.2
        };
        super(str, sta, int, dex, level, constants, img, weapon, armor);
    }

    get health() {
        let health = Math.floor(80+this.sta*10.0+this.level*(this.level+1)*0.175+this.level*(this.level+1)*this.sta*0.0035);
        health += health * this.armor_param('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weapon_param('maxhp') / 100;
        return this.assist_buffs ? Math.floor(health * 1.15) : health;
    }

    get fp() {
        let fp = Math.floor(this.level*1.2+this.sta*4.2);
        fp += fp * this.armor_param('maxfp') / 100
        fp += fp * this.weapon_param('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*2.6+this.int*11.7);
        mp += mp * this.armor_param('maxmp') / 100
        mp += mp * this.weapon_param('maxmp') / 100
        return mp
    }
}

export class Billposter extends Assist {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "bloodyknuckle.png";
        armor = armor || Utils.get_armor_by_name("Rody Set");
        weapon = weapon || Utils.get_item_by_name("Legendary Golden Gloves");
        constants = constants || {
            'weapon': 'knuckle',
            'skills': [Utils.get_skill_by_name("Bgvur Tialbold"), 
                       Utils.get_skill_by_name("Blood Fist"), 
                       Utils.get_skill_by_name("Asalraalaikum")],
            'attackSpeed': 85.0,
            'hps': 4,
            'HP': 1.8,
            'MP': 0.9,
            'FP': 1.1,
            'Def': 1.7,
            'block': 0.7,
            'critical': 1.0,
            'sword': 4.5,
            'axe': 5.5,
            'staff': 0.8,
            'stick': 3.0,
            'knuckle': 5.0,
            'wand': 6.0,
            'yoyo': 4.2
        };
        super(str, sta, int, dex, level, constants, img, weapon, armor);
    }

    get health() {
        let health = Math.floor(80+this.sta*10.0+this.level*(this.level+1)*0.225+this.level*(this.level+1)*this.sta*0.0045);
        health += health * this.armor_param('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weapon_param('maxhp') / 100;
        return this.assist_buffs ? Math.floor(health * 1.15) : health;
    }

    get fp() {
        let fp = Math.floor(this.level*2.2+this.sta*7.7);
        fp += fp * this.armor_param('maxfp') / 100
        fp += fp * this.weapon_param('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*1.8+this.int*8.1);
        mp += mp * this.armor_param('maxmp') / 100
        mp += mp * this.weapon_param('maxmp') / 100
        return mp
    }
}

export class Ringmaster extends Assist {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "lgstick.png";
        armor = armor || Utils.get_armor_by_name("Rimyth Set");
        weapon = weapon || Utils.get_item_by_name("Legendary Golden Stick");
        constants = constants || {
            'weapon': 'stick',
            'skills': [Utils.get_skill_by_name('Merkaba Hanzelrusha')],
            'attackSpeed': 75.0,
            'hps': 3,
            'HP': 1.6,
            'MP': 1.8,
            'FP': 0.4,
            'Def': 1.2,
            'block': 0.6,
            'critical': 1.0,
            'sword': 4.5,
            'axe': 5.5,
            'staff': 0.8,
            'stick': 3.0,
            'knuckle': 5.0,
            'wand': 6.0,
            'yoyo': 4.2
        };
        super(str, sta, int, dex, level, constants, img, weapon, armor);
    }

    get health() {
        let health = Math.floor(80+this.sta*10.0+this.level*(this.level+1)*0.2+this.level*(this.level+1)*this.sta*0.004);
        health += health * this.armor_param('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weapon_param('maxhp') / 100;
        return this.assist_buffs ? Math.floor(health * 1.15) : health;
    }

    get fp() {
        let fp = Math.floor(this.level*0.8+this.sta*2.8);
        fp += fp * this.armor_param('maxfp') / 100
        fp += fp * this.weapon_param('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*3.6+this.int*16.2);
        mp += mp * this.armor_param('maxmp') / 100
        mp += mp * this.weapon_param('maxmp') / 100
        return mp
    }
}

export class Acrobat extends Vagrant {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "layeredbow.png";
        armor = armor || Utils.get_armor_by_name("Cruiser Set");
        weapon = weapon || Utils.get_item_by_name("Layered Bow");
        constants = constants || {
            'weapon': 'bow',
            'skills': [Utils.get_skill_by_name("Junk Arrow"), 
                       Utils.get_skill_by_name("Silent Shot"), 
                       Utils.get_skill_by_name("Arrow Rain")],
            'attackSpeed': 80.0,
            'hps': 2,
            'HP': 1.4,
            'MP': 0.5,
            'FP': 0.5,
            'Def': 1.4,
            'block': 0.5,
            'critical': 1.0,
            'sword': 4.5,
            'axe': 5.5,
            'staff': 0.8,
            'stick': 3.0,
            'knuckle': 5.0,
            'wand': 6.0,
            'bow': 3.6,
            'yoyo': 4.2
        };
        super(str, sta, int, dex, level, constants, img, weapon, armor);
    }

    get health() {
        let health = Math.floor(80+this.sta*10.0+this.level*(this.level+1)*0.175+this.level*(this.level+1)*this.sta*0.0035);
        health += health * this.armor_param('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weapon_param('maxhp') / 100;
        return this.assist_buffs ? Math.floor(health * 1.15) : health;
    }

    get fp() {
        let fp = Math.floor(this.level*1+this.sta*3.5);
        fp += fp * this.armor_param('maxfp') / 100
        fp += fp * this.weapon_param('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*1+this.int*4.5);
        mp += mp * this.armor_param('maxmp') / 100
        mp += mp * this.weapon_param('maxmp') / 100
        return mp
    }
}

export class Jester extends Acrobat {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "lgyoyo.png";
        armor = armor || Utils.get_armor_by_name("Neis Set");
        weapon = weapon || Utils.get_item_by_name("Legendary Golden Yo-Yo");
        constants = constants || {
            'weapon': 'yoyo',
            'skills': [Utils.get_skill_by_name("Sneak Stab"), 
                       Utils.get_skill_by_name("Vital Stab"), 
                       Utils.get_skill_by_name("Hit of Penya")],
            'attackSpeed': 85.0,
            'hps': 2,
            'HP': 1.5,
            'MP': 0.5,
            'FP': 1.0,
            'Def': 1.5,
            'block': 0.8,
            'critical': 4.0,
            'sword': 4.5,
            'axe': 5.5,
            'staff': 0.8,
            'stick': 3.0,
            'knuckle': 5.0,
            'wand': 6.0,
            'yoyo': 4.6,
            'bow': 3.6
        };
        super(str, sta, int, dex, level, constants, img, weapon, armor);
    }

    get health() {
        let health = Math.floor(80+this.sta*10.0+this.level*(this.level+1)*0.1875+this.level*(this.level+1)*this.sta*0.00375);
        health += health * this.armor_param('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weapon_param('maxhp') / 100;
        return this.assist_buffs ? Math.floor(health * 1.15) : health;
    }

    get fp() {
        let fp = Math.floor(this.level*2+this.sta*7);
        fp += fp * this.armor_param('maxfp') / 100
        fp += fp * this.weapon_param('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*1+this.int*4.5);
        mp += mp * this.armor_param('maxmp') / 100
        mp += mp * this.weapon_param('maxmp') / 100
        return mp
    }
}

export class Ranger extends Acrobat {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "lgbow.png";
        armor = armor || Utils.get_armor_by_name("Tyrent Set");
        weapon = weapon || Utils.get_item_by_name("Legendary Golden Bow");
        constants = constants || {
            'weapon': 'bow',
            'skills': [Utils.get_skill_by_name("Ice Arrow"), 
                       Utils.get_skill_by_name("Flame Arrow"), 
                       Utils.get_skill_by_name("Silent Arrow")],
            'attackSpeed': 80.0,
            'hps': 2,
            'HP': 1.6,
            'MP': 1.2,
            'FP': 0.6,
            'Def': 1.6,
            'block': 0.9,
            'critical': 2.0,
            'sword': 4.5,
            'axe': 5.5,
            'staff': 0.8,
            'stick': 3.0,
            'knuckle': 5.0,
            'wand': 6.0,
            'yoyo': 3.6,
            'bow': 4.4
        };
        super(str, sta, int, dex, level, constants, img, weapon, armor);
    }

    get health() {
        let health = Math.floor(80+this.sta*10.0+this.level*(this.level+1)*0.2+this.level*(this.level+1)*this.sta*0.004);
        health += health * this.armor_param('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weapon_param('maxhp') / 100;
        return this.assist_buffs ? Math.floor(health * 1.15) : health;
    }

    get fp() {
        let fp = Math.floor(this.level*1.2+this.sta*4.2);
        fp += fp * this.armor_param('maxfp') / 100
        fp += fp * this.weapon_param('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*2.4+this.int*10.8);
        mp += mp * this.armor_param('maxmp') / 100
        mp += mp * this.weapon_param('maxmp') / 100
        return mp
    }
}

export class Magician extends Vagrant {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "opelwand.png";
        armor = armor || Utils.get_armor_by_name("Teba Set");
        weapon = weapon || Utils.get_item_by_name("Opel Wand");
        constants = constants || {
            'weapon': 'wand',
            'skills': [Utils.get_skill_by_name("Mental Strike"), 
                       Utils.get_skill_by_name("Rock Crash"), 
                       Utils.get_skill_by_name("Water Well")],
            'attackSpeed': 65.0,
            'hps': 1,
            'HP': 1.4,
            'MP': 1.7,
            'FP': 0.3,
            'Def': 1.2,
            'block': 0.5,
            'critical': 1.0,
            'sword': 4.5,
            'axe': 5.5,
            'staff': 0.8,
            'stick': 3.0,
            'knuckle': 5.0,
            'wand': 6.0,
            'yoyo': 4.2
        };
        super(str, sta, int, dex, level, constants, img, weapon, armor);
    }

    get health() {
        let health = Math.floor(80+this.sta*10.0+this.level*(this.level+1)*0.175+this.level*(this.level+1)*this.sta*0.0035);
        health += health * this.armor_param('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weapon_param('maxhp') / 100;
        return this.assist_buffs ? Math.floor(health * 1.15) : health;
    }

    get fp() {
        let fp = Math.floor(this.level*0.6+this.sta*2.1);
        fp += fp * this.armor_param('maxfp') / 100
        fp += fp * this.weapon_param('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*3.4+this.int*15.3);
        mp += mp * this.armor_param('maxmp') / 100
        mp += mp * this.weapon_param('maxmp') / 100
        return mp
    }
}

export class Psykeeper extends Magician {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "lgwand.png";
        armor = armor || Utils.get_armor_by_name("Mekatro Set");
        weapon = weapon || Utils.get_item_by_name("Legendary Golden Wand");
        constants = constants || {
            'weapon': 'wand',
            'skills': [Utils.get_skill_by_name("Demonology"), 
                       Utils.get_skill_by_name("Spirit Bomb"), 
                       Utils.get_skill_by_name("Psychic Square")],
            'attackSpeed': 70.0,
            'hps': 1,
            'HP': 1.5,
            'MP': 2.0,
            'FP': 0.4,
            'Def': 1.2,
            'block': 0.3,
            'critical': 1.0,
            'sword': 4.5,
            'axe': 5.5,
            'staff': 0.8,
            'stick': 3.0,
            'knuckle': 5.0,
            'wand': 6.0,
            'yoyo': 4.2
        };
        super(str, sta, int, dex, level, constants, img, weapon, armor);
    }

    get health() {
        let health = Math.floor(80+this.sta*10.0+this.level*(this.level+1)*0.1875+this.level*(this.level+1)*this.sta*0.00375);
        health += health * this.armor_param('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weapon_param('maxhp') / 100;
        return this.assist_buffs ? Math.floor(health * 1.15) : health;
    }

    get fp() {
        let fp = Math.floor(this.level*0.8+this.sta*2.8);
        fp += fp * this.armor_param('maxfp') / 100
        fp += fp * this.weapon_param('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*4+this.int*18);
        mp += mp * this.armor_param('maxmp') / 100
        mp += mp * this.weapon_param('maxmp') / 100
        return mp
    }
}

export class Elementor extends Magician {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "lgstaff.png";
        armor = armor || Utils.get_armor_by_name("Shabel Set");
        weapon = weapon || Utils.get_item_by_name("Legendary Golden Staff");
        constants = constants || {
            'weapon': 'staff',
            'skills': [Utils.get_skill_by_name("Firebird"), 
                       Utils.get_skill_by_name("Windfield"), 
                       Utils.get_skill_by_name("Iceshark")],
            'attackSpeed': 70.0,
            'hps': 1,
            'HP': 1.5,
            'MP': 2.0,
            'FP': 0.4,
            'Def': 1.2,
            'block': 0.3,
            'critical': 1.0,
            'sword': 4.5,
            'axe': 5.5,
            'staff': 0.8,
            'stick': 3.0,
            'knuckle': 5.0,
            'wand': 6.0,
            'yoyo': 4.2
        };
        super(str, sta, int, dex, level, constants, img, weapon, armor);
    }

    get health() {
        let health = Math.floor(80+this.sta*10.0+this.level*(this.level+1)*0.1875+this.level*(this.level+1)*this.sta*0.00375);
        health += health * this.armor_param('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weapon_param('maxhp') / 100;
        return this.assist_buffs ? Math.floor(health * 1.15) : health;
    }

    get fp() {
        let fp = Math.floor(this.level*0.8+this.sta*2.8);
        fp += fp * this.armor_param('maxfp') / 100
        fp += fp * this.weapon_param('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*4+this.int*18);
        mp += mp * this.armor_param('maxmp') / 100
        mp += mp * this.weapon_param('maxmp') / 100
        return mp
    }
}

export class Mercenary extends Vagrant {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "woodensword.png";
        armor = armor || Utils.get_armor_by_name("Panggril Set");
        weapon = weapon || Utils.get_item_by_name("Flam Sword");
        constants = constants || {
            'weapon': 'sword',
            'skills': [Utils.get_skill_by_name("Shield Bash"), 
                       Utils.get_skill_by_name("Keenwheel"), 
                       Utils.get_skill_by_name("Guillotine")],
            'attackSpeed': 80.0,
            'hps': 4,
            'HP': 1.5,
            'MP': 0.5,
            'FP': 0.7,
            'Def': 1.35,
            'block': 0.8,
            'critical': 1.0,
            'sword': 4.5,
            'axe': 5.5,
            'staff': 0.8,
            'stick': 3.0,
            'knuckle': 5.0,
            'wand': 6.0,
            'yoyo': 4.2
        };
        super(str, sta, int, dex, level, constants, img, weapon, armor);
    }

    get health() {
        let health = Math.floor(80+this.sta*10.0+this.level*(this.level+1)*0.1875+this.level*(this.level+1)*this.sta*0.00375);
        health += health * this.armor_param('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weapon_param('maxhp') / 100;
        return this.assist_buffs ? Math.floor(health * 1.15) : health;
    }

    get fp() {
        let fp = Math.floor(this.level*1.4+this.sta*4.9);
        fp += fp * this.armor_param('maxfp') / 100
        fp += fp * this.weapon_param('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*1+this.int*4.5);
        mp += mp * this.armor_param('maxmp') / 100
        mp += mp * this.weapon_param('maxmp') / 100
        return mp
    }
}

export class Blade extends Mercenary {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "lgaxe.png";
        armor = armor || Utils.get_armor_by_name("Hanes Set");
        weapon = weapon || Utils.get_item_by_name("Legendary Golden Axe");
        constants = constants || {
            'weapon': 'axe',
            'skills': [Utils.get_skill_by_name("Blade Dance"), 
                       Utils.get_skill_by_name("Hawk Attack"), 
                       Utils.get_skill_by_name("Cross Strike")],
            'attackSpeed': 90.0,
            'hps': 3,
            'HP': 1.5,
            'MP': 0.6,
            'FP': 1.2,
            'Def': 1.5,
            'block': 1.4,
            'critical': 1.0,
            'sword': 4.5,
            'axe': 5.5,
            'staff': 0.8,
            'stick': 3.0,
            'knuckle': 5.0,
            'wand': 6.0,
            'yoyo': 4.2
        };
        super(str, sta, int, dex, level, constants, img, weapon, armor);
    }

    get health() {
        let health = Math.floor(80+this.sta*10.0+this.level*(this.level+1)*0.1875+this.level*(this.level+1)*this.sta*0.00375);
        health += health * this.armor_param('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weapon_param('maxhp') / 100;
        return this.assist_buffs ? Math.floor(health * 1.15) : health;
    }

    get fp() {
        let fp = Math.floor(this.level*2.4+this.sta*8.400001);
        fp += fp * this.armor_param('maxfp') / 100
        fp += fp * this.weapon_param('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*1.2+this.int*5.4);
        mp += mp * this.armor_param('maxmp') / 100
        mp += mp * this.weapon_param('maxmp') / 100
        return mp
    }
}

export class Knight extends Mercenary {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "lgswt.png";
        armor = armor || Utils.get_armor_by_name("Extro Set");
        weapon = weapon || Utils.get_item_by_name("Legendary Golden Big Sword");
        constants = constants || {
            'weapon': 'axe',
            'skills': [Utils.get_skill_by_name("Pain Dealer"), 
                       Utils.get_skill_by_name("Power Stomp"), 
                       Utils.get_skill_by_name("Earth Divider")],
            'attackSpeed': 65.0,
            'hps': 2,
            'HP': 2.0,
            'MP': 0.6,
            'FP': 1.5,
            'Def': 1.8,
            'block': 1.0,
            'critical': 1.0,
            'sword': 4.5,
            'axe': 5.5,
            'staff': 0.8,
            'stick': 3.0,
            'knuckle': 5.0,
            'wand': 6.0,
            'yoyo': 4.2
        };
        super(str, sta, int, dex, level, constants, img, weapon, armor);
    }

    get health() {
        let health = Math.floor(80+this.sta*10.0+this.level*(this.level+1)*0.25+this.level*(this.level+1)*this.sta*0.005);
        health += health * this.armor_param('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weapon_param('maxhp') / 100;
        return this.assist_buffs ? Math.floor(health * 1.15) : health;
    }

    get fp() {
        let fp = Math.floor(this.level*3+this.sta*10.5);
        fp += fp * this.armor_param('maxfp') / 100
        fp += fp * this.weapon_param('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*1.2+this.int*5.4);
        mp += mp * this.armor_param('maxmp') / 100
        mp += mp * this.weapon_param('maxmp') / 100
        return mp
    }
}