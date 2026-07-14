
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
        if (skillProp == null) {
            continue;
        }

        // Master variations are leveled like skills. A base skill whose variation
        // is active is skipped here (the variation is calculated from its own
        // skillLevels entry instead), so the chosen variation replaces the base.
        if (!skillProp.inheritSkill) {
            if (!Context.player.canUseSkill(skillProp)) {
                continue;
            }

            const activeVariation = (skillProp.masterVariations ?? []).find(id => Context.player.skillLevels[id] > 0);
            if (activeVariation) {
                continue;
            }
        }

        const levelProp = skillProp.levels[level - 1];

        if (levelProp == null || levelProp.minAttack == undefined) {
            continue;
        }

        let out = [];
        for (let i = 0; i < cycles; i++) {
            Context.skill = skillProp;
            Context.attackFlags = skillProp.magic ? Utils.ATTACK_FLAGS.MAGICSKILL : Utils.ATTACK_FLAGS.MELEESKILL;

            const res = {
                damage: getDamage(0x1),
                critical: (Context.attackFlags & Utils.ATTACK_FLAGS.CRITICAL) != 0,
                block: (Context.attackFlags & Utils.ATTACK_FLAGS.BLOCKING) != 0,
                miss: (Context.attackFlags & Utils.ATTACK_FLAGS.MISS) != 0,
                parry: (Context.attackFlags & Utils.ATTACK_FLAGS.PARRY) != 0,
                double: (Context.attackFlags & Utils.ATTACK_FLAGS.DOUBLE) != 0,
                afterDamageProps: Context.afterDamageProps
            }

            out.push(res);
        }

        // Key by the calculated skill (base or chosen variation) so the chart
        // shows the correct name.
        data[skillProp.id] = out;
    }

    delete Context.player.skillLevels[11389];

    self.postMessage(data);
};
