export default class Moverutils {
    constructor() { }

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

    static calcMonsterDefense(monster, magic=false, monsterLevel=0) {
        var staFactor = 0.75;
        var levelScale = 2.0 / 2.8;
        var statScale = 0.5 / 2.8;
        var level = monsterLevel == 0 ? monster.level : monsterLevel; 
        var armor = monsterLevel == 0 ? monster.defense : this.trainingDummy.defense * monsterLevel / 100;
        var magicArmor = monsterLevel == 0 ? monster.magicDefense : this.trainingDummy.defense * monsterLevel / 100;
        
        // dwNaturalArmor / 4
        var equipmentDefense = !magic ? armor / 4 : magicArmor / 4;
        
        // TODO: This is incorrect for magic skills. Check the universe MDef PvE formula
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