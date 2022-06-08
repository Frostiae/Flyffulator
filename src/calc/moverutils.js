import { Utils } from "./utils.js";
export default class Moverutils {
    constructor() { }

    static assistBuffs = [
        Utils.getSkillByName('Cannon Ball'),
        Utils.getSkillByName('Beef Up'),
        Utils.getSkillByName('Heap Up'),
        Utils.getSkillByName('Mental Sign'),
        Utils.getSkillByName('Patience'),
        Utils.getSkillByName('Haste'),
        Utils.getSkillByName('Cat\'s Reflex'),
        Utils.getSkillByName('Accuracy'),
        Utils.getSkillByName('Protect'),
        Utils.getSkillByName('Spirit Fortune'),
        Utils.getSkillByName('Holyguard'),
        Utils.getSkillByName('Geburah Tiphreth')
    ];

    static premiumItems = [
        Utils.getItemByName('Grilled Eel'),
        // Utils.getItemByName('Upcut Stone'), // incorrect item. its a scroll type, not buff and has no abilities. api issue
        Utils.getItemByName('Def-Upcut Stone'),
        Utils.getItemByName('Power Scroll'),
        Utils.getItemByName('Charged Power Scroll'),
        Utils.getItemByName('Super Charged Power Scroll'),
        Utils.getItemByName('Flask of the Tiger'),
        Utils.getItemByName('Flask of the Lion'),
        Utils.getItemByName('Flask of the Rabbit'),
        Utils.getItemByName('Flask of the Fox'),
        Utils.getItemByName('Flask of Stone'),
        Utils.getItemByName('Potion of Recklessness'),
        Utils.getItemByName('Potion of Swiftness'),
        Utils.getItemByName('Potion of Clarity'),
        Utils.getItemByName('Elixir of the Sorceror'),
        Utils.getItemByName('Elixir of Anti-Magic'),
        Utils.getItemByName('Elixir of Evasion'),
        Utils.getItemByName('Concoction of Profuse Bleeding'),
        Utils.getItemByName('Green Cotton Candy'),
        Utils.getItemByName('Purple Cotton Candy'),
        Utils.getItemByName('Orange Cotton Candy'),
        Utils.getItemByName('Yellow Cotton Candy'),
        Utils.getItemByName('Red Cotton Candy'),
        Utils.getItemByName('Gray Cotton Candy'),
        Utils.getItemByName('Blue Cotton Candy'),
        Utils.getItemByName('Pink Cotton Candy'),
        Utils.getItemByName('White Cotton Candy'),
        Utils.getItemByName('Sky-Blue Cotton Candy'),
        Utils.getItemByName('Yellow Balloons'),
        Utils.getItemByName('Pink Balloons'),
        Utils.getItemByName('Blue Balloons')
    ];

    static trainingDummy = {
        "defense": 133,
        "sta": 1,
        "levelScales": true,
        "level": 0  // Scales with the attacker's level
    }

    static getDeltaFactor(opponentLevel, selfLevel) {
        var deltaFactor = 1.0;
        var delta = opponentLevel - selfLevel;

        if (delta > 0) {
            const maxOver = 16;
            delta = Math.min(delta, (maxOver - 1));
            let radian = (Math.PI * delta) / (maxOver * 2.0);
            deltaFactor *= Math.cos(radian);
        }

        return deltaFactor;
    }

    static calcMonsterDefense(monster, monsterLevel=0) {
        // TODO: None of this is correct for wand auto attacks specifically (magic auto attacks)
        // Would need to just use opponent.magicDefense / 7 + 1
        var staFactor = 0.75;
        var levelScale = 2.0 / 2.8;
        var statScale = 0.5 / 2.8;
        var level = monsterLevel == 0 ? monster.level : monsterLevel; 
        var armor = monsterLevel == 0 ? monster.defense : this.trainingDummy.defense * monsterLevel / 100;
        
        // dwNaturalArmor / 4
        var equipmentDefense = armor / 4;
        
        var defense = Math.floor(level * levelScale + (monster.sta * statScale + (monster.sta - 14) * 1.0) * staFactor - 4);
        defense += equipmentDefense;

        defense = defense < 0 ? 0 : defense;
        return Math.floor(defense);
    }

    /**
     * Calculate the value to be subtracted from the attacker's attack at the end of damage calculation
     * @param defense defender's defense 
     * @param attack attacker's attack
     */
    static calcDamageDefense(defense, attack) {
        const factor = 2.0;
        var value = 0.0;

        const sum = defense + factor * attack;
        if (defense > 0 && sum > 1.0) {
            value = Math.sqrt(defense / sum);
        }

        const corr = Math.floor(this.lerp(defense, attack, value));
        return corr;
    }

    static lerp(start, end, amt) { return (1 - amt) * start + amt * end; }
}