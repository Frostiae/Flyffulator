
import Context from '../../../flyff/flyffcontext';
import * as Utils from "../../../flyff/flyffutils";
import Entity from "../../../flyff/flyffentity";
import { getDamage } from '../../../flyff/flyffdamagecalculator';

self.onmessage = function (event) {
    const { context, cycles = 100 } = event.data;

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

    let data = {};

    for (const [skill, level] of Object.entries(Context.player.skillLevels)) {
        if (level <= 0) {
            continue; // Shouldn't happen
        }

        const skillProp = Utils.getSkillById(skill);

        // TODO: This skips master variations.
        if (skillProp.inheritSkill) {
            continue;
        }

        const levelProp = skillProp.levels[level - 1];

        if (!Context.player.canUseSkill(skillProp)) {
            continue;
        }

        if (levelProp.minAttack == undefined) {
            continue;
        }

        let out = [];
        for (let i = 0; i < cycles; i++) {
            Context.skill = skillProp;
            Context.attackFlags = skillProp.magic ? Utils.ATTACK_FLAGS.MAGICSKILL : Utils.ATTACK_FLAGS.MELEESKILL;

            const res = {
                damage: getDamage(false),
                critical: (Context.attackFlags & Utils.ATTACK_FLAGS.CRITICAL) != 0,
                block: (Context.attackFlags & Utils.ATTACK_FLAGS.BLOCKING) != 0,
                miss: (Context.attackFlags & Utils.ATTACK_FLAGS.MISS) != 0,
                parry: (Context.attackFlags & Utils.ATTACK_FLAGS.PARRY) != 0,
                double: (Context.attackFlags & Utils.ATTACK_FLAGS.DOUBLE) != 0,
                afterDamageProps: Context.afterDamageProps
            }

            out.push(res);
        }

        data[skill] = out;
    }

    delete Context.player.skillLevels[11389];

    self.postMessage(data);
};
