/* eslint-disable */
import { Vagrant, Assist, Billposter, Ringmaster, Acrobat, Jester, Ranger, Magician, Psykeeper, Elementor, Mercenary, Blade, Knight } from "./jobs.js";
import { jobsjson } from "../assets/flyff/jobs.js";
import { setsjson } from "../assets/flyff/sets.js";
import { itemsjson } from "../assets/flyff/items.js";
import { skillsjson } from "../assets/flyff/skills.js";
import { monstersjson } from "../assets/flyff/monsters.js";

export class Utils {
    constructor() {
        this.character = new Vagrant();
        this.monsters = monstersjson;
    }

    static skills = skillsjson;
    static items = itemsjson;
    static jobs = jobsjson;
    static sets = setsjson;

    static getItemByName(name)  { return this.items.find(item => item.name.en.toLowerCase() == name.toLowerCase()); }
    static getItemById(id)      { return this.items.find(item => item.id == id); }
    static getArmorByName(name) { return this.sets.find(set => set.name.en.toLowerCase() == name.toLowerCase()); }
    static getSkillByName(name) { return this.skills.find(skill => skill.name.en.toLowerCase() == name.toLowerCase()); }
    static getSkillById(id)     { return this.skills.find(skill => skill.id == id); }
    
    static getJobId(jobName) { return this.jobs.find(job => job.name.en == jobName).id; }
    static getParentJobId(jobId) { return this.jobs.find(job => job.id == jobId).parent; }

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
                return 0.17;    // This is the very upper bound of 'veryfast', might be better at a lower value
            default:
                return 0.085;
        }
    }

    updateJob(character, job) {
        if (character.constructor.name != job) { 
            let c = JobFactory.createJob(job, 
                            character.str, 
                            character.sta, 
                            character.dex, 
                            character.int,
                            character.level);
            return c;
        }

        return false;
    }

    getMonstersAtLevel(level, skill=null) {
        level = parseInt(level);
        let ignoreRanks = ['super', 'boss', 'giant'];
        
        let index = this.monsters.findIndex(monster => monster.level >= level + 1)
        
        // Could not find monsters that are higher level than you, use the highest level monster
        if (index === null || index < 0) { index = this.monsters.length - 1 }
        
        let res = this.monsters.slice(Math.max(index - 10, 0), Math.min(index + 20, this.monsters.length))
        res = res.filter(function(monster) {
            return !ignoreRanks.includes(monster.rank) && monster.experience > 0 && !monster.name.en.includes("Criminal");
        });
        
        res.forEach(monster => {
            monster.playerDamage = this.character.getDamageAgainst(monster, skill);
            monster.playerDamage = monster.playerDamage <= 0 ? 1 : monster.playerDamage;
        });

        return res;
    }
}

class JobFactory {
    static createJob(job, str, sta, dex, int, level) {
        switch (job) {
            case 'Vagrant': return new Vagrant(str, sta, int, dex, level);
            case 'Assist': return new Assist(str, sta, int, dex, level);
            case 'Billposter': return new Billposter(str, sta, int, dex, level);
            case 'Ringmaster': return new Ringmaster(str, sta, int, dex, level);
            case 'Acrobat': return new Acrobat(str, sta, int, dex, level);
            case 'Jester': return new Jester(str, sta, int, dex, level);
            case 'Ranger': return new Ranger(str, sta, int, dex, level);
            case 'Magician': return new Magician(str, sta, int, dex, level);
            case 'Psykeeper': return new Psykeeper(str, sta, int, dex, level);
            case 'Elementor': return new Elementor(str, sta, int, dex, level);
            case 'Mercenary': return new Mercenary(str, sta, int, dex, level);
            case 'Blade': return new Blade(str, sta, int, dex, level);
            case 'Knight': return new Knight(str, sta, int, dex, level);
        }
    }
}