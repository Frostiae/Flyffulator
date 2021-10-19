import { Vagrant, Assist, Billposter, Ringmaster, Acrobat, Jester, Ranger, Magician, Psykeeper, Elementor, Mercenary, Blade, Knight } from "./jobs.js";
import { jobsjson } from "../../flyff/jobs.js";
import { setsjson } from "../../flyff/sets.js";
import { itemsjson } from "../../flyff/items.js";
import { skillsjson } from "../../flyff/skills.js";
import { monstersjson } from "../../flyff/monsters.js";

export class Utils {
    constructor() {
        this.character = new Vagrant();
        this.monsters = monstersjson;
    }

    static skills = skillsjson;
    static items = itemsjson;
    static jobs = jobsjson;
    static sets = setsjson;

    static get_item_by_name(name) { return this.items.find(item => item.name.en == name); }
    static get_armor_by_name(name) { return this.sets.find(set => set.name.en == name); }
    static get_skill_by_name(name) { return this.skills.find(skill => skill.name.en == name); }

    static get_weapon_speed(weapon) {
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


    update_job(job) {
        if (this.character.constructor.name != job) { this.character = JobFactory.createJob(job); }
    }

    get_monsters_at_level(level, skill=null) {
        level = parseInt(level);
        let ignore_ranks = ['super', 'boss', 'giant'];
        
        let index = this.monsters.findIndex(monster => monster.level >= level + 1)
        if (index === null || index < 0) { return [] }

        let res = this.monsters.slice(Math.max(index - 10, 0), Math.min(index + 20, this.monsters.length))
        res = res.filter(function(monster) {
            return !ignore_ranks.includes(monster.rank) && monster.experience > 0 && !monster.name.en.includes("Criminal");
        });

        res.forEach(monster => {
            monster.player_damage = this.character.get_damage_against(monster, skill);
        });

        return res;
    }
}

class JobFactory {
    static createJob(job) {
        switch (job) {
            case 'Vagrant': return new Vagrant();
            case 'Assist': return new Assist();
            case 'Billposter': return new Billposter();
            case 'Ringmaster': return new Ringmaster();
            case 'Acrobat': return new Acrobat();
            case 'Jester': return new Jester();
            case 'Ranger': return new Ranger();
            case 'Magician': return new Magician();
            case 'Psykeeper': return new Psykeeper();
            case 'Elementor': return new Elementor();
            case 'Mercenary': return new Mercenary();
            case 'Blade': return new Blade();
            case 'Knight': return new Knight();
        }
    }
}