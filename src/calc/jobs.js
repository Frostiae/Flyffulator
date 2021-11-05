/* eslint-disable */
import { Mover } from "./jobhelper.js";
import { Utils } from "./utils.js";

export class Vagrant extends Mover {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        super();
        this.weapon_img = img || "woodensword.png";
        this.armor = armor || null;
        this.weapon = weapon || Utils.getItemByName("Wooden Sword");
        this.assistBuffs = false;
        this.constants = constants || {
            'skills': [Utils.getSkillByName("Clean Hit"), 
                       Utils.getSkillByName("Flurry"), 
                       Utils.getSkillByName("Over Cutter")],
            'weapon': 'sword',
            'attackSpeed': 75.0,
            'hps': 4,           // TODO: change these to frames instead and calculate hits/sec using them for more accuracy
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
        this.skillsDamage = {};

        this.str = parseInt(str);
        this.sta = parseInt(sta);
        this.int = parseInt(int);
        this.dex = parseInt(dex);
        this.level = parseInt(level);

        this.activeBuffs = [];
        this.assistInt = 300;  // How much int the assist buffing you has
    }

    get health() {
        let health = Math.floor(80 + this.sta * 10.0 + this.level * (this.level + 1) * 0.1125 + this.level * (this.level + 1) * this.sta * 0.00225);
        health += health * this.armorParam('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weaponParam('maxhp') / 100;
        health += health * this.buffParam('maxhp') / 100;
        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level*0.6+this.sta*2.1);
        fp += fp * this.armorParam('maxfp') / 100
        fp += fp * this.weaponParam('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*0.6+this.int*2.7);
        mp += mp * this.armorParam('maxmp') / 100
        mp += mp * this.weaponParam('maxmp') / 100
        return mp
    }

    get aspd() {
        const weaponAspd = Utils.getWeaponSpeed(this.weapon);
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

        const weaponBonus = this.weaponParam('attackspeed');
        final += this instanceof Blade ? weaponBonus * 2 : weaponBonus;
        final += this.armorParam('attackspeed');
        final += this.buffParam('attackspeed');

        final = final > 100 ? 100 : final;
        return Math.floor(final);
    }

    get criticalChance() {
        let chance = this.dex / 10;
        chance = Math.floor(chance * this.constants.critical);
        chance = chance >= 100 ? 100 : chance;
        chance = chance < 0 ? 0 : chance;

        const weaponBonus = this.weaponParam('criticalchance');
        chance += this instanceof Blade ? weaponBonus * 2 : weaponBonus;
        chance += this.armorParam('criticalchance');
        chance += this.buffParam('criticalchance');
        return chance > 100 ? 100 : chance;
    }

    get DCT() {
        let dct = 100;  // Starts out as 100%
        dct += this.armorParam('decreasedcastingtime');
        dct += this.weaponParam('decreasedcastingtime');
        return dct;
    }

    get attack() {
        let pnMin = 3 * 2;
        let pnMax = 4 * 2;

        if (this.weapon) {
            pnMin = this.weapon.minAttack * 2;
            pnMax = this.weapon.maxAttack * 2;
        }

        let plus = this.weaponAttack();
        pnMin += plus;
        pnMax += plus;

        let final = (pnMin + pnMax) / 2;
        final *= this.damageMultiplier();

        // Gear and buff params
        
        return final;
    }

    get criticalDamage() {
        const weaponBonus = this.weaponParam('criticaldamage');
        const armorBonus = this.armorParam('criticaldamage');
        return this instanceof Blade ? weaponBonus * 2 + armorBonus : weaponBonus + armorBonus;
    }

    get averageAA() {
        // TODO: Swordcross
        let pnMin = 3 * 2;
        let pnMax = 4 * 2;

        if (this.weapon) {
            pnMin = this.weapon.minAttack * 2;
            pnMax = this.weapon.maxAttack * 2;
        }
        
        const plus = this.weaponAttack();
        pnMax += plus;
        pnMin += plus;


        let avgNormal = (pnMin + pnMax) / 2;
        avgNormal *= this.damageMultiplier();
        
        // Blade offhand calculation
        if (this instanceof Blade) { avgNormal += (avgNormal * 0.75) / 2; }

        const critMinFactor = 1.4 + this.criticalDamage / 100;
        const critMaxFactor = 2.0 + this.criticalDamage / 100;
        const critAvgFactor = (critMinFactor + critMaxFactor) / 2;
        const avgCrit = avgNormal * critAvgFactor;
        
        let final = ((avgCrit - avgNormal) * this.criticalChance / 100) + avgNormal;

        // Knight Swordcross calculation
        if (this instanceof Knight && this.weapon) {
            const swordcrossFactor = 1.0;   // 100% extra damage
            const swordcrossChance = this.weapon.triggerSkillProbability / 100;
            final += final * (swordcrossFactor * swordcrossChance);
        }

        return final < avgNormal ? avgNormal : final;   // we wont hit below our normal, non-crit hit
        // CMover::GetAtkMultiplier
    }

    get hitrate() {
        let hit = this.dex / 4;
        const weaponBonus = this.weaponParam('hitrate');
        hit += this instanceof Blade ? weaponBonus * 2 : weaponBonus;
        hit += this.armorParam('hitrate');
        hit += this.buffParam('hitrate');
        return hit;
    }

    get parry() {
        return this.dex / 2;
    }

    get defense() {
        let defense = Math.floor(((((this.level * 2) + (this.sta / 2)) / 2.8) - 4) + ((this.sta - 14) * this.constants.Def));
        defense += this.armorParam('def');
        defense += this.weaponParam('def');
        defense += this.buffParam('def');
        return defense;
    }
}


export class Assist extends Vagrant {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "overamknuckle.png";
        armor = armor || Utils.getArmorByName("Sayram Set");
        weapon = weapon || Utils.getItemByName("Paipol Knuckle");
        constants = constants || {
            'weapon': 'knuckle',
            'skills': [Utils.getSkillByName("Power Fist"), 
                       Utils.getSkillByName("Temping Hole"), 
                       Utils.getSkillByName("Burst Crack")],
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
        health += health * this.armorParam('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weaponParam('maxhp') / 100;
        health += health * this.buffParam('maxhp') / 100;
        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level*1.2+this.sta*4.2);
        fp += fp * this.armorParam('maxfp') / 100
        fp += fp * this.weaponParam('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*2.6+this.int*11.7);
        mp += mp * this.armorParam('maxmp') / 100
        mp += mp * this.weaponParam('maxmp') / 100
        return mp
    }
}

export class Billposter extends Assist {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "bloodyknuckle.png";
        armor = armor || Utils.getArmorByName("Rody Set");
        weapon = weapon || Utils.getItemByName("Legendary Golden Gloves");
        constants = constants || {
            'weapon': 'knuckle',
            'skills': [Utils.getSkillByName("Bgvur Tialbold"), 
                       Utils.getSkillByName("Blood Fist"), 
                       Utils.getSkillByName("Asalraalaikum")],
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
        health += health * this.armorParam('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weaponParam('maxhp') / 100;
        health += health * this.buffParam('maxhp') / 100;
        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level*2.2+this.sta*7.7);
        fp += fp * this.armorParam('maxfp') / 100
        fp += fp * this.weaponParam('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*1.8+this.int*8.1);
        mp += mp * this.armorParam('maxmp') / 100
        mp += mp * this.weaponParam('maxmp') / 100
        return mp
    }
}

export class Ringmaster extends Assist {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "lgstick.png";
        armor = armor || Utils.getArmorByName("Rimyth Set");
        weapon = weapon || Utils.getItemByName("Legendary Golden Stick");
        constants = constants || {
            'weapon': 'stick',
            'skills': [Utils.getSkillByName('Merkaba Hanzelrusha')],
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
        health += health * this.armorParam('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weaponParam('maxhp') / 100;
        health += health * this.buffParam('maxhp') / 100;
        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level*0.8+this.sta*2.8);
        fp += fp * this.armorParam('maxfp') / 100
        fp += fp * this.weaponParam('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*3.6+this.int*16.2);
        mp += mp * this.armorParam('maxmp') / 100
        mp += mp * this.weaponParam('maxmp') / 100
        return mp
    }
}

export class Acrobat extends Vagrant {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "layeredbow.png";
        armor = armor || Utils.getArmorByName("Cruiser Set");
        weapon = weapon || Utils.getItemByName("Layered Bow");
        constants = constants || {
            'weapon': 'bow',
            'skills': [Utils.getSkillByName("Junk Arrow"), 
                       Utils.getSkillByName("Silent Shot"), 
                       Utils.getSkillByName("Arrow Rain")],
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
        health += health * this.armorParam('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weaponParam('maxhp') / 100;
        health += health * this.buffParam('maxhp') / 100;
        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level*1+this.sta*3.5);
        fp += fp * this.armorParam('maxfp') / 100
        fp += fp * this.weaponParam('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*1+this.int*4.5);
        mp += mp * this.armorParam('maxmp') / 100
        mp += mp * this.weaponParam('maxmp') / 100
        return mp
    }
}

export class Jester extends Acrobat {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "lgyoyo.png";
        armor = armor || Utils.getArmorByName("Neis Set");
        weapon = weapon || Utils.getItemByName("Legendary Golden Yo-Yo");
        constants = constants || {
            'weapon': 'yoyo',
            'skills': [Utils.getSkillByName("Sneak Stab"), 
                       Utils.getSkillByName("Vital stab"), 
                       Utils.getSkillByName("Hit of Penya")],
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
        health += health * this.armorParam('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weaponParam('maxhp') / 100;
        health += health * this.buffParam('maxhp') / 100;
        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level*2+this.sta*7);
        fp += fp * this.armorParam('maxfp') / 100
        fp += fp * this.weaponParam('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*1+this.int*4.5);
        mp += mp * this.armorParam('maxmp') / 100
        mp += mp * this.weaponParam('maxmp') / 100
        return mp
    }
}

export class Ranger extends Acrobat {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "lgbow.png";
        armor = armor || Utils.getArmorByName("Tyrent Set");
        weapon = weapon || Utils.getItemByName("Legendary Golden Bow");
        constants = constants || {
            'weapon': 'bow',
            'skills': [Utils.getSkillByName("Ice Arrow"), 
                       Utils.getSkillByName("Flame Arrow"), 
                       Utils.getSkillByName("Silent Arrow")],
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
        health += health * this.armorParam('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weaponParam('maxhp') / 100;
        health += health * this.buffParam('maxhp') / 100;
        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level*1.2+this.sta*4.2);
        fp += fp * this.armorParam('maxfp') / 100
        fp += fp * this.weaponParam('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*2.4+this.int*10.8);
        mp += mp * this.armorParam('maxmp') / 100
        mp += mp * this.weaponParam('maxmp') / 100
        return mp
    }
}

export class Magician extends Vagrant {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "opelwand.png";
        armor = armor || Utils.getArmorByName("Teba Set");
        weapon = weapon || Utils.getItemByName("Opel Wand");
        constants = constants || {
            'weapon': 'wand',
            'skills': [Utils.getSkillByName("Mental Strike"), 
                       Utils.getSkillByName("Rock Crash"), 
                       Utils.getSkillByName("Water Well")],
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
        health += health * this.armorParam('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weaponParam('maxhp') / 100;
        health += health * this.buffParam('maxhp') / 100;
        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level*0.6+this.sta*2.1);
        fp += fp * this.armorParam('maxfp') / 100
        fp += fp * this.weaponParam('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*3.4+this.int*15.3);
        mp += mp * this.armorParam('maxmp') / 100
        mp += mp * this.weaponParam('maxmp') / 100
        return mp
    }
}

export class Psykeeper extends Magician {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "lgwand.png";
        armor = armor || Utils.getArmorByName("Mekatro Set");
        weapon = weapon || Utils.getItemByName("Legendary Golden Wand");
        constants = constants || {
            'weapon': 'wand',
            'skills': [Utils.getSkillByName("Psychic Bomb"), 
                       Utils.getSkillByName("Spirit Bomb"), 
                       Utils.getSkillByName("Psychic Square")],
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
        health += health * this.armorParam('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weaponParam('maxhp') / 100;
        health += health * this.buffParam('maxhp') / 100;
        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level*0.8+this.sta*2.8);
        fp += fp * this.armorParam('maxfp') / 100
        fp += fp * this.weaponParam('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*4+this.int*18);
        mp += mp * this.armorParam('maxmp') / 100
        mp += mp * this.weaponParam('maxmp') / 100
        return mp
    }
}

export class Elementor extends Magician {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "lgstaff.png";
        armor = armor || Utils.getArmorByName("Shabel Set");
        weapon = weapon || Utils.getItemByName("Legendary Golden Staff");
        constants = constants || {
            'weapon': 'staff',
            'skills': [Utils.getSkillByName("Firebird"), 
                       Utils.getSkillByName("Windfield"), 
                       Utils.getSkillByName("Iceshark")],
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
        health += health * this.armorParam('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weaponParam('maxhp') / 100;
        health += health * this.buffParam('maxhp') / 100;
        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level*0.8+this.sta*2.8);
        fp += fp * this.armorParam('maxfp') / 100
        fp += fp * this.weaponParam('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*4+this.int*18);
        mp += mp * this.armorParam('maxmp') / 100
        mp += mp * this.weaponParam('maxmp') / 100
        return mp
    }
}

export class Mercenary extends Vagrant {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "woodensword.png";
        armor = armor || Utils.getArmorByName("Panggril Set");
        weapon = weapon || Utils.getItemByName("Flam Sword");
        constants = constants || {
            'weapon': 'sword',
            'skills': [Utils.getSkillByName("Shield Bash"), 
                       Utils.getSkillByName("Keenwheel"), 
                       Utils.getSkillByName("Guillotine")],
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
        health += health * this.armorParam('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weaponParam('maxhp') / 100;
        health += health * this.buffParam('maxhp') / 100;
        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level*1.4+this.sta*4.9);
        fp += fp * this.armorParam('maxfp') / 100
        fp += fp * this.weaponParam('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*1+this.int*4.5);
        mp += mp * this.armorParam('maxmp') / 100
        mp += mp * this.weaponParam('maxmp') / 100
        return mp
    }
}

export class Blade extends Mercenary {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "lgaxe.png";
        armor = armor || Utils.getArmorByName("Hanes Set");
        weapon = weapon || Utils.getItemByName("Legendary Golden Axe");
        constants = constants || {
            'weapon': 'axe',
            'skills': [Utils.getSkillByName("Blade Dance"), 
                       Utils.getSkillByName("Hawk Attack"), 
                       Utils.getSkillByName("Cross Strike")],
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
        health += health * this.armorParam('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weaponParam('maxhp') / 100;
        health += health * this.buffParam('maxhp') / 100;
        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level*2.4+this.sta*8.400001);
        fp += fp * this.armorParam('maxfp') / 100
        fp += fp * this.weaponParam('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*1.2+this.int*5.4);
        mp += mp * this.armorParam('maxmp') / 100
        mp += mp * this.weaponParam('maxmp') / 100
        return mp
    }
}

export class Knight extends Mercenary {
    constructor(str=15, sta=15, int=15, dex=15, level=1, constants=null, img=null, weapon=null, armor=null) {
        img = img || "lgswt.png";
        armor = armor || Utils.getArmorByName("Extro Set");
        weapon = weapon || Utils.getItemByName("Legendary Golden Big Sword");
        constants = constants || {
            'weapon': 'axe',
            'skills': [Utils.getSkillByName("Pain Dealer"), 
                       Utils.getSkillByName("Power Stomp"), 
                       Utils.getSkillByName("Earth Divider")],
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
        health += health * this.armorParam('maxhp') / 100;   // TODO: This could be flat HP        
        health += health * this.weaponParam('maxhp') / 100;
        health += health * this.buffParam('maxhp') / 100;
        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level*3+this.sta*10.5);
        fp += fp * this.armorParam('maxfp') / 100
        fp += fp * this.weaponParam('maxfp') / 100
        return fp
    }

    get mp() {
        let mp = Math.floor(22+this.level*1.2+this.int*5.4);
        mp += mp * this.armorParam('maxmp') / 100
        mp += mp * this.weaponParam('maxmp') / 100
        return mp
    }
}