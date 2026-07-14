
import Context from '../../../flyff/flyffcontext';
import * as Utils from "../../../flyff/flyffutils";
import Entity from "../../../flyff/flyffentity";
import { getDamage } from '../../../flyff/flyffdamagecalculator';

self.onmessage = function (event) {
    const { context, cycles = 200 } = event.data;

    const player = new Entity(null);
    player.unserialize(context.player);

    const attacker = new Entity(null);
    attacker.unserialize(context.attacker);

    const defender = new Entity(null);
    defender.unserialize(context.defender);

    Context.player = player
    Context.attacker = attacker
    Context.defender = defender
    Context.attackFlags = context.attackFlags
    Context.skill = context.skill
    Context.settings = context.settings
    Context.expSettings = context.expSettings

    let out = [];

    // Dual wield stuff
    let currentAnimation = 0;

    for (let i = 0; i < cycles; i++) {
        Context.skill = null;

        if (Context.attacker.equipment.mainhand.itemProp.subcategory === "wand") {
            Context.attackFlags = Utils.ATTACK_FLAGS.MAGIC;
        } else {
            Context.attackFlags = Utils.ATTACK_FLAGS.GENERIC;
        }

        let handedParam = 0x1;

        if ((Context.player.job.id == 2246 || Context.player.job.id == 35369) && Context.player.equipment.offhand != null) {
            // Left hand and main hand damage behaviour. Yes, bitwise
            // OR is actually what happens in the game, even if it
            // might not make sense...
            if (currentAnimation == 0) {
                handedParam |= 0x1;
            }
            else if (currentAnimation == 1) {
                handedParam |= 0x2;
            }
            else if (currentAnimation == 2) {
                handedParam |= 0x1;
            }
            else {
                handedParam |= 0x3;
            }
        }

        const res = {
            damage: getDamage(handedParam),
            critical: (Context.attackFlags & Utils.ATTACK_FLAGS.CRITICAL) !== 0,
            block: (Context.attackFlags & Utils.ATTACK_FLAGS.BLOCKING) !== 0,
            miss: (Context.attackFlags & Utils.ATTACK_FLAGS.MISS) !== 0,
            parry: (Context.attackFlags & Utils.ATTACK_FLAGS.PARRY) !== 0,
            double: (Context.attackFlags & Utils.ATTACK_FLAGS.DOUBLE) !== 0,
            afterDamageProps: Context.afterDamageProps
        };

        out.push(res);

        currentAnimation = (currentAnimation + 1) % 4;
    }

    self.postMessage(out);
};
