/* eslint-disable */
import { Vagrant, Assist, Billposter, Ringmaster, Acrobat, Jester, Ranger, Magician, Psykeeper, Elementor, Mercenary, Blade, Knight } from "./jobs.js";
import { jobsjson } from "../assets/flyff/jobs.js";
import { setsjson } from "../assets/flyff/sets.js";
import { itemsjson } from "../assets/flyff/items.js";
import { skillsjson } from "../assets/flyff/skills.js";
import { monstersjson } from "../assets/flyff/monsters.js";
import { upgradesjson } from "../assets/flyff/upgradeBonus.js";

export class Utils {
    constructor() {
        this.character = new Vagrant();
        this.monsters = monstersjson;
    }

    static skills = skillsjson;
    static items = itemsjson;
    static jobs = jobsjson;
    static sets = setsjson;
    static upgradeBonus = upgradesjson;

    static addedStr = 0;
    static addedSta = 0;
    static addedDex = 0;
    static addedInt = 0;
    
    static assistInt = 300;
    static assistBuffs = false;
    static classBuffs = false;

    static maxLevel = 120;

    // These parameters come in different names, so this object describes those. Used in getExtraParam() etc. in mover.js
    static globalParams = {
        "attack": [ // attack appears as
            "damage",   // damage
            "attack"    // attack
        ],
        "str": [
            "str",
            "allstats"
        ],
        "sta": [
            "sta",
            "allstats"
        ],
        "dex": [
            "dex",
            "allstats"
        ],
        "int": [
            "int",
            "allstats"
        ]
    }

    static getItemByName(name)  { return this.items.find(item => item.name.en.toLowerCase() == name.toLowerCase()); }
    static getItemById(id)      { return this.items.find(item => item.id == id); }
    static getArmorByName(name) { return this.sets.find(set => set.name.en.toLowerCase() == name.toLowerCase()); }
    static getSkillByName(name) { return this.skills.find(skill => skill.name.en.toLowerCase() == name.toLowerCase()); }
    static getSkillById(id)     { return this.skills.find(skill => skill.id == id); }
    
    static getJobId(jobName) { return this.jobs.find(job => job.name.en == jobName).id || 9686; }   // 9686 = vagrant
    static getParentJobId(jobId) { return this.jobs.find(job => job.id == jobId).parent || 9686; }
    static getJobName(jobId) { return this.jobs.find(job => job.id == jobId).name.en || "Vagrant"; }
    
    static getJewelery(subcategory) { return this.items.filter(item => item.category == "jewelry" && item.subcategory == subcategory); }
    static getPiercingCards() { return this.items.filter(item => item.subcategory == "piercingcard"); }
    static getShields() { return this.items.filter(item => item.subcategory == "shield"); }

    static getUpgradeBonus(upgradeLevel) { return this.upgradeBonus[upgradeLevel - 1] || null; }
    
    static getJobWeapons(jobId) {
        const jobs = [jobId, this.getParentJobId(jobId)]
        return this.items.filter(item => item.category == "weapon" && jobs.includes(item.class)); 
    }
    static getJobArmors(jobId) {
        const jobs = [jobId, this.getParentJobId(jobId)]
        return this.sets.filter(set => jobs.includes(this.getItemById(set.parts[0]).class)); 
    }


    static getWeaponSpeed(weapon) {
        if (!weapon) return 0;
        switch (weapon.attackSpeed) {
            case 'veryslow':
                return 0.035;
            case 'slow':
                return 0.050;
            case 'normal':
                return 0.070;
            case 'fast':
                return 0.080;
            case 'veryfast':
                return 0.085;
            default:
                return 0.17;
        }
    }

    static getJobFromId(jobId) { return JobFactory.createJobFromId(jobId); }

    static sortByName(a, b) {
        if (a.name.en < b.name.en) {
            return -1;
        }
        if (a.name.en > b.name.en) {
            return 1;
        }

        return 0;
    }

    updateJob(character, job) {
        if (character.constructor.name != job) { 
            let stats = {
                str: character.str,
                sta: character.sta,
                dex: character.dex,
                int: character.int,
                level: character.level
            };
            let c = JobFactory.createJobFromName(job, stats);
            return c;
        }

        return false;
    }

    getMonstersAtLevel(level, skill=null) {
        level = parseInt(level);
        let ignoreRanks = ['super', 'boss', 'giant', 'violet'];
        
        let index = this.monsters.findIndex(monster => monster.level >= level + 1)
        
        // Could not find monsters that are higher level than you, use the highest level monster
        if (index === null || index < 0) { index = this.monsters.length - 1 }
        
        let res = this.monsters.slice(Math.max(index - 10, 0), Math.min(index + 20, this.monsters.length))
        res = res.filter(function(monster) {
            return !ignoreRanks.includes(monster.rank) && monster.experience > 0 && !monster.name.en.includes("Criminal");
        });
        
        res.forEach(monster => {
            monster.playerDamage = this.character.getDamage(monster, skill);
            monster.playerDamage = monster.playerDamage <= 0 ? 1 : monster.playerDamage;
        });

        return res;
    }
    
    static newGuid() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
          (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }
}

class JobFactory {
    static createJobFromName(job, stats) {
        switch (job) {
            case 'Vagrant': return new Vagrant(stats.str, stats.sta, stats.int, stats.dex, stats.level);
            case 'Assist': return new Assist(stats.str, stats.sta, stats.int, stats.dex, stats.level);
            case 'Billposter': return new Billposter(stats.str, stats.sta, stats.int, stats.dex, stats.level);
            case 'Ringmaster': return new Ringmaster(stats.str, stats.sta, stats.int, stats.dex, stats.level);
            case 'Acrobat': return new Acrobat(stats.str, stats.sta, stats.int, stats.dex, stats.level);
            case 'Jester': return new Jester(stats.str, stats.sta, stats.int, stats.dex, stats.level);
            case 'Ranger': return new Ranger(stats.str, stats.sta, stats.int, stats.dex, stats.level);
            case 'Magician': return new Magician(stats.str, stats.sta, stats.int, stats.dex, stats.level);
            case 'Psykeeper': return new Psykeeper(stats.str, stats.sta, stats.int, stats.dex, stats.level);
            case 'Elementor': return new Elementor(stats.str, stats.sta, stats.int, stats.dex, stats.level);
            case 'Mercenary': return new Mercenary(stats.str, stats.sta, stats.int, stats.dex, stats.level);
            case 'Blade': return new Blade(stats.str, stats.sta, stats.int, stats.dex, stats.level);
            case 'Knight': return new Knight(stats.str, stats.sta, stats.int, stats.dex, stats.level);
        }
    }

    static createJobFromId(jobId) {
        switch (jobId) {
            case 9686: return new Vagrant();
            case 8962: return new Assist();
            case 7424: return new Billposter();
            case 9389: return new Ringmaster();
            case 9098: return new Acrobat();
            case 3545: return new Jester();
            case 9295: return new Ranger();
            case 9581: return new Magician();
            case 5709: return new Psykeeper();
            case 9150: return new Elementor();
            case 764: return new Mercenary();
            case 2246: return new Blade();
            case 5330: return new Knight();
        }
    }
}