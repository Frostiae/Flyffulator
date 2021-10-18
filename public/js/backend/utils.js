import { jobsjson } from "../../flyff/jobs.js";
import { Vagrant, Assist, Billposter, Ringmaster, Acrobat, Jester, Ranger, Magician, Psykeeper, Elementor, Mercenary, Blade, Knight } from "./jobs.js";
import { setsjson } from "../../flyff/sets.js";
import { itemsjson } from "../../flyff/items.js";
import { skillsjson } from "../../flyff/skills.js";
import { monstersjson } from "../../flyff/monsters.js";

class Utils {
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

    update_job(job) {
        // Someone tell me how to call a constructor by its name in JS...
        if (this.character.constructor.name != job) {
            switch (job) {
                case 'Vagrant':
                    this.character = new Vagrant();
                    break;
                case 'Assist':
                    this.character = new Assist();
                    break;
                case 'Billposter':
                    this.character = new Billposter();
                    break;
                case 'Ringmaster':
                    this.character = new Ringmaster();
                    break;
                case 'Acrobat':
                    this.character = new Acrobat();
                    break;
                case 'Jester':
                    this.character = new Jester();
                    break;
                case 'Ranger':
                    this.character = new Ranger();
                    break;
                case 'Magician':
                    this.character = new Magician();
                    break;
                case 'Psykeeper':
                    this.character = new Psykeeper();
                    break;
                case 'Elementor':
                    this.character = new Elementor();
                    break;
                case 'Mercenary':
                    this.character = new Mercenary();
                    break;
                case 'Blade':
                    this.character = new Blade();
                    break;
                case 'Knight':
                    this.character = new Knight();
                    break;
            }
        }
    }

    get_monsters_at_level(level, skill=null) {
        level = parseInt(level);
        let ignore_ranks = ['super', 'boss', 'giant'];
        
        let index = this.monsters.findIndex(monster => monster.level >= level + 1)
        if (index === null || index < 0) {
            return []
        }

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

export { Utils }