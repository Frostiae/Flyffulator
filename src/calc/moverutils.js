import { Utils } from "./utils.js";
export default class Moverutils {
    constructor() {}

    static trainingDummy = {
        defense: 133,
        sta: 1,
        levelScales: true,
        level: 0, // Scales with the attacker's level
    };

    static AttackType = {
        AUTO_ATTACK: 0,
        MELEE_SKILL: 1,
        MAGIC_SKILL: 2,
        MAGIC_HIT: 3,
    };

    static AttackContext = {
        AC_PVE: "pve",
        AC_PVP: "pvp",
    };

    static Elements = {
        none: 0,
        fire: 1,
        water: 2,
        electricity: 3,
        wind: 4,
        earth: 5,
    };

    static ATTACK_ELEMENT_FACTOR = 10000; // Factor unit for attack element.

    static getDeltaFactor(opponentLevel, selfLevel) {
        var deltaFactor = 1.0;
        var delta = opponentLevel - selfLevel;

        if (delta > 0) {
            const maxOver = 16;
            delta = Math.min(delta, maxOver - 1);
            let radian = (Math.PI * delta) / (maxOver * 2.0);
            deltaFactor *= Math.cos(radian);
        }

        return deltaFactor;
    }

    static calcMonsterDefense(monster, monsterLevel = 0) {
        // TODO: None of this is correct for wand auto attacks specifically (magic auto attacks)
        // Would need to just use opponent.magicDefense / 7 + 1
        var staFactor = 0.75;
        var levelScale = 2.0 / 2.8;
        var statScale = 0.5 / 2.8;
        var level = monsterLevel == 0 ? monster.level : monsterLevel;
        var armor = monsterLevel == 0 ? monster.defense : (this.trainingDummy.defense * monsterLevel) / 100;

        // dwNaturalArmor / 4
        var equipmentDefense = armor / 4;

        var defense = Math.floor(
            level * levelScale + (monster.sta * statScale + (monster.sta - 14) * 1.0) * staFactor - 4
        );
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
}
