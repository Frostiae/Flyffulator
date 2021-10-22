import { Utils } from "./backend/utils.js";

const utils = new Utils();
// We need these global for the charts. Vue3 and ApexCharts are 
// not so friendly so we are updating the charts the old way
// for now through chartManager.js
export var character = utils.character.update();
export var monsters = utils.getMonstersAtLevel(character.level);

const app = Vue.createApp({
    data() {
        return { 
            character: character,
            monsters: monsters,
            skillIndex: null
        };
    },
    methods: {
        updateJob(e) {
            if (utils.updateJob(e.target.value)) {
                this.character = utils.character.update();
                this.updateCharacter();
            }
        },
        updateCharacter() {
            validateInput(this.character);
            this.character.update();
            character = this.character;
            this.monsters = utils.getMonstersAtLevel(this.character.level, this.skillIndex);
            monsters = this.monsters;
        },
        updateMonsters(skillIndex) {
            if (skillIndex == -1) {
                this.monsters = utils.getMonstersAtLevel(this.character.level, null);
                this.skillIndex = null;
            } else {
                this.monsters = utils.getMonstersAtLevel(this.character.level, skillIndex);
                this.skillIndex = skillIndex;
            }

            monsters = this.monsters;
        }
    },
    watch: {
        'character.level'() {
            this.updateCharacter();
        },
        'character.str'() {
            this.updateCharacter();
        },
        'character.sta'() {
            this.updateCharacter();
        },
        'character.dex'() {
            this.updateCharacter();
        },
        'character.int'() {
            this.updateCharacter();
        },
        'character.assistInt'() {
            this.updateCharacter();
        }
    }
});


app.component('exp-per-kill', {
    data() {
        return {
            reward: 0,
            name: 'none'
        }
    },
    props: ['title'],
    methods: {
        getBestExp() {
            const monsters = this.$parent.monsters;
            let best = null
            monsters.forEach(monster => {
                if (monster.experience > 0) {
                    const expReward = getExpReward(monster, this.$parent.character.level);
                    if (best == null || expReward > best.reward) {
                        best = {
                            name: monster.name.en,
                            reward: expReward
                        };
                    }
                }
            });

            if (best) {
                this.reward = best.reward;
                this.name = best.name;
            }
        }
    },
    created() { this.getBestExp(); },
    watch: {
        '$parent.monsters'() { this.getBestExp(); }
    },
    template: `
    <div class="extensivebasic">
        <h3>{{ title }}</h3>
        <p id="expPerKill">{{ reward.toFixed(3) }}%</p>
        <h5 id="expPerKillName">at {{ name }} (best value)</h5>
    </div>
    `
});

app.component('char-damage', {
    props: ['title', 'skillindex'],
    data() {
        return {
            skill: 'none',
            damage: 0,
            ttk: 0,
            monster: 'none'
        }
    },
    methods: {
        getDamage() {
            this.index = this.skillindex;
            const monsters = this.$parent.monsters;
            let focus = monsters.find(monster => monster.level >= this.$parent.character.level);
            if (focus) {
                this.monster = focus.name.en;
                
                if (this.skillindex == -1) {
                    this.damage = this.$parent.character.averageAA.toFixed(0);  
                    this.ttk = this.$parent.character.ttkMonster(focus).auto.toFixed(0) + 's to kill a ' + this.monster + ' (approximate)';
                } else {
                    this.skill = Object.keys(this.$parent.character.skillsDamage)[this.skillindex];
                    if (this.skill) {
                        this.damage = this.$parent.character.skillsDamage[this.skill].toFixed(0) - 20;
                    } else this.skill = "None"
    
                    // TODO: change this to react to the return value of character.ttkMonster
                    this.ttk = "ttk: N/A"
                }
            }

        }
    },
    created() { this.getDamage(); },
    watch: {
        '$parent.character.averageAA'() { this.getDamage(); },
        '$parent.character.skillsDamage'() { this.getDamage(); }
    },
    template: `
    <div class="extensivebasicdmg">
        <h3>{{ title == "N/A" ? skill : title }}</h3>
        <p>{{ damage }}</p>
        <h5>against a Training Dummy</h5>
        <h5>{{ ttk }}</h5>
    </div>
    `
});

const vm = app.mount('#app');

export function getExpReward(monster, level) {
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

function validateInput(character) {
    character.level = character.level < 1 ? 1 : character.level;
    character.str = character.str < 1 ? 1 : character.str;
    character.sta = character.sta < 1 ? 1 : character.sta;
    character.dex = character.dex < 1 ? 1 : character.dex;
    character.int = character.int < 1 ? 1 : character.int;
    character.assistInt = character.assistInt < 1 ? 1 : character.assistInt;
}
