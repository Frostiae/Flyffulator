
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

    let leftHand = false;
    Context.defender.activeBuffs = [];
    let out = [];

    for (let i = 0; i < cycles; i++) {
        Context.skill = null;

        if (Context.attacker.equipment.mainhand.itemProp.subcategory === "wand") {
            Context.attackFlags = Utils.ATTACK_FLAGS.MAGIC;
        } else {
            Context.attackFlags = Utils.ATTACK_FLAGS.GENERIC;
        }

        if (Context.player.jobId === 2246 && Context.player.equipment.offhand != null) {
            leftHand = !leftHand;
        }

        const res = {
            damage: getDamage(leftHand),
            critical: (Context.attackFlags & Utils.ATTACK_FLAGS.CRITICAL) !== 0,
            block: (Context.attackFlags & Utils.ATTACK_FLAGS.BLOCKING) !== 0,
            miss: (Context.attackFlags & Utils.ATTACK_FLAGS.MISS) !== 0,
            parry: (Context.attackFlags & Utils.ATTACK_FLAGS.PARRY) !== 0,
            double: (Context.attackFlags & Utils.ATTACK_FLAGS.DOUBLE) !== 0,
            afterDamageProps: Context.afterDamageProps
        };

        out.push(res);
    }

    self.postMessage(out);
};
