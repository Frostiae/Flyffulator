/* eslint-disable */
import { Mover } from "./mover.js";
import { Utils } from "./utils.js";

export class Vagrant extends Mover {
    constructor(str = 15, sta = 15, int = 15, dex = 15, level = 1, constants = null, img = null, weapon = null, armor = null, jobId = null) {
        super();
        this.jobId = jobId || jobId || 9686;
        this.weapon_img = img || "woodensword.png";
        this.armor = armor || null;
        this.weapon = weapon || Utils.getItemByName("Wooden Sword");
        this.earringR = null;
        this.earringL = null;
        this.ringR = null;
        this.ringL = null;
        this.necklace = null;
        this.suitPiercing = null;
        this.assistBuffs = false;
        this.selfBuffs = false;
        this.constants = constants || {
            'skills': [Utils.getSkillByName("Clean Hit"),
                Utils.getSkillByName("Flurry"),
                Utils.getSkillByName("Over Cutter")
            ],
            'buffs': [],
            'attackSpeed': 75.0,
            'hps': 4, // TODO: change these to frames instead and calculate hits/sec using them for more accuracy
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
        this.skillsRawDamage = {};

        this.str = parseInt(str);
        this.sta = parseInt(sta);
        this.int = parseInt(int);
        this.dex = parseInt(dex);

        this.addedStr = 0;
        this.addedSta = 0;
        this.addedInt = 0;
        this.addedDex = 0;

        this.level = parseInt(level);

        this.activeAssistBuffs = [];
        this.activeSelfBuffs = [];
        this.assistInt = 300; // How much int the assist buffing you has

        this.monsters = [];

        this.dps = {
            'aa': 0,
            '0': 0, // Skill 1
            '1': 0, // Skill 2
            '2': 0, // Skill 3
        }

        this.remainingPoints = 0;
        this.aspd = 0;
        this.criticalChance = 0;
        this.DCT = 0;
        this.attack = 0;
        this.criticalDamage = 0;
        this.averageAA = 1;
        this.hitrate = 1;

        this.forceUpdate = 0;
    }

    get health() {
        let health = Math.floor(80 + this.sta * 10.0 + this.level * (this.level + 1) * 0.1125 + this.level * (this.level + 1) * this.sta * 0.00225);
        
        health *= 1 + (this.getExtraParam('maxhp', true) / 100);
        health *= this instanceof Blade ? 1 + (this.weaponParam('maxhp', true) / 100) : 1;

        health += this.getExtraParam('maxhp', false);
        health += this instanceof Blade ? this.weaponParam('maxhp', false) : 0;

        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level * 0.6 + this.sta * 2.1);
        
        fp *= 1 + (this.getExtraParam('maxfp', true) / 100);
        fp *= this instanceof Blade ? 1 + (this.weaponParam('maxfp', true) / 100) : 1;

        fp += this.getExtraParam('maxfp', false);
        fp += this instanceof Blade ? this.weaponParam('maxfp', false) : 0;

        return fp
    }

    get mp() {
        let mp = Math.floor(22 + this.level * 0.6 + this.int * 2.7);
        
        mp *= 1 + (this.getExtraParam('maxmp', true) / 100);
        mp *= this instanceof Blade ? 1 + (this.weaponParam('maxmp', true) / 100) : 1;

        mp += this.getExtraParam('maxmp', false);
        mp += this instanceof Blade ? this.weaponParam('maxmp', false) : 0;

        return mp
    }
}


export class Assist extends Vagrant {
    constructor(str = 15, sta = 15, int = 15, dex = 15, level = 1, constants = null, img = null, weapon = null, armor = null, jobId = null) {
        jobId = jobId || 8962;
        img = img || "overamknuckle.png";
        armor = armor || Utils.getArmorByName("Sayram Set");
        weapon = weapon || Utils.getItemByName("Paipol Knuckle");
        constants = constants || {
            'skills': [Utils.getSkillByName("Power Fist"),
                Utils.getSkillByName("Temping Hole"),
                Utils.getSkillByName("Burst Crack")
            ],
            'buffs': [Utils.getSkillByName("Stonehand")],
            'attackSpeed': 75.0, // Might be 70
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
        super(str, sta, int, dex, level, constants, img, weapon, armor, jobId);
    }

    get health() {
        let health = Math.floor(80 + this.sta * 10.0 + this.level * (this.level + 1) * 0.175 + this.level * (this.level + 1) * this.sta * 0.0035);
        
        health *= 1 + (this.getExtraParam('maxhp', true) / 100);
        health *= this instanceof Blade ? 1 + (this.weaponParam('maxhp', true) / 100) : 1;

        health += this.getExtraParam('maxhp', false);
        health += this instanceof Blade ? this.weaponParam('maxhp', false) : 0;

        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level * 1.2 + this.sta * 4.2);
        
        fp *= 1 + (this.getExtraParam('maxfp', true) / 100);
        fp *= this instanceof Blade ? 1 + (this.weaponParam('maxfp', true) / 100) : 1;

        fp += this.getExtraParam('maxfp', false);
        fp += this instanceof Blade ? this.weaponParam('maxfp', false) : 0;

        return fp
    }

    get mp() {
        let mp = Math.floor(22 + this.level * 2.6 + this.int * 11.7);
        
        mp *= 1 + (this.getExtraParam('maxmp', true) / 100);
        mp *= this instanceof Blade ? 1 + (this.weaponParam('maxmp', true) / 100) : 1;

        mp += this.getExtraParam('maxmp', false);
        mp += this instanceof Blade ? this.weaponParam('maxmp', false) : 0;

        return mp
    }
}

export class Billposter extends Assist {
    constructor(str = 15, sta = 15, int = 15, dex = 15, level = 1, constants = null, img = null, weapon = null, armor = null, jobId = null) {
        jobId = jobId || 7424;
        img = img || "bloodyknuckle.png";
        armor = armor || Utils.getArmorByName("Rody Set");
        weapon = weapon || Utils.getItemByName("Legendary Golden Gloves");
        constants = constants || {
            'skills': [Utils.getSkillByName("Bgvur Tialbold"),
                Utils.getSkillByName("Blood Fist"),
                Utils.getSkillByName("Asalraalaikum")
            ],
            'buffs': [Utils.getSkillByName("Asmodeus")],
            'attackSpeed': 85.0,
            'hps': 2.5,
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
        super(str, sta, int, dex, level, constants, img, weapon, armor, jobId);
    }

    get health() {
        let health = Math.floor(80 + this.sta * 10.0 + this.level * (this.level + 1) * 0.225 + this.level * (this.level + 1) * this.sta * 0.0045);
        
        health *= 1 + (this.getExtraParam('maxhp', true) / 100);
        health *= this instanceof Blade ? 1 + (this.weaponParam('maxhp', true) / 100) : 1;

        health += this.getExtraParam('maxhp', false);
        health += this instanceof Blade ? this.weaponParam('maxhp', false) : 0;

        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level * 2.2 + this.sta * 7.7);
        
        fp *= 1 + (this.getExtraParam('maxfp', true) / 100);
        fp *= this instanceof Blade ? 1 + (this.weaponParam('maxfp', true) / 100) : 1;

        fp += this.getExtraParam('maxfp', false);
        fp += this instanceof Blade ? this.weaponParam('maxfp', false) : 0;

        return fp
    }

    get mp() {
        let mp = Math.floor(22 + this.level * 1.8 + this.int * 8.1);
        
        mp *= 1 + (this.getExtraParam('maxmp', true) / 100);
        mp *= this instanceof Blade ? 1 + (this.weaponParam('maxmp', true) / 100) : 1;

        mp += this.getExtraParam('maxmp', false);
        mp += this instanceof Blade ? this.weaponParam('maxmp', false) : 0;

        return mp
    }
}

export class Ringmaster extends Assist {
    constructor(str = 15, sta = 15, int = 15, dex = 15, level = 1, constants = null, img = null, weapon = null, armor = null, jobId = null) {
        jobId = jobId || 9389;
        img = img || "lgstick.png";
        armor = armor || Utils.getArmorByName("Rimyth Set");
        weapon = weapon || Utils.getItemByName("Legendary Golden Stick");
        constants = constants || {
            'skills': [Utils.getSkillByName('Merkaba Hanzelrusha'),
                Utils.getSkillByName('Burst Crack')
            ],
            'buffs': [Utils.getSkillByName("Holyguard"),
                Utils.getSkillByName("Protect"),
                Utils.getSkillByName("Spirit Fortune"),
                Utils.getSkillByName("Geburah Tiphreth")
            ],
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
        super(str, sta, int, dex, level, constants, img, weapon, armor, jobId);
    }

    get health() {
        let health = Math.floor(80 + this.sta * 10.0 + this.level * (this.level + 1) * 0.2 + this.level * (this.level + 1) * this.sta * 0.004);

        health *= 1 + (this.getExtraParam('maxhp', true) / 100);
        health *= this instanceof Blade ? 1 + (this.weaponParam('maxhp', true) / 100) : 1;

        health += this.getExtraParam('maxhp', false);
        health += this instanceof Blade ? this.weaponParam('maxhp', false) : 0;

        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level * 0.8 + this.sta * 2.8);

        fp *= 1 + (this.getExtraParam('maxfp', true) / 100);
        fp *= this instanceof Blade ? 1 + (this.weaponParam('maxfp', true) / 100) : 1;

        fp += this.getExtraParam('maxfp', false);
        fp += this instanceof Blade ? this.weaponParam('maxfp', false) : 0;

        return fp
    }

    get mp() {
        let mp = Math.floor(22 + this.level * 3.6 + this.int * 16.2);

        mp *= 1 + (this.getExtraParam('maxmp', true) / 100);
        mp *= this instanceof Blade ? 1 + (this.weaponParam('maxmp', true) / 100) : 1;

        mp += this.getExtraParam('maxmp', false);
        mp += this instanceof Blade ? this.weaponParam('maxmp', false) : 0;

        return mp
    }
}

export class Acrobat extends Vagrant {
    constructor(str = 15, sta = 15, int = 15, dex = 15, level = 1, constants = null, img = null, weapon = null, armor = null, jobId = null) {
        jobId = jobId || 9098;
        img = img || "layeredbow.png";
        armor = armor || Utils.getArmorByName("Cruiser Set");
        weapon = weapon || Utils.getItemByName("Layered Bow");
        constants = constants || {
            'skills': [Utils.getSkillByName("Junk Arrow"),
                Utils.getSkillByName("Silent Shot"),
                Utils.getSkillByName("Arrow Rain")
            ],
            'buffs': [Utils.getSkillByName("Perfect Block"),
                Utils.getSkillByName("Bow Mastery"),
                Utils.getSkillByName("Yo-Yo mastery"),
                Utils.getSkillByName("Fast Walker")
            ],
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
        super(str, sta, int, dex, level, constants, img, weapon, armor, jobId);
    }

    get health() {
        let health = Math.floor(80 + this.sta * 10.0 + this.level * (this.level + 1) * 0.175 + this.level * (this.level + 1) * this.sta * 0.0035);

        health *= 1 + (this.getExtraParam('maxhp', true) / 100);
        health *= this instanceof Blade ? 1 + (this.weaponParam('maxhp', true) / 100) : 1;

        health += this.getExtraParam('maxhp', false);
        health += this instanceof Blade ? this.weaponParam('maxhp', false) : 0;

        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level * 1 + this.sta * 3.5);

        fp *= 1 + (this.getExtraParam('maxfp', true) / 100);
        fp *= this instanceof Blade ? 1 + (this.weaponParam('maxfp', true) / 100) : 1;

        fp += this.getExtraParam('maxfp', false);
        fp += this instanceof Blade ? this.weaponParam('maxfp', false) : 0;

        return fp
    }

    get mp() {
        let mp = Math.floor(22 + this.level * 1 + this.int * 4.5);

        mp *= 1 + (this.getExtraParam('maxmp', true) / 100);
        mp *= this instanceof Blade ? 1 + (this.weaponParam('maxmp', true) / 100) : 1;

        mp += this.getExtraParam('maxmp', false);
        mp += this instanceof Blade ? this.weaponParam('maxmp', false) : 0;

        return mp
    }
}

export class Jester extends Acrobat {
    constructor(str = 15, sta = 15, int = 15, dex = 15, level = 1, constants = null, img = null, weapon = null, armor = null, jobId = null) {
        jobId = jobId || 3545;
        img = img || "lgyoyo.png";
        armor = armor || Utils.getArmorByName("Neis Set");
        weapon = weapon || Utils.getItemByName("Legendary Golden Yo-Yo");
        constants = constants || {
            'skills': [Utils.getSkillByName("Sneak Stab"),
                Utils.getSkillByName("Vital stab"),
                Utils.getSkillByName("Hit of Penya")
            ],
            'buffs': [Utils.getSkillByName("Critical Swing"),
                Utils.getSkillByName("Enchant Absorb")
            ],
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
        super(str, sta, int, dex, level, constants, img, weapon, armor, jobId);
    }

    get health() {
        let health = Math.floor(80 + this.sta * 10.0 + this.level * (this.level + 1) * 0.1875 + this.level * (this.level + 1) * this.sta * 0.00375);

        health *= 1 + (this.getExtraParam('maxhp', true) / 100);
        health *= this instanceof Blade ? 1 + (this.weaponParam('maxhp', true) / 100) : 1;

        health += this.getExtraParam('maxhp', false);
        health += this instanceof Blade ? this.weaponParam('maxhp', false) : 0;

        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level * 2 + this.sta * 7);

        fp *= 1 + (this.getExtraParam('maxfp', true) / 100);
        fp *= this instanceof Blade ? 1 + (this.weaponParam('maxfp', true) / 100) : 1;

        fp += this.getExtraParam('maxfp', false);
        fp += this instanceof Blade ? this.weaponParam('maxfp', false) : 0;

        return fp
    }

    get mp() {
        let mp = Math.floor(22 + this.level * 1 + this.int * 4.5);

        mp *= 1 + (this.getExtraParam('maxmp', true) / 100);
        mp *= this instanceof Blade ? 1 + (this.weaponParam('maxmp', true) / 100) : 1;

        mp += this.getExtraParam('maxmp', false);
        mp += this instanceof Blade ? this.weaponParam('maxmp', false) : 0;

        return mp
    }
}

export class Ranger extends Acrobat {
    constructor(str = 15, sta = 15, int = 15, dex = 15, level = 1, constants = null, img = null, weapon = null, armor = null, jobId = null) {
        jobId = jobId || 9295;
        img = img || "lgbow.png";
        armor = armor || Utils.getArmorByName("Tyrent Set");
        weapon = weapon || Utils.getItemByName("Legendary Golden Bow");
        constants = constants || {
            'skills': [Utils.getSkillByName("Ice Arrow"),
                Utils.getSkillByName("Flame Arrow"),
                Utils.getSkillByName("Silent Arrow")
            ],
            'buffs': [Utils.getSkillByName("Critical Shot"),
                Utils.getSkillByName("Nature")
            ],
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
        super(str, sta, int, dex, level, constants, img, weapon, armor, jobId);
    }

    get health() {
        let health = Math.floor(80 + this.sta * 10.0 + this.level * (this.level + 1) * 0.2 + this.level * (this.level + 1) * this.sta * 0.004);

        health *= 1 + (this.getExtraParam('maxhp', true) / 100);
        health *= this instanceof Blade ? 1 + (this.weaponParam('maxhp', true) / 100) : 1;

        health += this.getExtraParam('maxhp', false);
        health += this instanceof Blade ? this.weaponParam('maxhp', false) : 0;

        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level * 1.2 + this.sta * 4.2);

        fp *= 1 + (this.getExtraParam('maxfp', true) / 100);
        fp *= this instanceof Blade ? 1 + (this.weaponParam('maxfp', true) / 100) : 1;

        fp += this.getExtraParam('maxfp', false);
        fp += this instanceof Blade ? this.weaponParam('maxfp', false) : 0;

        return fp
    }

    get mp() {
        let mp = Math.floor(22 + this.level * 2.4 + this.int * 10.8);

        mp *= 1 + (this.getExtraParam('maxmp', true) / 100);
        mp *= this instanceof Blade ? 1 + (this.weaponParam('maxmp', true) / 100) : 1;

        mp += this.getExtraParam('maxmp', false);
        mp += this instanceof Blade ? this.weaponParam('maxmp', false) : 0;

        return mp
    }
}

export class Magician extends Vagrant {
    constructor(str = 15, sta = 15, int = 15, dex = 15, level = 1, constants = null, img = null, weapon = null, armor = null, jobId = null) {
        jobId = jobId || 9581;
        img = img || "opelwand.png";
        armor = armor || Utils.getArmorByName("Teba Set");
        weapon = weapon || Utils.getItemByName("Opel Wand");
        constants = constants || {
            'skills': [Utils.getSkillByName("Mental Strike"),
                Utils.getSkillByName("Rock Crash"),
                Utils.getSkillByName("Water Well")
            ],
            'buffs': [],
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
        super(str, sta, int, dex, level, constants, img, weapon, armor, jobId);
    }

    get health() {
        let health = Math.floor(80 + this.sta * 10.0 + this.level * (this.level + 1) * 0.175 + this.level * (this.level + 1) * this.sta * 0.0035);

        health *= 1 + (this.getExtraParam('maxhp', true) / 100);
        health *= this instanceof Blade ? 1 + (this.weaponParam('maxhp', true) / 100) : 1;

        health += this.getExtraParam('maxhp', false);
        health += this instanceof Blade ? this.weaponParam('maxhp', false) : 0;

        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level * 0.6 + this.sta * 2.1);

        fp *= 1 + (this.getExtraParam('maxfp', true) / 100);
        fp *= this instanceof Blade ? 1 + (this.weaponParam('maxfp', true) / 100) : 1;

        fp += this.getExtraParam('maxfp', false);
        fp += this instanceof Blade ? this.weaponParam('maxfp', false) : 0;

        return fp
    }

    get mp() {
        let mp = Math.floor(22 + this.level * 3.4 + this.int * 15.3);

        mp *= 1 + (this.getExtraParam('maxmp', true) / 100);
        mp *= this instanceof Blade ? 1 + (this.weaponParam('maxmp', true) / 100) : 1;

        mp += this.getExtraParam('maxmp', false);
        mp += this instanceof Blade ? this.weaponParam('maxmp', false) : 0;

        return mp
    }
}

export class Psykeeper extends Magician {
    constructor(str = 15, sta = 15, int = 15, dex = 15, level = 1, constants = null, img = null, weapon = null, armor = null, jobId = null) {
        jobId = jobId || 5709;
        img = img || "lgwand.png";
        armor = armor || Utils.getArmorByName("Mekatro Set");
        weapon = weapon || Utils.getItemByName("Legendary Golden Wand");
        constants = constants || {
            'skills': [Utils.getSkillByName("Psychic Bomb"),
                Utils.getSkillByName("Spirit Bomb"),
                Utils.getSkillByName("Psychic Square")
            ],
            'buffs': [],
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
        super(str, sta, int, dex, level, constants, img, weapon, armor, jobId);
    }

    get health() {
        let health = Math.floor(80 + this.sta * 10.0 + this.level * (this.level + 1) * 0.1875 + this.level * (this.level + 1) * this.sta * 0.00375);

        health *= 1 + (this.getExtraParam('maxhp', true) / 100);
        health *= this instanceof Blade ? 1 + (this.weaponParam('maxhp', true) / 100) : 1;

        health += this.getExtraParam('maxhp', false);
        health += this instanceof Blade ? this.weaponParam('maxhp', false) : 0;

        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level * 0.8 + this.sta * 2.8);

        fp *= 1 + (this.getExtraParam('maxfp', true) / 100);
        fp *= this instanceof Blade ? 1 + (this.weaponParam('maxfp', true) / 100) : 1;

        fp += this.getExtraParam('maxfp', false);
        fp += this instanceof Blade ? this.weaponParam('maxfp', false) : 0;

        return fp
    }

    get mp() {
        let mp = Math.floor(22 + this.level * 4 + this.int * 18);

        mp *= 1 + (this.getExtraParam('maxmp', true) / 100);
        mp *= this instanceof Blade ? 1 + (this.weaponParam('maxmp', true) / 100) : 1;

        mp += this.getExtraParam('maxmp', false);
        mp += this instanceof Blade ? this.weaponParam('maxmp', false) : 0;

        return mp
    }
}

export class Elementor extends Magician {
    constructor(str = 15, sta = 15, int = 15, dex = 15, level = 1, constants = null, img = null, weapon = null, armor = null, jobId = null) {
        jobId = jobId || 9150;
        img = img || "lgstaff.png";
        armor = armor || Utils.getArmorByName("Shabel Set");
        weapon = weapon || Utils.getItemByName("Legendary Golden Staff");
        constants = constants || {
            'skills': [Utils.getSkillByName("Firebird"),
                Utils.getSkillByName("Windfield"),
                Utils.getSkillByName("Iceshark")
            ],
            'buffs': [Utils.getSkillByName("Lightning Mastery"),
                Utils.getSkillByName("Fire Master"),
                Utils.getSkillByName("Earth Master"),
                Utils.getSkillByName("Wind Master"),
                Utils.getSkillByName("Water Master")
            ],
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
        super(str, sta, int, dex, level, constants, img, weapon, armor, jobId);
    }

    get health() {
        let health = Math.floor(80 + this.sta * 10.0 + this.level * (this.level + 1) * 0.1875 + this.level * (this.level + 1) * this.sta * 0.00375);

        health *= 1 + (this.getExtraParam('maxhp', true) / 100);
        health *= this instanceof Blade ? 1 + (this.weaponParam('maxhp', true) / 100) : 1;

        health += this.getExtraParam('maxhp', false);
        health += this instanceof Blade ? this.weaponParam('maxhp', false) : 0;

        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level * 0.8 + this.sta * 2.8);

        fp *= 1 + (this.getExtraParam('maxfp', true) / 100);
        fp *= this instanceof Blade ? 1 + (this.weaponParam('maxfp', true) / 100) : 1;

        fp += this.getExtraParam('maxfp', false);
        fp += this instanceof Blade ? this.weaponParam('maxfp', false) : 0;

        return fp
    }

    get mp() {
        let mp = Math.floor(22 + this.level * 4 + this.int * 18);

        mp *= 1 + (this.getExtraParam('maxmp', true) / 100);
        mp *= this instanceof Blade ? 1 + (this.weaponParam('maxmp', true) / 100) : 1;

        mp += this.getExtraParam('maxmp', false);
        mp += this instanceof Blade ? this.weaponParam('maxmp', false) : 0;

        return mp
    }
}

export class Mercenary extends Vagrant {
    constructor(str = 15, sta = 15, int = 15, dex = 15, level = 1, constants = null, img = null, weapon = null, armor = null, jobId = null) {
        jobId = jobId || 764;
        img = img || "woodensword.png";
        armor = armor || Utils.getArmorByName("Panggril Set");
        weapon = weapon || Utils.getItemByName("Flam Sword");
        constants = constants || {
            'skills': [Utils.getSkillByName("Shield Bash"),
                Utils.getSkillByName("Keenwheel"),
                Utils.getSkillByName("Guillotine")
            ],
            'buffs': [Utils.getSkillByName("Blazing Sword"),
                Utils.getSkillByName("Sword Mastery")
            ],
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
        super(str, sta, int, dex, level, constants, img, weapon, armor, jobId);
    }

    get health() {
        let health = Math.floor(80 + this.sta * 10.0 + this.level * (this.level + 1) * 0.1875 + this.level * (this.level + 1) * this.sta * 0.00375);

        health *= 1 + (this.getExtraParam('maxhp', true) / 100);
        health *= this instanceof Blade ? 1 + (this.weaponParam('maxhp', true) / 100) : 1;

        health += this.getExtraParam('maxhp', false);
        health += this instanceof Blade ? this.weaponParam('maxhp', false) : 0;

        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level * 1.4 + this.sta * 4.9);

        fp *= 1 + (this.getExtraParam('maxfp', true) / 100);
        fp *= this instanceof Blade ? 1 + (this.weaponParam('maxfp', true) / 100) : 1;

        fp += this.getExtraParam('maxfp', false);
        fp += this instanceof Blade ? this.weaponParam('maxfp', false) : 0;

        return fp
    }

    get mp() {
        let mp = Math.floor(22 + this.level * 1 + this.int * 4.5);

        mp *= 1 + (this.getExtraParam('maxmp', true) / 100);
        mp *= this instanceof Blade ? 1 + (this.weaponParam('maxmp', true) / 100) : 1;

        mp += this.getExtraParam('maxmp', false);
        mp += this instanceof Blade ? this.weaponParam('maxmp', false) : 0;

        return mp
    }
}

export class Blade extends Mercenary {
    constructor(str = 15, sta = 15, int = 15, dex = 15, level = 1, constants = null, img = null, weapon = null, armor = null, jobId = null) {
        jobId = jobId || 2246;
        img = img || "lgaxe.png";
        armor = armor || Utils.getArmorByName("Hanes Set");
        weapon = weapon || Utils.getItemByName("Legendary Golden Axe");
        constants = constants || {
            'skills': [Utils.getSkillByName("Blade Dance"),
                Utils.getSkillByName("Hawk Attack"),
                Utils.getSkillByName("Cross Strike")
            ],
            'buffs': [Utils.getSkillByName("Berserk")],
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
        super(str, sta, int, dex, level, constants, img, weapon, armor, jobId);
    }

    get health() {
        let health = Math.floor(80 + this.sta * 10.0 + this.level * (this.level + 1) * 0.1875 + this.level * (this.level + 1) * this.sta * 0.00375);

        health *= 1 + (this.getExtraParam('maxhp', true) / 100);
        health *= this instanceof Blade ? 1 + (this.weaponParam('maxhp', true) / 100) : 1;

        health += this.getExtraParam('maxhp', false);
        health += this instanceof Blade ? this.weaponParam('maxhp', false) : 0;

        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level * 2.4 + this.sta * 8.400001);

        fp *= 1 + (this.getExtraParam('maxfp', true) / 100);
        fp *= this instanceof Blade ? 1 + (this.weaponParam('maxfp', true) / 100) : 1;

        fp += this.getExtraParam('maxfp', false);
        fp += this instanceof Blade ? this.weaponParam('maxfp', false) : 0;

        return fp
    }

    get mp() {
        let mp = Math.floor(22 + this.level * 1.2 + this.int * 5.4);

        mp *= 1 + (this.getExtraParam('maxmp', true) / 100);
        mp *= this instanceof Blade ? 1 + (this.weaponParam('maxmp', true) / 100) : 1;

        mp += this.getExtraParam('maxmp', false);
        mp += this instanceof Blade ? this.weaponParam('maxmp', false) : 0;

        return mp
    }
}

export class Knight extends Mercenary {
    constructor(str = 15, sta = 15, int = 15, dex = 15, level = 1, constants = null, img = null, weapon = null, armor = null, jobId = null) {
        jobId = jobId || 5330;
        img = img || "lgswt.png";
        armor = armor || Utils.getArmorByName("Extro Set");
        weapon = weapon || Utils.getItemByName("Legendary Golden Big Sword");
        constants = constants || {
            'skills': [Utils.getSkillByName("Pain Dealer"),
                Utils.getSkillByName("Power Stomp"),
                Utils.getSkillByName("Earth Divider")
            ],
            'buffs': [Utils.getSkillByName("Rage")],
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
        super(str, sta, int, dex, level, constants, img, weapon, armor, jobId);
    }

    get health() {
        let health = Math.floor(80 + this.sta * 10.0 + this.level * (this.level + 1) * 0.25 + this.level * (this.level + 1) * this.sta * 0.005);

        health *= 1 + (this.getExtraParam('maxhp', true) / 100);
        health *= this instanceof Blade ? 1 + (this.weaponParam('maxhp', true) / 100) : 1;

        health += this.getExtraParam('maxhp', false);
        health += this instanceof Blade ? this.weaponParam('maxhp', false) : 0;

        return Math.floor(health);
    }

    get fp() {
        let fp = Math.floor(this.level * 3 + this.sta * 10.5);

        fp *= 1 + (this.getExtraParam('maxfp', true) / 100);
        fp *= this instanceof Blade ? 1 + (this.weaponParam('maxfp', true) / 100) : 1;

        fp += this.getExtraParam('maxfp', false);
        fp += this instanceof Blade ? this.weaponParam('maxfp', false) : 0;

        return fp
    }

    get mp() {
        let mp = Math.floor(22 + this.level * 1.2 + this.int * 5.4);

        mp *= 1 + (this.getExtraParam('maxmp', true) / 100);
        mp *= this instanceof Blade ? 1 + (this.weaponParam('maxmp', true) / 100) : 1;

        mp += this.getExtraParam('maxmp', false);
        mp += this instanceof Blade ? this.weaponParam('maxmp', false) : 0;

        return mp
    }
}