import { Utils } from "./utils.js";

export class Vagrant {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        this.weapon_img = img || "woodensword.png";
        this.armor = armor || null;
        this.weapon = weapon || Utils.get_item_by_name("Wooden Sword");
        this.assist_buffs = false;
        this.constants = constants || {
            'skills': ["Clean Hit", "Flurry", "Over Cutter"],
            'weapon': 'sword',  // Change this to weaponType when we have weapon integration
            'attackSpeed': 75.0,
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

        this.str = parseInt(str);
        this.sta = parseInt(sta);
        this.int = parseInt(int);
        this.dex = parseInt(dex);
        this.level = parseInt(level);
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
        final += this.armor_param('attackspeed');
        final += this.weapon_param('attackspeed');
        return Math.floor(final);
    }

    get critical_chance() {
        let chance = this.dex / 10;
        chance = Math.floor(chance * this.constants.critical);
        chance = chance >= 100 ? 100 : chance;
        chance = chance < 0 ? 0 : chance;
        chance += this.weapon_param('criticalchance');
        chance += this.armor_param('criticalchance');
        return chance;
    }

    get attack() {
        var pn_min = 3 * 2;
        var pn_max = 4 * 2;

        if (this.weapon) {
            pn_min = this.weapon.minAttack * 2;
            pn_max = this.weapon.maxAttack * 2;
        }

        let plus = this.weapon_attack();
        pn_max += plus;
        pn_max += plus;

        let final = (pn_min + pn_max) / 2;
        final *= this.damage_multiplier()
        
        return final;
    }

    get average_aa() {
        // TODO: This is too inaccurate sometimes, check with wooden sword level 15 no stats
        // TODO: Blade offhand behaviour
        // TODO: Swordcross
        var pn_min = 3 * 2;
        var pn_max = 4 * 2;

        if (this.weapon) {
            pn_min = this.weapon.minAttack * 2;
            pn_max = this.weapon.maxAttack * 2;
        }
        
        const plus = this.weapon_attack();
        pn_max += plus;
        pn_min += plus;

        let crit_min_factor = 1.4 + (this.weapon_param('criticaldamage') / 100) + (this.armor_param('criticaldamage') / 100);
        let crit_max_factor = 2.0 + (this.weapon_param('criticaldamage') / 100) + (this.armor_param('criticaldamage') / 100);
        
        // This is probably an incorrect formula. I am trying to get the 
        // average daamge while also taking critical chance into account.
        // project M values for critical multipliers might be different.
        pn_min += pn_min * ((this.critical_chance / 100) * crit_min_factor);
        pn_max += pn_max * ((this.critical_chance / 100) * crit_max_factor);

        let final = (pn_min + pn_max) / 2;
        final *= this.damage_multiplier();


        return final;
        // CMover::GetAtkMultiplier
    }

    get hitrate() {
        let hit = this.dex / 4;
        hit += this.armor_param('hitrate');
        hit += this.weapon_param('hitrate');
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

    get average_skill_dmg() {
        let res = {}
        this.constants.skills.forEach(skill => {
            let info = Utils.get_skill_by_name(skill);
            if (info) {
                let damage = this.skill_dmg(info);
                damage *= this.damage_multiplier(info);
                res[info.name.en] = damage;
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

        factor += this.weapon_param('attack') / 100;
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
            case 'bow': // Pretty sure this is incorrect for project M
                return Math.floor(((this.dex - 14) * (this.constants[weapon] + 0.2) + (this.level * 1.3) * 0.7));
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

    update_stats(str, sta, int, dex, level, assist_buffs) {
        this.str = parseInt(str);
        this.sta = parseInt(sta);
        this.int = parseInt(int);
        this.dex = parseInt(dex);
        this.level = parseInt(level);
        
        if (assist_buffs && !this.assist_buffs) {
            this.assist_buffs = true;
            this.str += 20;
            this.sta += 30;
            this.dex += 20;
            this.int += 20;
        } else if (!assist_buffs && this.assist_buffs) {
            this.assist_buffs = false;
            this.str -= 20;
            this.sta -= 30;
            this.dex -= 20;
            this.int -= 20;
        }

        return this;
    }

    get_damage_against(opponent, index=null) {
        // TODO: Incorporate elements from skills
        var factor = 1.0;
        var delta = opponent.level - this.level;

        if (delta > 0) {
            let max_over = 16;
            delta = Math.min(delta, (max_over - 1));
            let radian = (Math.PI * delta) / (max_over * 2.0);
            factor *= Math.cos(radian);
        }

        if (index === null || Object.values(this.average_skill_dmg).length <= index) {
            var damage = (this.average_aa * factor) - opponent.defense;
        } else {
            // * factor?
            var damage = (Object.values(this.average_skill_dmg)[index] * factor) - opponent.defense;
        }

        return damage < 1 ? 1 : damage;
    }
}


export class Assist extends Vagrant {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "overamknuckle.png";
        armor = armor || Utils.get_armor_by_name("Wedge Set");
        weapon = weapon || Utils.get_item_by_name("Paipol Knuckle");
        constants = constants || {
            'weapon': 'knuckle',
            'skills': ['Power Fist', 'Temping Hole', 'Burst Crack'],
            'attackSpeed': 75.0,  // Might be 70
            'HP': 1.4,
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
            'skills': ['Bgvur Tialbold', 'Blood Fist', 'Asalraalaikum'],
            'attackSpeed': 85.0,
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
            'skills': ['Merkaba Hanzelrusha'],
            'attackSpeed': 75.0,
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
            'skills': ['Junk Arrow', 'Silent Shot', 'Arrow Rain'],
            'attackSpeed': 80.0,
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
            'skills': ['Sneak Stab', 'Vital Stab', 'Hit of Penya'],
            'attackSpeed': 85.0,
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
            'skills': ['Ice Arrow', 'Flame Arrow', 'Silent Arrow'],
            'attackSpeed': 80.0,
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
            'skills': ['Mental Strike', 'Rock Crash', 'Water Well'],
            'attackSpeed': 65.0,
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
            'skills': ['Demonology', 'Spirit Bomb', 'Psychic Square'],
            'attackSpeed': 70.0,
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
            'skills': ['Firebird', 'Windfield', 'Iceshark'],
            'attackSpeed': 70.0,
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
            'skills': ['Shield Bash', 'Keenwheel', 'Guillotine'],
            'attackSpeed': 80.0,
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
            'weapon': 'sword',
            'skills': ['Blade Dance', 'Hawk Attack', 'Cross Strike'],
            'attackSpeed': 90.0,
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
            'skills': ['Pain Dealer', 'Power Stomp', 'Earth Divider'],
            'attackSpeed': 65.0,
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