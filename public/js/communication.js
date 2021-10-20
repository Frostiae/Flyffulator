import { Utils } from "./backend/utils.js";
import { expChart, expHPChart, radarchart, hitsPerLevelChart } from "./charts.js";

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
const expPerKill = document.getElementById('expPerKill');
const expPerKillName = document.getElementById('expPerKillName');
const avgaa = document.getElementById('averageaa');
const crit = document.getElementById('crit');
const adoch = document.getElementById('adoch');
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
const statpoints = document.getElementById('statpoints');
const ttkaa = document.getElementById('ttkaa');

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

        updateOutput(job.value, STR.value, STA.value, DEX.value, INT.value, level.value);
    });
});

export function updateOutput(job, str, sta, dex, int, level, assistint) {
    utils.updateJob(job);
    const character = utils.character.updateStats(str, sta, int, dex, level, assistbuffs.checked, assistint);
    
    updateBasics(character);
    updateSkills(character);
    
    let skillIndex = skills.indexOf(activeSkill);
    if (skillIndex >= 3) skillIndex = null;   // Auto attack
    const monsters = utils.getMonstersAtLevel(level, skillIndex);

    const focus = monsters.find(monster => monster.level >= character.level);
    if (focus) {
        const ttk = character.ttkMonster(focus);
        ttkaa.innerText = ttk.auto.toFixed(0) + 's to kill a ' + focus.name.en + ' (approximate)';
    }

    if (monsters && monsters.length > 0) {
        updateExpCharts(monsters, level);
        updateHitsPerLevel(monsters, level);
    }

    updateRadarChart(character);
}

function updateHitsPerLevel(monsters, level) {
    let hitreq = []
    let names = []

    monsters.forEach(monster => {
        const expReward = getExpReward(monster, level);
        if (expReward > 0 && monster.hp > 0) {
            if (monster.player_damage == 0) {
                monster.player_damage = 1;
            }

            let hitsPerKill = monster.hp / monster.player_damage;
            hitsPerKill = hitsPerKill < 1 ? 1 : hitsPerKill
            const killsPerLevel = Math.ceil(parseFloat(100 / expReward));

            hitreq = [...hitreq, (hitsPerKill * killsPerLevel).toFixed(0)];
            names = [...names, 'level ' + monster.level + ': ' + monster.name.en];
        }
    });

    var hitsPerLevelOptions = hitsPerLevelChart.opts;
    hitsPerLevelOptions.series[0].data = hitreq;
    hitsPerLevelOptions.xaxis.categories = names;

    hitsPerLevelOptions.tooltip.x.formatter = function (val) {
         return names[val - 1];
    };

    hitsPerLevelOptions.xaxis.labels.formatter = function (val) {
        if (val)
            return val.split(' ')[1].slice(0, -1);
    };
    
    hitsPerLevelChart.updateOptions(hitsPerLevelOptions);
}

function updateExpCharts(monsters, level) {
    let killreq = []
    let expPerHP = []
    let names = []

    let best = null
    monsters.forEach(monster => {
        if (monster.experience > 0) {

            const expReward = getExpReward(monster, level);
            if (best == null || expReward > best.reward) {
                best = {
                    name: monster.name.en,
                    reward: expReward
                };
            }

            if (expReward > 0) {
                killreq = [...killreq, parseFloat(100 / expReward).toFixed(2)];
                expPerHP = [...expPerHP, parseFloat((expReward / monster.hp) * 100000 || 0).toFixed(3)];
                names = [...names, 'Level ' + monster.level + ': ' + monster.name.en];
            }
        }
    });

    expPerKill.innerText = best.reward.toFixed(3) + '%';
    expPerKillName.innerText = 'at ' + best.name + ' (best value)';

    // Average kill per level for each monster
    const killsum = killreq.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
    const killavg = (killsum / killreq.length).toFixed(0) || 0;

    // Average exp per hp for each monster
    const expHPSum = expPerHP.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
    const expHPAvg = (expHPSum / expPerHP.length).toFixed(3) || 0;

    var expHPOptions = expHPChart.opts;
    expHPOptions.series[0].data = expPerHP;
    expHPOptions.xaxis.categories = names;
    expHPOptions.annotations.yaxis[0] = {
        y: expHPAvg,
        strokeDashArray: 3,
        label: {
          text: 'Average: ' + expHPAvg,
          style: {
              color: '#7279AA',
              fontFamily: 'Roboto'
          }
        }
    };

    var expOptions = expChart.opts;
    expOptions.series[0].data = killreq;
    expOptions.xaxis.categories = names;
    expOptions.annotations.yaxis[0] = {
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
    
    
    expHPChart.updateOptions(expHPOptions);
    expChart.updateOptions(expOptions);
}

function updateSkills(character) {
    const len = Object.keys(character.skillsDamage).length;
    if (len >= 1) {
        skill1.innerText = Object.keys(character.skillsDamage)[0];
        skill1dmg.innerText = character.skillsDamage[skill1.innerText].toFixed(0) - 20;
    }

    if (len >= 2) {
        skill2.innerText = Object.keys(character.skillsDamage)[1];
        skill2dmg.innerText = character.skillsDamage[skill2.innerText].toFixed(0) - 20;
    }

    if (len >= 3) {
        skill3.innerText = Object.keys(character.skillsDamage)[2];
        skill3dmg.innerText = character.skillsDamage[skill3.innerText].toFixed(0) - 20;
    }
}

function updateBasics(character) {
    weaponimg.src = 'images/' + character.weapon_img;
    STR.value = character.str.toFixed(0);
    STA.value = character.sta.toFixed(0);
    INT.value = character.int.toFixed(0);
    DEX.value = character.dex.toFixed(0);
    health.innerText = character.health;
    mp.innerText = character.mp;
    fp.innerText = character.fp;
    attack.innerText = character.attack.toFixed(0);
    defense.innerText = character.defense;
    parry.innerText = character.parry + '%';
    hitrate.innerText = character.hitrate + '%';
    crit.innerText = character.criticalChance + '%';
    adoch.innerText = character.criticalDamage > 0 ? character.criticalDamage + '%' : 'N/A';
    attackspeed.innerText = character.aspd + '%';
    avgaa.innerText = character.averageAA.toFixed(0) - 20;
    setweapon.innerText = character.weapon ? character.weapon.name.en : 'None';
    setarmor.innerText = character.armor ? character.armor.name.en : 'None';
    statpoints.innerText = character.remainingPoints.toFixed(0);
}

function updateRadarChart(character) {
    // TODO: This is temporary... make it better!
    let radarOptions = radarchart.opts;
    radarOptions.series[0].data[3] = character.sta * 2 < 100 ? character.sta * 2 : 100;                                         // Defensive
    radarOptions.series[0].data[0] = (character.str * character.dex) / 10 < 100 ? (character.str * character.dex) / 10 : 100;   // Auto attack
    radarOptions.series[0].data[2] = (character.str * character.int) / 10 < 100 ? (character.str * character.int) / 10 : 100;   // Skill

    radarchart.updateOptions(radarOptions);
}

function getExpReward(monster, level) {
    for (let value of monster.experienceTable) {
        if (value == monster.experience) {
            // Value is the experience we get at the same level
            let index = monster.experienceTable.indexOf(value);
            let levelDifference = monster.level - level;
            let newIndex = index - levelDifference < 0 ? 0 : index - levelDifference;
            
            return monster.experienceTable[newIndex];
        }
    }
}