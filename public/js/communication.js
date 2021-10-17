import { Utils } from "./backend/utils.js";
import { expchart, exphpchart, radarchart, hitsperlevelchart } from "./charts.js";

const utils = new Utils();

const job = document.getElementById("job");
const level = document.getElementById('level');
const STR = document.getElementById('STR');
const STA = document.getElementById('STA');
const DEX = document.getElementById('DEX');
const INT = document.getElementById('INT');
const health = document.getElementById('health');
const mp = document.getElementById('mp');
const fp = document.getElementById('fp');
const attack = document.getElementById('attack');
const attackspeed = document.getElementById('attackspeed');
const expperkill = document.getElementById('expperkill');
const expperkillname = document.getElementById('expperkillname');
const avgaa = document.getElementById('averageaa');
const crit = document.getElementById('crit');
const hitrate = document.getElementById('hitrate');
const parry = document.getElementById('parry');
const defense = document.getElementById('defense');
const weaponimg = document.getElementById('weaponimg');
const skill1 = document.getElementById('skill1');
const skill1dmg = document.getElementById('skill1dmg');
const skill2 = document.getElementById('skill2');
const skill2dmg = document.getElementById('skill2dmg');
const skill3 = document.getElementById('skill3');
const skill3dmg = document.getElementById('skill3dmg');
const assistbuffs = document.getElementById('buffs');
const setweapon = document.getElementById('setweapon');
const setarmor = document.getElementById('setarmor');

var activeSkill = document.getElementById('skill0box');
activeSkill.style.boxShadow = '#ffffff1e 0px 0px 20px';
activeSkill.style.border = '1px solid rgba(255, 255, 255, 0.5)';
const skills = [
    document.getElementById('skill1box'),
    document.getElementById('skill2box'),
    document.getElementById('skill3box'),
    document.getElementById('skill0box')        // This is auto attack, default
]

skills.forEach(skill => {
    skill.addEventListener('click', () => {
        if (activeSkill == null) {
            activeSkill = skill;
        } else {
            activeSkill.style.boxShadow = "";
            activeSkill.style.border = "";
            activeSkill = skill;
        }

        skill.style.boxShadow = '#ffffff1e 0px 0px 20px';
        skill.style.border = '1px solid rgba(255, 255, 255, 0.5)';

        update_output(job.value, STR.value, STA.value, DEX.value, INT.value, level.value);
    });
});

function update_output(job, str, sta, dex, int, level) {
    utils.update_job(job);
    const character = utils.character.update_stats(str, sta, int, dex, level, assistbuffs.checked);
    
    update_basics(character);
    update_skills(character);
    
    let skill_index = skills.indexOf(activeSkill);
    if (skill_index >= 3) skill_index = null;
    const monsters = utils.get_monsters_at_level(level, skill_index);
    if (monsters && monsters.length > 0) {
        update_exp_charts(monsters, level);
        update_hits_per_level(monsters, level);
    }

    update_radar_chart(str, sta, dex, int);
}

function update_hits_per_level(monsters, level) {
    var hitreq = []
    var names = []

    monsters.forEach(monster => {
        const expReward = get_exp_reward(monster, level);
        if (expReward > 0 && monster.hp > 0) {
            if (monster.player_damage == 0) {
                console.error(monster.name.en + ' player damage division by 0');
            }

            let hitsperkill = monster.hp / monster.player_damage;
            hitsperkill = hitsperkill < 1 ? 1 : hitsperkill
            const killsperlevel = Math.ceil(parseFloat(100 / expReward));

            hitreq.push((hitsperkill * killsperlevel).toFixed(0));
            names.push('level ' + monster.level + ': ' + monster.name.en);

        }
    });

    var hitperleveloptions = hitsperlevelchart.opts;
    hitperleveloptions.series[0].data = hitreq;
    hitperleveloptions.xaxis.categories = names;

    hitperleveloptions.tooltip.x.formatter = function (val) {
         return names[val - 1];
    };

    hitperleveloptions.xaxis.labels.formatter = function (val) {
        if (val)
            return val.split(' ')[1].slice(0, -1);
    };
    
    hitsperlevelchart.updateOptions(hitperleveloptions);
}

function update_exp_charts(monsters, level) {
    var killreq = []
    var expperhp = []
    var names = []

    var best = null
    monsters.forEach(monster => {
        if (monster.experience > 0) {

            const expReward = get_exp_reward(monster, level);
            if (best == null || expReward > best[1])
                best = [monster.name.en, expReward]

            killreq.push(parseFloat(100 / expReward).toFixed(2));
            // Experience / Health... someone come up with a better way to get 
            // an exp:hp ratio because exp values are like 0.0025 and hp is like
            // 48000, but it varies so much as the levels get higher.
            expperhp.push(parseFloat((expReward / monster.hp) * 100000 || 0).toFixed(3));
            names.push('Level ' + monster.level + ': ' + monster.name.en);
        }
    });

    expperkill.innerText = best[1].toFixed(3) + '%';
    expperkillname.innerText = 'at ' + best[0] + ' (best value)';

    // Average kill per level for each monster
    const killsum = killreq.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
    const killavg = (killsum / killreq.length).toFixed(0) || 0;

    // Average exp per hp for each monster
    const exphpsum = expperhp.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
    const exphpavg = (exphpsum / expperhp.length).toFixed(3) || 0;

    var exphpoptions = exphpchart.opts;
    exphpoptions.series[0].data = expperhp;
    exphpoptions.xaxis.categories = names;
    exphpoptions.annotations.yaxis[0] = {
        y: exphpavg,
        strokeDashArray: 3,
        label: {
          text: 'Average: ' + exphpavg,
          style: {
              color: '#7279AA',
              fontFamily: 'Roboto'
          }
        }
    };

    var expoptions = expchart.opts;
    expoptions.series[0].data = killreq;
    expoptions.xaxis.categories = names;
    expoptions.annotations.yaxis[0] = {
        y: killavg,
        strokeDashArray: 3,
        label: {
          text: 'Average: ' + killavg,
          style: {
              color: '#7279AA',
              fontFamily: 'Roboto'
          }
        }
    };
    
    
    exphpchart.updateOptions(exphpoptions);
    expchart.updateOptions(expoptions);
}

function update_skills(character) {
    const len = Object.keys(character.average_skill_dmg).length;
    if (len >= 1) {
        skill1.innerText = Object.keys(character.average_skill_dmg)[0];
        skill1dmg.innerText = character.average_skill_dmg[skill1.innerText].toFixed(0) - 20;
    }

    if (len >= 2) {
        skill2.innerText = Object.keys(character.average_skill_dmg)[1];
        skill2dmg.innerText = character.average_skill_dmg[skill2.innerText].toFixed(0) - 20;
    }

    if (len >= 3) {
        skill3.innerText = Object.keys(character.average_skill_dmg)[2];
        skill3dmg.innerText = character.average_skill_dmg[skill3.innerText].toFixed(0) - 20;
    }
}

function update_basics(character) {
    weaponimg.src = 'images/' + character.weapon_img;
    STR.value = character.str;
    STA.value = character.sta;
    INT.value = character.int;
    DEX.value = character.dex;
    health.innerText = character.health;
    mp.innerText = character.mp;
    fp.innerText = character.fp;
    attack.innerText = character.attack;
    defense.innerText = character.defense;
    parry.innerText = character.parry + '%';
    hitrate.innerText = character.hitrate + '%';
    crit.innerText = character.critical_chance + '%';
    attackspeed.innerText = character.aspd + '%';
    avgaa.innerText = character.average_aa.toFixed(0) - 20;
    setweapon.innerText = character.weapon ? character.weapon.name.en : 'None';
    setarmor.innerText = character.armor ? character.armor.name.en : 'None';
}

function update_radar_chart(str, sta, dex, int) {
    // TODO: This is temporary... make it better!

    let radaroptions = radarchart.opts;
    radaroptions.series[0].data[3] = sta * 2 < 100 ? sta * 2 : 100;           // Defensive
    radaroptions.series[0].data[0] = (str * dex) / 10 < 100 ? (str * dex) / 10 : 100;  // Auto attack
    radaroptions.series[0].data[2] = (str * int) / 10 < 100 ? (str * int) / 10 : 100;  // Skill

    radarchart.updateOptions(radaroptions);
}

function get_exp_reward(monster, level) {
    for (let value of monster.experienceTable) {
        if (value == monster.experience) {
            // Value is the experience we get at the same level
            let index = monster.experienceTable.indexOf(value);
            let levelDifference = monster.level - level;
            var newIndex = index - levelDifference < 0 ? 0 : index - levelDifference;
            
            return monster.experienceTable[newIndex];
        }
    }
}

export { update_output }