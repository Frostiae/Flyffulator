import Entity from "./flyffentity";
import Context from "./flyffcontext";
import * as Utils from "./flyffutils";

let g_defender = new Entity(null);
let g_monsterProp = null;

export function getExperience(monsterEntity, teammateIndex) {
    if (monsterEntity == null || monsterEntity == undefined) {
        return 0;
    }

    g_defender = monsterEntity
    g_monsterProp = monsterEntity.monsterProp;

    if (g_monsterProp == null || g_monsterProp == undefined) {
        return 0;
    }

    if (g_monsterProp.dummy) {
        return 0;
    }

    if (g_monsterProp.experience <= 0) {
        return 0;
    }

    if (g_monsterProp.experienceTable == undefined) {
        return 0;
    }

    const currentTeammate = Context.expSettings.teammates[teammateIndex];
    if (currentTeammate.level >= g_monsterProp.experienceTable.length) {
        return 0;
    }

    let totalDamage = g_monsterProp.hp; // Total damage the monster took
    const partySize = Context.expSettings.teammates.length;
    const expValue = getBaseExperience(currentTeammate.level) * getSingleTargetFactor();

    let partyHit = 0;
    let currentDamageDone = currentTeammate.totalDamageFactor / 100 * g_monsterProp.hp;
    if (partySize > 1) {
        partyHit = totalDamage; // Total party damage, just equal to the monster's HP
        currentDamageDone = partyHit;
    }

    const userRatio = Utils.clamp(currentDamageDone / totalDamage, 0, 1);
    const expValueUser = expValue * userRatio;
    if (partyHit <= 0) {
        // Player is alone
        return applyExperienceSolo(currentTeammate, expValueUser);
    }

    // Setup party information
    let maxPartyLevel = 0;
    let partyHasMaster = false;

    for (let j = 0; j < partySize; ++j) {
        const partyMember = Context.expSettings.teammates[j];
        maxPartyLevel = Math.max(maxPartyLevel, partyMember.level);

        if (partyMember.master) {
            partyHasMaster = true;
        }
    }

    const defenderLevel = g_defender.level == -1 ? maxPartyLevel : g_defender.level;
    if (defenderLevel >= maxPartyLevel + 16) {
        return 0;
    }

    const maxLevelGap = partyHasMaster ? 9 : 19;
    const minLevel = Math.max(1, maxPartyLevel - maxLevelGap);

    const reductionFactor = getLevelReductionFactor(maxPartyLevel, true);
    const expValueParty = expValueUser * reductionFactor;

    const expBonus = computePartyBonus(minLevel);

    if (Context.expSettings.partySetting == "contribution") {
        return applyExperienceParty(expValueParty * (1 + expBonus.activeBonus), expValueParty * expBonus.memberBonus, minLevel, true, currentTeammate);
    }

    // Level
    return applyExperienceParty(expValueParty * (1 + expBonus.memberBonus + expBonus.activeBonus), 1, minLevel, false, currentTeammate);
}

function getBaseExperience(level) {
    const factor = g_defender.getStat("monsterexp", true) + g_defender.getStat("monsterexpanddrop", true);
    if (factor <= -100) {
        return 0;
    }

    return g_monsterProp.experienceTable[level - 1] * (1.0 + factor * 0.01); // TODO: Probably wrong factor
}

function getSingleTargetFactor() {
    if (!Context.expSettings.singleTargetBonus) {
        return 1.0;
    }

    const minLevel = 30;
    const baseMaxLevel = 120;
    const azriaMaxLevel = 140;
    const coralMaxLevel = 160;
    const minFactor = 1.2;
    const baseMaxFactor = 1.35;
    const coralMaxFactor = 2.025;
    const baseFactor = (baseMaxFactor - minFactor) / (baseMaxLevel - minLevel);
    const coralFactor = (coralMaxFactor - minFactor) / (coralMaxLevel - minLevel);

    const level = g_monsterProp.level;
    if (level < minLevel) {
        return 1.0;
    }

    if (g_monsterProp.rank != "small" && g_monsterProp.rank != "normal" && g_monsterProp.rank != "captain") {
        return 1.0;
    }

    if (level > baseMaxLevel && level <= azriaMaxLevel) {
        return baseMaxFactor;
    }

    if (level > azriaMaxLevel && level <= coralMaxLevel) {
        return minFactor + (level - minLevel) * coralFactor;
    }

    if (level > coralMaxLevel) {
        return coralMaxFactor;
    }

    return minFactor + (level - minLevel) * baseFactor; // lerp
}

function applyExperienceSolo(teammate, expValue) {
    const defenderLevel = g_defender.level == -1 ? Context.player.level : g_defender.level;
    if (defenderLevel >= Context.player.level + 16) {
        return 0;
    }

    expValue *= getLevelReductionFactor(Context.player.level, false);
    // TODO: After death bonus here

    return applyMultipliers(expValue, teammate);
}

function applyExperienceParty(expValue, expValueBonus, minLevel, contribution, teammate) {
    let totalLevelSq = 0;
    let totalContribution = 0;

    for (let teammate of Context.expSettings.teammates) {
        const level = teammate.level; // Real, non-master level regardless of master quest
        totalLevelSq += level * level;
        totalContribution += teammate.contribution;
    }

    if (teammate.level < minLevel) {
        return 0;
    }
    
    const level = teammate.level; // Real, non-master level regardless of master quest
    const levelFactor = (level * level) / totalLevelSq;

    let finalExpValue = 1;
    if (contribution) {
        finalExpValue = expValueBonus * levelFactor;

        if (teammate.contribution > 0) {
            const contributionFactor = teammate.contribution / totalContribution;
            finalExpValue += expValue * contributionFactor;
        }
    }
    else {
        finalExpValue = expValue * levelFactor;
    }

    return applyMultipliers(finalExpValue, teammate);
}

function getLevelReductionFactor(level, party) {
    const defenderLevel = g_defender.level == -1 ? level : g_defender.level;
    const prop = Utils.getLevelDifferencePenalties(level - defenderLevel);

    if (party) {
        return prop.partyExp / 100;
    }

    return prop.soloExp / 100;
}

function computePartyBonus(minLevel) {
    let maxAttack = 0;
    for (let teammate of Context.expSettings.teammates) {
        maxAttack = Math.max(maxAttack, Math.max(1, teammate.totalDamageFactor / 100 * g_monsterProp.hp));
    }

    let memberCount = 0;
    let activeMemberCount = 0;

    // Minimum 25% of damage to be an attacker
    const minAttack = Math.max(maxAttack / 4, 1);
    for (let teammate of Context.expSettings.teammates) {
        // 2/3 for attackers and 1/3 for tankers and healers
        let contribution = 0;
        if (teammate.totalDamageFactor / 100 * g_monsterProp.hp >= minAttack) {
            contribution = 2;
        }
        else if (teammate.totalDamageFactor / 100 * g_monsterProp.hp > 0 || teammate.healer || teammate.tanker) {
            contribution = 1;
        }

        teammate.contribution = contribution;
        if (contribution > 0) {
            activeMemberCount++;
        }

        if (teammate.level >= minLevel) {
            memberCount++;
        }
    }

    const bonus = {
        memberBonus: 0,
        activeBonus: 0
    };

    // 7/5% per member in the area
    if (memberCount > 1) {
        bonus.memberBonus += memberCount * 0.07; // Assuming advanced party, otherwise would be 0.05
    }

    // 25/24% per active member fighting the monster
    if (activeMemberCount > 1) {
        let activeMemberBonus = 0.25; // Advanced party

        if (Context.expSettings.partySetting == "level") {
            activeMemberBonus = 0.13; // Advanced party
        }

        bonus.activeBonus += Math.min(activeMemberCount, 4) * activeMemberBonus;
    }

    return bonus;
}

function applyMultipliers(expValue, teammate) {
    let factor = 1;

    if (teammate.master) {
        factor *= 0.5;
    }

    // Level-based experience limit here
    // This is a very high value just preventing 
    // double/triple level ups from one kill and so on

    const expRate = Context.player.getStat("exprate", true);
    if (expRate > 0) {
        factor *= (100 + expRate) / 100;
    }

    // Cheer
    let cheerRate = 0;
    if (Context.player.activeItems.find((i) => i.itemProp.id == 4401)) { // Gloves of Cheering
        cheerRate = 10;
    }
    else if (teammate.cheered) {
        cheerRate = 5;
    }

    if (cheerRate > 0) {
        factor *= (100 + cheerRate) / 100 * 1; // the 1 is any event influencing cheer factors
    }

    // EXP event and other event factors here
    return expValue * factor * Context.expSettings.multiplier;
}