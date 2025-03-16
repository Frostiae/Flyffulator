import Entity from "./flyffentity";
import * as Utils from "./flyffutils";

/**
 * Context for all calculations, such as the current player, the target, and more.
 */
export default class Context
{
    /**
     * The current player.
     */
    static player = new Entity(null);

    /**
     * The current attacker, monster or player.
     */
    static attacker = this.player;

    /**
     * The current defender, monster or player.
     */
    static defender = new Entity(Utils.TRAINING_DUMMY);

    /**
     * The current attack's bitwise flags.
     */
    static attackFlags = Utils.ATTACK_FLAGS.GENERIC;

    /**
     * Properties and generic information set about the previous attack, such as lifesteal amount.
     */
    static afterDamageProps = {};

    /**
     * The current skill property being used to attack, or null if it's an auto attack.
     */
    static skill = null;

    /**
     * Generic multipurpose settings for the current context.
     */
    static settings = {
        swordcrossEnabled: true,
        waterbombEnabled: true,
        lifestealEnabled: true,
        missingEnabled: true,
        blockingEnabled: true,
        partyLeaderEnabled: true,
        playerHealthPercent: 100,
        targetHealthPercent: 100,
        achievementAttackBonus: 0
    };

    static isPVP() {
        return this.defender.isPlayer() && this.attacker.isPlayer();
    }

    static isPVE() {
        return !(this.isPVP());
    }

    static isSkillAttack() {
        return this.attackFlags & Utils.ATTACK_FLAGS.MELEESKILL || this.attackFlags & Utils.ATTACK_FLAGS.MAGICSKILL;
    }
}