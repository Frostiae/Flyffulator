/**
 * Vue honestly does not work very well (at least for me right now) with 
 * ApexCharts. We are doing this the old way, but at least its 10x shorter
 * and better than what it was before!
 */

import { expChart, expHPChart, hitsPerLevelChart, radarchart } from "./charts.js";
import { character, monsters, getExpReward } from "./index.js";

// Tooltips
const tooltips = document.getElementsByClassName('info-tooltip');
const activeTooltip = document.getElementsByClassName('tooltip')[0];
const tooltipsArr = Array.prototype.slice.call(tooltips);

tooltipsArr.forEach(tooltip => {
    tooltip.addEventListener("mouseover", (event) => {
        console.log("tooltip");
        let text = tooltip.parentNode.getElementsByTagName("p")[0];
        activeTooltip.getElementsByTagName('h5')[0].innerText = text.innerText;

        activeTooltip.style.left = event.clientX - 330 + 'px';
        activeTooltip.style.top = event.clientY - 100 + 'px';
        activeTooltip.style.display = 'inline';
    });

    tooltip.addEventListener("mouseout", () => {
        activeTooltip.style.display = 'None';
    })
});

// Hooks for updating charts
var buttons = document.getElementsByClassName("btn-plus");
var fields = document.getElementsByClassName("charinput");
var damage = document.getElementsByClassName("extensivebasicdmg");
document.getElementById("buffs").addEventListener("change", updateCharts);
document.getElementById("job").addEventListener("change", updateCharts);

for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", updateCharts);
}

for (let i = 0; i < fields.length; i++) {
    fields[i].addEventListener("change", updateCharts);
}

var activeSkill = damage[0];
activeSkill.style.boxShadow = '#ffffff1e 0px 0px 20px';
activeSkill.style.border = '1px solid rgba(255, 255, 255, 0.5)';

for (let i = 0; i < damage.length; i++) {
    damage[i].addEventListener("click", () => {
        activeSkill.style.boxShadow = "";
        activeSkill.style.border = "";
        activeSkill = damage[i];

        damage[i].style.boxShadow = '#ffffff1e 0px 0px 20px';
        damage[i].style.border = '1px solid rgba(255, 255, 255, 0.5)';
        updateCharts();
    });
}

updateCharts();

function updateCharts() {
    if (monsters && monsters.length > 0) {
        updateExpCharts();
        updateHitsPerLevelChart();
        updateRadarChart();
    }
}

function updateExpCharts() {
    let killreq = []
    let expPerHP = []
    let names = []

    monsters.forEach(monster => {
        if (monster.experience > 0) {
            const expReward = getExpReward(monster, character.level);
            if (expReward > 0) {
                killreq = [...killreq, parseFloat(100 / expReward).toFixed(2)];
                expPerHP = [...expPerHP, parseFloat((expReward / monster.hp) * 100000 || 0).toFixed(3)];
                names = [...names, 'Level ' + monster.level + ': ' + monster.name.en];
            }
        }
    });

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

function updateHitsPerLevelChart() {
    let hitreq = []
    let names = []

    monsters.forEach(monster => {
        const expReward = getExpReward(monster, character.level);
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

function updateRadarChart() {
    // TODO: This is temporary... make it better!
    let radarOptions = radarchart.opts;
    radarOptions.series[0].data[3] = character.sta * 2 < 100 ? character.sta * 2 : 100;                                         // Defensive
    radarOptions.series[0].data[0] = (character.str * character.dex) / 10 < 100 ? (character.str * character.dex) / 10 : 100;   // Auto attack
    radarOptions.series[0].data[2] = (character.str * character.int) / 10 < 100 ? (character.str * character.int) / 10 : 100;   // Skill

    radarchart.updateOptions(radarOptions);
}