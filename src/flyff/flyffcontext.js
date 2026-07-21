import Entity from "./flyffentity";
import Teammate from "./flyffteammate";
import * as Utils from "./flyffutils";

/**
 * Context for all calculations, such as the current player, the target, and more.
 */
export default class Context
{
    static #player = null;
    
    /**
     * The current player.
     */
    static get player() {
        if (!this.#player) this.#player = new Entity(null);
        return this.#player;
    }

    static set player(v) {
        this.#player = v;
    }

    static #attacker = null;

    /**
     * The current attacker, monster or player.
     */
    static get attacker() {
        if (!this.#attacker) this.#attacker = this.player;
        return this.#attacker;
    }

    static set attacker(v) {
        this.#attacker = v;
    }

    static #defender = null;
    
    /**
     * The current defender, monster or player.
     */
    static get defender() {
        if (!this.#defender) this.#defender = new Entity(Utils.TRAINING_DUMMY);
        return this.#defender;
    }

    static set defender(v) {
        this.#defender = v;
    }

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

    /**
     * Warning texts if the current build has calculations that are not yet implemented.
     */
    static unimplementedWarnings = new Set([]);

    /**
     * Settings for experience calculations.
     */
    static expSettings = {
        partySetting: "contribution",
        hasCheer: false,
        singleTargetBonus: false,
        multiplier: 1,
        teammates: [new Teammate(1)],
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