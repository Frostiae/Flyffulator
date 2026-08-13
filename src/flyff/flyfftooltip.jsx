import Skill from "./flyffskill";
import Context from "../flyff/flyffcontext";
import * as Utils from "../flyff/flyffutils";
import ItemElem from "../flyff/flyffitemelem";

/**
 * Create a tooltip for the given item or skill
 * @param {object} content The item or skill
 * @param {object} i18n Localization
 * @returns a JSX element conatining the tooltip
 */
export function createTooltip(content, i18n) {
    if (content instanceof ItemElem) {
        return setupItem(content, i18n);
    }
    else if (content.passive != undefined) {
        return setupSkill(new Skill(content, 1), i18n);
    }
    else if (content instanceof Skill) {
        return setupSkill(content, i18n);
    }
    else if (content.consumedPoints != undefined) {
        return setupPartySkill(content, i18n);
    }
    else {
        return setupHousingNpc(content, i18n);
    }
}

/**
 * Get the tooltip text for the given item
 * @param {ItemElem} itemElem The item elem
 * @param {object} i18n Localization
 */
function setupItem(itemElem, i18n) {
    const out = [];
    const itemProp = itemElem.itemProp;
    var shortLanguageCode = "en";
    if (i18n.resolvedLanguage) {
        shortLanguageCode = i18n.resolvedLanguage.split('-')[0];
    }

    const isUltimate = itemProp.rarity == "ultimate";

    if (isUltimate) {
        out.push(<img src="/ultimate-icon.png" style={{ height: "18px" }} className="rainbow-background"></img>);
    }

    // Ultimate jewels

    for (let i = 0; i < itemElem.getMaximumUltimateJewelSlots(); ++i) {
        if (i < itemElem.ultimateJewels.length) {
            out.push(<img src={`https://api.flyff.com/image/item/${itemElem.ultimateJewels[i].itemProp.icon}`} style={{ height: "18px", marginLeft: 3 }} className="rainbow-image"></img>);
        }
        else {
            out.push(<img src={`https://api.flyff.com/image/item/placeholderjewel.png`} style={{ height: "18px", marginLeft: 3 }}></img>);
        }
    }

    // Name

    if (isUltimate) {
        out.push(<br />); // Line break for all the ultimate tag and jewels
    }

    const statAwakeString = Utils.getStatAwakeTitle(itemElem, i18n);

    out.push(<span style={{
        fontWeight: 700,
        color: Utils.getItemNameColor(itemProp)
    }}>{itemProp.name[shortLanguageCode] ?? itemProp.name.en} {statAwakeString}</span>);

    // TODO: Origin awakes (STA+, etc.)

    if (itemElem.upgradeLevel > 0) {
        out.push(<span style={{ color: Utils.getItemNameColor(itemProp), fontWeight: 700 }}> +{itemElem.upgradeLevel}</span>);
    }

    if (itemElem.piercings.length > 0) {
        out.push(<span style={{ color: "#d386ff" }}> ({itemElem.piercings.length}/{itemElem.piercings.length})</span>)
    }

    // TODO: Lifestyle stuff

    // Pets

    if (itemProp.category == "raisedpet") {
        out.push("\n[Raised Pet]");
    }
    else if (itemProp.category == "pickuppet") {
        out.push("\n[Pick-Up Pet]");
    }
    else if (itemProp.category == "weapon") {
        if (itemProp.twoHanded) {
            out.push(`\n${i18n.t("tooltip_two_handed")}`)
        }
        else {
            out.push(`\n${i18n.t("tooltip_one_handed")}`)
        }
    }

    // Sex

    if (itemProp.sex == "male") {
        out.push(`\n${i18n.t("tooltip_sex_male")}`);
    }
    else if (itemProp.sex == "female") {
        out.push(`\n${i18n.t("tooltip_sex_female")}`);
    }

    // Attack & Defense

    let baseAbility = {};
    let isAttack = false;
    if (itemProp.minAttack != undefined && itemProp.maxAttack != undefined) {
        baseAbility.min = itemProp.minAttack + Context.player.getStat("minability", false);
        baseAbility.max = itemProp.maxAttack + Context.player.getStat("maxability", false);
        isAttack = true;
    }
    else if (itemProp.minDefense != undefined && itemProp.maxDefense != undefined) {
        baseAbility.min = itemProp.minDefense + Context.player.getStat("minability", false);
        baseAbility.max = itemProp.maxDefense + Context.player.getStat("maxability", false);
    }

    if (baseAbility.min != undefined) {
        const mul = itemElem.getUpgradeMultiplier();
        let add = 0;
        const upgradeLevel = itemElem.upgradeLevel + (itemProp.rarity == "ultimate" ? 10 : 0);
        if (upgradeLevel > 0) {
            add = Math.floor(Math.pow(upgradeLevel, 1.5));
        }

        const ability = {
            min: Math.floor(baseAbility.min * mul) + add,
            max: Math.floor(baseAbility.max * mul) + add
        };

        const baseStyle = { color: "#ffffff" };
        if (mul > 1.0) {
            baseStyle.color = "#00ffe1";
        }
        else if (mul == 1) {
            baseStyle.color = "inherit";
        }
        else if (mul >= 0.8) {
            baseStyle.color = "#00ff00";
        }
        else if (mul >= 0.6) {
            baseStyle.color = "#ff0000";
        }
        else {
            baseStyle.color = "#b2b2b2";
        }

        if (isAttack) {
            out.push(`\n${i18n.t("tooltip_attack")}`);
        }
        else {
            out.push(`\n${i18n.t("tooltip_defense")}`);
        }

        out.push(<span style={baseStyle}>{ability.min} ~ {ability.max}</span>);

        if (baseAbility.min != ability.min || baseAbility.max != ability.max) {
            if (isAttack) {
                out.push(`\nBase Attack: `);
            }
            else {
                out.push(`\nBase Defense: `);
            }

            out.push(<span style={{ color: "#b2b2b2" }}>{ability.min} ~ {ability.max}</span>);
        }
    }

    // Blessings

    if (itemProp.category == "fashion") {
        const hasBlessing = itemElem.randomStats.find((e) => e);

        if (hasBlessing) {
            out.push(<span style={{ color: "#d386ff" }}><br />{i18n.t("tooltip_blessing")}</span>);
        }

        for (const blessing of itemElem.randomStats) {
            if (blessing) {
                out.push(<span style={{ color: "#d386ff" }}><br />{Utils.getStatNameByIdOrDefault(blessing.parameter, i18n)}+{blessing.value}{blessing.rate ? "%" : ""}</span>);
            }
        }
    }

    if (itemProp.attackSpeed != undefined) {
        out.push(`\n${i18n.t("tooltip_attack_speed")}${itemProp.attackSpeed}`);
    }

    // Element

    if (itemElem.element != "none" && itemElem.elementUpgradeLevel > 0) {
        out.push(<span style={{ fontWeight: itemElem.hasElementStone ? 800 : 'inherit' }}><br />{itemElem.element}+{itemElem.elementUpgradeLevel}</span>);
    }
    if (itemProp.element != "none") {
        out.push(`\n${i18n.t("tooltip_element")}${itemProp.element}`);
    }

    // Stats

    if (itemProp.category != "recovery"
        && itemProp.category != "trans"
        && itemProp.category != "buff"
        && itemProp.category != "scroll"
        && itemProp.abilities != undefined) {
        const abilityStyle = { color: "#ffeaa1" };

        if (itemElem.statRanges.length == 0) {
            for (const ability of itemProp.abilities) {
                out.push(<span style={abilityStyle}><br />{Utils.getStatNameByIdOrDefault(ability.parameter, i18n)}+{ability.add}</span>);
                if (ability.rate) {
                    out.push(<span style={abilityStyle}>%</span>);
                }
            }
        }
        else {
            for (const ability of itemElem.statRanges) {
                out.push(<span style={abilityStyle}><br />{Utils.getStatNameByIdOrDefault(ability.parameter, i18n)}+{ability.value}</span>);
                if (ability.rate) {
                    out.push(<span style={abilityStyle}>%</span>);
                }

                out.push(<span style={abilityStyle}> ({ability.add}~{ability.addMax})</span>);

                if (ability.rate) {
                    out.push(<span style={abilityStyle}>%</span>);
                }
            }
        }
    }

    // Ultimate stats

    if (itemProp.possibleRandomStats != undefined) {
        for (let i = 0; i < itemElem.randomStats.length; i++) {
            const stat = itemElem.randomStats[i];
            const color = i < 2 ? "#ffff00" : "#ff9900";
            out.push(<span style={{ color }}><br />{Utils.getStatNameByIdOrDefault(stat.parameter, i18n)}+{stat.value}{stat.rate ? "%" : ""}</span>);
        }
    }

    for (const statAwake of itemElem.statAwake) {
        if (statAwake != null) {
            out.push(`\n${Utils.getStatNameByIdOrDefault(statAwake.parameter, i18n)} +${statAwake.value}`);
        }
    }

    // Jewelery stats

    if (itemProp.category == "jewelry" && itemProp.upgradeLevels != undefined) {
        const abilityStyle = { color: "#ffeaa1" };
        for (const ability of itemProp.upgradeLevels[itemElem.upgradeLevel].abilities) {
            out.push(<span style={abilityStyle}><br />{Utils.getStatNameByIdOrDefault(ability.parameter, i18n)}+{ability.add}</span>);
            if (ability.rate) {
                out.push(<span style={abilityStyle}>%</span>);
            }
        }
    }

    // TODO: itemElem origin awake here

    // Armor set upgrade

    if (itemProp.category == "armor") {
        const upgradeLevel = Context.player.getArmorSetUpgradeLevel();
        if (upgradeLevel > 0) {
            const bonus = Utils.getUpgradeBonus(upgradeLevel);
            for (const ability of bonus.setAbilities) {
                out.push(<span><br />{Utils.getStatNameByIdOrDefault(ability.parameter, i18n)}+{ability.add}</span>);
                if (ability.rate) {
                    out.push(<span>%</span>);
                }
            }
        }
    }

    // Medicine

    if (itemProp.category == "recovery" && itemProp.abilities != undefined) {
        for (const ability of itemProp.abilities) {
            switch (ability.parameter) {
                case "fp":
                    out.push(`\n${i18n.t("tooltip_restore_fp")}${ability.add}`);
                    break;
                case "mp":
                    out.push(`\n${i18n.t("tooltip_restore_mp")}${ability.add}`);
                    break;
                default:
                    out.push(`\n${i18n.t("tooltip_restore_hp")}${ability.add}`);
                    break;
            }
        }

        // TODO: Effective restoration. Not included in API
    }

    // Couple

    if (itemProp.subcategory == "couplering") {
        const style = { color: "#d386ff" };
        if (itemProp.coupleTeleports != undefined && itemProp.coupleTeleports > 0) {
            out.push(<span style={style}><br />Teleports: {itemProp.coupleTeleports}</span>);
        }
        if (itemProp.coupleCheers != undefined && itemProp.coupleCheers > 0) {
            out.push(<span style={style}><br />Cheers: {itemProp.coupleCheers}</span>);
        }
        if (itemProp.coupleBankSlots != undefined && itemProp.coupleBankSlots > 0) {
            out.push(<span style={style}><br />Storage slots: {itemProp.coupleBankSlots}</span>);
        }
    }

    // Job

    if (itemProp.class != undefined) {
        const job = Utils.getClassById(itemProp.class);
        if (job != undefined) {
            out.push(`\n${i18n.t("tooltip_required_job")}${job.name[shortLanguageCode] ?? job.name.en}`);
        }
    }

    // Level

    if (itemProp.level != undefined && itemProp.level > 1) {
        out.push(`\n${i18n.t("tooltip_required_level")}${itemProp.level}`);
        let levelsBelowRequirement = itemProp.level - Context.player.level;
        if (levelsBelowRequirement >= 1 && levelsBelowRequirement <= 5) {
            out.push(<span style={{ color: "#ff0000" }}> (-5)</span>);
        }
        else if (levelsBelowRequirement >= 6 && levelsBelowRequirement <= 10) {
            out.push(<span style={{ color: "#ff0000" }}> (-10)</span>);
        }
    }

    // Required material item level

    if (itemProp.category == "material" && itemProp.minimumTargetItemLevel != undefined) {
        out.push(<span style={{ color: "#9e9e9e" }}><br />Required Target Level: {itemProp.minimumTargetItemLevel}</span>);
    }

    // TODO: itemElem pet stuff
    if (itemProp.category == "raisedpet") {
        const pet = itemElem;
        const petDefinition = Utils.getPetDefinitionByItemId(pet.itemProp.id)

        out.push(<span style={{ color: '#009e00' }}><br />Tier: {Utils.getPetTierByLevels(pet.petStats)} Tier</span>)
        out.push(<span style={{ color: '#ff0000' }}><br />Bonus: {`${Utils.getStatNameByIdOrDefault(petDefinition.parameter, i18n)} +${Utils.getPetStatSum(petDefinition, pet.petStats)}${petDefinition.rate ? '%' : ''}`}</span>)
        out.push(<span style={{ color: '#007fff' }}><br />({Object.values(pet.petStats).map((lv) => lv ? `Lv${lv}` : null).filter(_ => _).join('/')})</span>)

        out.push(<span style={{ color: '#7878dc' }}><br />Exp: 99.99%</span>)

        const petTier = Object.values(pet.petStats).filter((tier) => tier != null).length;
        out.push(<span style={{ color: '#ff0a0a' }}><br />Energy: {petDefinition.tiers[petTier - 1].maxEnergy} / {petDefinition.tiers[petTier - 1].maxEnergy}</span>)
    }

    // Rarity

    out.push(`\n${i18n.t("tooltip_rarity")}`);
    out.push(<span style={{ color: Utils.getItemNameColor(itemProp) }}>{itemProp.rarity}</span>);

    // Description

    if (itemProp.description.en != "null") {
        if (itemProp.category == "raisedpet") {
            out.push(<span style={{ color: "#d386ff" }}><br />{itemProp.description[shortLanguageCode] ?? itemProp.description.en}</span>);
        }
        else {
            out.push(`\n${i18n.t("tooltip_description")}${itemProp.description[shortLanguageCode] ?? itemProp.description.en}`);
        }
    }

    if (itemProp.subcategory == "visualcloak") {
        out.push("\nCan be worn over another cloak.");
    }

    // Buff items

    if (itemProp.category == "buff") {
        for (const ability of itemProp.abilities) {
            out.push(<span style={{ color: "#ffeaa1" }}><br />{Utils.getStatNameByIdOrDefault(ability.parameter, i18n)}+{ability.add}{ability.rate && "%"}</span>);
        }
    }

    // Cooldown

    if (itemProp.cooldown != undefined) {
        out.push(`\nCooldown: ${itemProp.cooldown} seconds`);
    }

    // Equip sets

    if (itemProp.category == "armor" || itemProp.category == "jewelry") {
        const set = Utils.getEquipSetByItemId(itemProp.id);
        if (set != null) {
            const equippedCount = Context.player.getEquipSetPieceCountByItem(itemProp);
            out.push(`\n\n${set.name[shortLanguageCode] ?? set.name.en} (${equippedCount}/${set.parts.length})`);

            for (const part of set.parts) {
                const item = Utils.getItemById(part);
                if (item != undefined) {
                    out.push(<span style={{ color: "#01ab19" }}><br />    {item.name[shortLanguageCode] ?? item.name.en}</span>);
                }
            }

            const bonusStyle = { color: "#ff9d00" };
            const bonuses = {};

            // Accumulate all bonuses first then emit their sum
            for (const bonus of set.bonus) {
                if (bonus.equipped > equippedCount) {
                    continue;
                }

                const bonusKey = `${Utils.getStatNameByIdOrDefault(bonus.ability.parameter, i18n)}.${bonus.ability.rate ? 'Y' : 'N'}`;

                if (bonuses[bonusKey] == undefined) {
                    bonuses[bonusKey] = bonus.ability.add;
                }
                else {
                    bonuses[bonusKey] += bonus.ability.add;
                }
            }

            for (const [key, bonus] of Object.entries(bonuses)) {
                const [parameter, rateString] = key.split('.');
                const rate = rateString === 'Y';

                out.push(<span style={bonusStyle}><br />Set Effect: {Utils.getStatNameByIdOrDefault(parameter, i18n)} +{bonus}</span>);
                if (rate) {
                    out.push(<span style={bonusStyle}>%</span>);
                }
            }
        }
    }

    // Skill awakes

    if (itemElem.skillAwake != null) {
        if (itemElem.skillAwake.skill != undefined) {
            const skill = Utils.getSkillById(itemElem.skillAwake.skill);
            out.push(<span style={{ color: "#ff007b" }}><br />{skill.name[shortLanguageCode] ?? skill.name.en} damage+{itemElem.skillAwake.add}%</span>)
        }
        else if (itemElem.skillAwake.parameter != undefined) {
            out.push(<span style={{ color: "#ff007b" }}><br />{Utils.getStatNameByIdOrDefault(itemElem.skillAwake.parameter, i18n)}+{itemElem.skillAwake.add}%</span>)
        }
    }

    // Piercings

    // Collect bonuses
    const piercingBonuses = {};
    for (const card of itemElem.piercings) {
        if (card == null || card.itemProp.abilities == undefined) {
            continue;
        }

        for (const ability of card.itemProp.abilities) {
            if (ability.parameter in piercingBonuses) {
                piercingBonuses[ability.parameter].add += ability.add;
            } else {
                piercingBonuses[ability.parameter] = { ...ability };
            }
        }
    }

    for (const [parameter, effect] of Object.entries(piercingBonuses)) {
        out.push(<span style={{ color: "#d386ff" }}><br />{Utils.getStatNameByIdOrDefault(parameter, i18n)}+{effect.add}{effect.rate && "%"}</span>);
    }

    // Ultimate jewels
    const ultimateJewelBonuses = {};
    for (const jewel of itemElem.ultimateJewels) {
        for (const ability of jewel.itemProp.abilities) {
            const paramKey = ability.parameter + ability.rate;
            if (paramKey in ultimateJewelBonuses) {
                ultimateJewelBonuses[paramKey].add += ability.add;
            } else {
                ultimateJewelBonuses[paramKey] = { ...ability };
            }
        }
    }

    for (const [parameter, effect] of Object.entries(ultimateJewelBonuses)) {
        out.push(<span style={{ color: "#00c8ff" }}><br />{Utils.getStatNameByIdOrDefault(effect.parameter, i18n)}+{effect.add}{effect.rate && "%"}</span>);
    }

    return (<div>{out.map((v, i) => <span key={i}>{v}</span>)}</div>);
}

/**
 * Get the tooltip text for the given skill
 * @param {Skill} skill The skill instance
 * @param {I18n} i18n Localization
 */
function setupSkill(skill, i18n) {
    const out = [];
    const skillProp = skill.skillProp;
    var shortLanguageCode = "en";
    if (i18n.resolvedLanguage) {
        shortLanguageCode = i18n.resolvedLanguage.split('-')[0];
    }

    const skillLevel = skill.level;
    let levelProp = skill.levelProp;

    out.push(<span style={{ color: "#2fbe6d", fontWeight: 600 }}>{skillProp.name[shortLanguageCode] ?? skillProp.name.en}</span>);
    if (skillLevel != undefined) {
        out.push(`  Lv. ${skillLevel}`);
    }

    let weaponIcon;
    if (skillProp.weapon != undefined) {
        switch (skillProp.weapon) {
            case "knuckle":
                weaponIcon = "weaknuspeck.png";
                break;
            case "sword":
                weaponIcon = "weaswostar.png";
                break;
            case "axe":
                weaponIcon = "weaaxekarm.png";
                break;
            case "stick":
                weaponIcon = "weachemay.png";
                break;
            case "wand":
                weaponIcon = "weawanusu.png";
                break;
            case "staff":
                weaponIcon = "weastawiz.png";
                break;
            case "yoyo":
                weaponIcon = "weayoyiron.png";
                break;
            case "bow":
                weaponIcon = "weabowgreen.png";
                break;
            case "shield":
                weaponIcon = "armshiguard.png";
                break;
        }
    }

    // TODO: No way to identify trap skills on API yet

    if (weaponIcon) {
        out.push(<img src={`https://api.flyff.com/image/item/${weaponIcon}`} style={{ height: "18px", float: "right" }} className="skill-weapon-image"></img>);
    }

    if (skillProp.debuffType != undefined) {
        out.push(`\n(${skillProp.debuffType})`);
    }

    let masterSkillPropOrBase = skillProp;
    for (const masterVariation of skillProp.masterVariations ?? []) {
        const masterLevel = Context.player.skillLevels[masterVariation] ?? 0;
        if (masterLevel > 0) {
            masterSkillPropOrBase = Utils.getSkillById(masterVariation);
            levelProp = masterSkillPropOrBase.levels[masterLevel - 1];
            break;
        }
    }

    //
    // Requirements Section
    //

    if (levelProp.consumedMP != undefined) {
        out.push(`\nMP: ${levelProp.consumedMP}`);
    }

    if (levelProp.consumedFP != undefined) {
        out.push(`\nFP: ${levelProp.consumedFP}`);
    }

    if (levelProp.requiredHPThresholdRate != undefined) {
        if (levelProp.requiredHPThresholdRate > 0) {
            out.push(`\nHP Threshold: ${levelProp.requiredHPThresholdRate}%`);
        }
        else {
            out.push(`\nHP Threshold: Below ${levelProp.requiredHPThresholdRate}%`);
        }
    }

    if (levelProp.consumedMaxHPRate != undefined) {
        out.push(`\nHP: ${Context.player.getHP() * (levelProp.consumedMaxHPRate / 100)} (${levelProp.consumedMaxHPRate}%)`);
    }
    else if (levelProp.consumedCurrentHPRate != undefined) {
        // Same but it's just using the current HP in reality
        out.push(`\nHP: ${Context.player.getHP() * (levelProp.consumedCurrentHPRate / 100)} (${levelProp.consumedCurrentHPRate}%)`);
    }

    if (levelProp.consumedSkillStacks != undefined) {
        const requiredStackSkillProp = Utils.getSkillById(levelProp.consumedSkillStacks.skill);
        out.push(`\n${requiredStackSkillProp.name[shortLanguageCode]} Stacks: ${levelProp.consumedSkillStacks.count}`);

        if (levelProp.consumedSkillStacks.probability != undefined) {
            out.push(` (${levelProp.consumedSkillStacks.probability}%)`);
        }
    }

    out.push(<hr />);

    let hasRequirements = false;
    for (const requirement of skillProp.requirements) {
        const req = Utils.getSkillById(requirement.skill);
        const playerLevel = Context.player.skillLevels[requirement.skill];

        if (playerLevel == undefined || playerLevel < requirement.level) {
            out.push(<span style={{ color: "#ff0000" }}><br />{req.name[shortLanguageCode] ?? req.name.en} skill level {requirement.level} is needed.</span>);
            hasRequirements = true;
        }
    }

    if (Context.player.level < skillProp.level) {
        out.push(<span style={{ color: "#ff0000" }}><br />Character Level: {skillProp.level}</span>);
        hasRequirements = true;
    }

    if (hasRequirements) {
        out.push(<hr />);
    }

    //
    // Properties Section
    //

    if (skillProp.element != "none") {
        out.push(`\nElement: ${skillProp.element}`);
    }

    const statsStyle = { fontWeight: 800 };

    // Attack
    if (levelProp.maxAttack != undefined && levelProp.maxAttack > 0) {
        out.push(<span style={statsStyle}><br />Base Damage: {levelProp.minAttack} ~ {levelProp.maxAttack}</span>);
    }

    if (levelProp.damageMultiplier != undefined) {
        out.push(<span style={statsStyle}><br />Damage Multiplier: {levelProp.damageMultiplier[0].multiplier}</span>);
    }

    // TODO: Scales for pvp vs pve?

    if (levelProp.scalingParameters != undefined) {
        for (const scale of levelProp.scalingParameters) {
            if (scale.parameter == "attack" && scale.maximum == undefined) {
                let stat = "";
                if (scale.stat != undefined) {
                    stat = Utils.getStatNameByIdOrDefault(scale.stat, i18n);
                }
                else if (scale.part != undefined) {
                    switch (scale.part) {
                        case "lefthandweapon":
                            stat = "Left Hand Weapon Attack";
                            break;
                        case "righthandweapon":
                            stat = "Right Hand Weapon Attack";
                            break;
                        case "shield":
                            stat = "Shield Defense";
                            break;
                    }
                }
                out.push(<span style={statsStyle}><br />Attack Scaling: {stat} x {scale.scale}</span>);
            }
        }
    }

    // Heal
    if (levelProp.abilities != undefined) {
        for (const ability of levelProp.abilities) {
            if (ability.parameter == "hp") {
                out.push(<span style={statsStyle}><br />Base Heal: {ability.add}</span>);
                break;
            }
        }
    }

    if (levelProp.scalingParameters != undefined) {
        for (const scale of levelProp.scalingParameters) {
            if (scale.parameter == "hp") {
                let stat = "";
                if (scale.stat != undefined) {
                    stat = Utils.getStatNameByIdOrDefault(scale.stat, i18n);
                }
                else if (scale.part != undefined) {
                    switch (scale.part) {
                        case "lefthandweapon":
                            stat = "Left Hand Weapon Attack";
                            break;
                        case "righthandweapon":
                            stat = "Right Hand Weapon Attack";
                            break;
                        case "shield":
                            stat = "Shield Defense";
                            break;
                    }
                }
                out.push(<span style={statsStyle}><br />Heal Scaling: {stat} x {scale.scale}</span>);
            }
        }
    }

    if (levelProp.chargingTime != undefined) {
        const secs = levelProp.chargingTime % 60;
        const mins = Math.floor(levelProp.chargingTime / 60);
        out.push(<span style={statsStyle}><br />Charging Time: {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</span>);
    }

    if (levelProp.scalingParameters != undefined) {
        for (const scale of levelProp.scalingParameters) {
            if (scale.parameter == "chargingTime") {
                let stat = "";
                if (scale.stat != undefined) {
                    stat = Utils.getStatNameByIdOrDefault(scale.stat, i18n);
                }
                else if (scale.part != undefined) {
                    switch (scale.part) {
                        case "lefthandweapon":
                            stat = "Left Hand Weapon Attack";
                            break;
                        case "righthandweapon":
                            stat = "Right Hand Weapon Attack";
                            break;
                        case "shield":
                            stat = "Shield Defense";
                            break;
                    }
                }
                out.push(<span style={statsStyle}><br />Dec. Charging Time Scaling: {stat} x {scale.scale}</span>);
            }
        }
    }

    if (levelProp.duration != undefined) {
        const secs = levelProp.duration % 60;
        const mins = Math.floor(levelProp.duration / 60);
        out.push(<span style={statsStyle}><br />Base Time: {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</span>);
    }

    if (levelProp.scalingParameters != undefined) {
        for (const scale of levelProp.scalingParameters) {
            if (scale.parameter == "duration") {
                let stat = "";
                if (scale.stat != undefined) {
                    stat = Utils.getStatNameByIdOrDefault(scale.stat, i18n);
                }
                else if (scale.part != undefined) {
                    switch (scale.part) {
                        case "lefthandweapon":
                            stat = "Left Hand Weapon Attack";
                            break;
                        case "righthandweapon":
                            stat = "Right Hand Weapon Attack";
                            break;
                        case "shield":
                            stat = "Shield Defense";
                            break;
                    }
                }
                out.push(<span style={statsStyle}><br />Time Scaling: {stat} x {scale.scale}</span>);
            }
        }
    }

    // TODO: Get rid of the limits and floors and show the real value directly from the API, such as seconds below 1

    // Casting time
    if (levelProp.casting != undefined && levelProp.casting >= 1) {
        const secs = levelProp.casting % 60;
        const mins = Math.floor(levelProp.casting / 60);
        out.push(<span style={statsStyle}><br />Casting Time: {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</span>);
    }

    // Cooldown
    if (levelProp.cooldown != undefined) {
        const secs = Math.ceil(levelProp.cooldown) % 60;
        const mins = Math.floor(Math.ceil(levelProp.cooldown) / 60);
        out.push(<span style={statsStyle}><br />Cooldown: {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")} {skillProp.cooldownOnEnd != undefined && skillProp.cooldownOnEnd ? "(After Expiry)" : ""}</span>);
    }
    if (levelProp.cooldownPVP != undefined) {
        const secs = Math.ceil(levelProp.cooldownPVP) % 60;
        const mins = Math.floor(Math.ceil(levelProp.cooldownPVP) / 60);
        out.push(<span style={statsStyle}><br />Cooldown: {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")} (PvP) {skillProp.cooldownOnEnd != undefined && skillProp.cooldownOnEnd ? "(After Expiry)" : ""}</span>);
    }

    // Range
    if (levelProp.spellRange != undefined) {
        out.push(<span style={statsStyle}><br />Spell Range: {levelProp.spellRange}</span>);

        if (skillProp.target == "party") {
            out.push(<span style={statsStyle}> (Party)</span>);
        }
        else if (skillProp.target == "area") {
            out.push(<span style={statsStyle}> (Around)</span>);
        }
    }

    // Probability
    if (levelProp.probability != undefined) {
        out.push(<span style={statsStyle}><br />Probability: {levelProp.probability}%</span>);

        if (levelProp.probabilityPVP != undefined && levelProp.probabilityPVP != levelProp.probability) {
            out.push(<span style={statsStyle}> / {levelProp.probabilityPVP}% (PVP & Giants)</span>);
        }
    }

    if (levelProp.flyBackProbability != undefined) {
        out.push(<span style={statsStyle}><br />Knockdown Probability: {levelProp.flyBackProbability}%</span>);
    }

    if (levelProp.gainedSkillStacks != undefined) {
        for (const gain of levelProp.gainedSkillStacks) {
            const gainedSkill = Utils.getSkillById(gain.skill);
            if (gain.countPVP != undefined && gain.countPVP != gain.count) {
                out.push(<span style={statsStyle}><br />{gainedSkill.name[shortLanguageCode]} Stacks Gained: {gain.count} / {gain.countPVP} (PvP)</span>);
            }
            else {
                out.push(<span style={statsStyle}><br />{gainedSkill.name[shortLanguageCode]} Stacks Gained: {gain.count}</span>);
            }

            if (gain.probability != undefined) {
                out.push(<span style={statsStyle}> ({gain.probability}%)</span>);
            }
        }
    }

    // TODO: wallLives missing from elementor skill
    if (levelProp.wallLives != undefined) {
        out.push(<span style={statsStyle}><br />Number of Lives: {levelProp.wallLives}</span>);
    }

    // Reflex hit
    if (levelProp.reflectedDamagePVE != undefined && levelProp.reflectedDamagePVP != undefined) {
        out.push(<span style={statsStyle}><br />Reflected Damage: {levelProp.reflectedDamagePVE}% / {levelProp.reflectedDamagePVP}% (PVP)</span>);
    }

    // Damage over time
    if (levelProp.dotTick != undefined) {
        out.push(<span style={statsStyle}><br />DoT Tick: {levelProp.dotTick} Seconds</span>);
    }

    if (levelProp.maxTargets != undefined || levelProp.maxTargetsPVP != undefined) {
        if (levelProp.maxTargetsPVP != undefined && levelProp.maxTargets != undefined && levelProp.maxTargets != levelProp.maxTargetsPVP) {
            out.push(<span style={statsStyle}><br />Max Targets: {levelProp.maxTargets} / {levelProp.maxTargetsPVP} (PvP)</span>);
        }
        else if (levelProp.maxTargets != undefined) {
            out.push(<span style={statsStyle}><br />Max Targets: {levelProp.maxTargets}</span>);
        }
    }

    // Combo
    if (skillProp.combo != "general") {
        out.push(<span style={statsStyle}><br />Combo: {skillProp.combo}</span>);
    }

    if (!skillProp.flying) {
        out.push(<span style={statsStyle}><br />Flying: No</span>);
    }

    // Stats
    if (levelProp.abilities != undefined) {
        const abilityStyle = { color: "#6161ff" };
        for (const ability of levelProp.abilities) {

            // "attribute" abilities apply a status effect (bleeding, stun, slow,
            // ...) rather than a numeric stat, so show the effect name instead of
            // a value (they carry no add/set, which otherwise renders as NaN).
            if (ability.parameter == "attribute" || ability.attribute != undefined) {
                const effect = ability.attribute
                    ? ability.attribute.charAt(0).toUpperCase() + ability.attribute.slice(1)
                    : ability.parameter;
                out.push(<span style={abilityStyle}><br />{effect}</span>);
                continue;
            }

            if (ability.parameter == "skillchance") {
                const skillChanceProp = Utils.getSkillById(ability.skill);
                if (skillChanceProp) {
                    out.push(<span style={abilityStyle}><br />{skillChanceProp.name[shortLanguageCode]} Chance+{ability.add}{ability.rate ? "%" : ""}</span>);
                }

                continue;
            }

            let add = ability.add;
            let extra = 0;

            if (levelProp.stackAbilities != undefined && levelProp.stackAbilities) {
                extra += (skill.stacks - 1) * add;
            }

            if (levelProp.synergies != undefined) {
                for (const synergy of levelProp.synergies) {
                    if (synergy.parameter == ability.parameter) {
                        const synergyLevel = Context.player.getSkillLevel(synergy.skill);
                        const bonusLevels = synergyLevel - synergy.minLevel;
                        if (bonusLevels <= 0) {
                            continue;
                        }

                        if (synergy.add) {
                            extra = Math.floor(extra + synergy.scale * bonusLevels);
                        }
                        else {
                            //extra = Math.floor(extra + (add * synergy.scale * bonusLevels));
                        }
                    }
                }
            }

            if (levelProp.scalingParameters != undefined) {
                for (const scale of levelProp.scalingParameters) {
                    if (scale.parameter == ability.parameter && scale.maximum != undefined) {
                        let bufferStat = 0;

                        if (scale.stat != undefined) {
                            switch (scale.stat) {
                                case "int":
                                    bufferStat = Context.player.bufferInt;
                                    break;
                                case "str":
                                    bufferStat = Context.player.bufferStr;
                                    break;
                                case "dex":
                                    bufferStat = Context.player.bufferDex;
                                    break;
                                case "sta":
                                    bufferStat = Context.player.bufferSta;
                                    break;
                                case "hp":
                                    bufferStat = Context.player.getHP();
                                    break;
                                default:
                                    bufferStat = Context.player.getStat(scale.stat, true);
                                    break;
                            }
                        }
                        else {
                            // TODO: Part scaling
                        }

                        if (scale.add) {
                            extra = Math.floor(extra + Math.min(scale.scale * bufferStat, scale.maximum));
                        }
                        else {
                            extra = Math.floor(extra + (add * Math.min(scale.scale * bufferStat, scale.maximum)));
                        }
                    }
                }
            }

            extra = Math.round(extra * 100) / 100;
            let value = ability.set != undefined ? ability.set : add + extra;
            value = Math.round(value * 100) / 100;
            // Negative values already carry their own minus sign, so only prefix
            // "+" for non-negative additive values ("=" for absolute/set values).
            const prefix = ability.set != undefined ? "=" : (value < 0 ? "" : "+");
            out.push(<span style={abilityStyle}><br />{Utils.getStatNameByIdOrDefault(ability.parameter, i18n)}{prefix}{value}{ability.rate && "%"}</span>);
            if (extra != 0) {
                out.push(<span style={{ color: "#ffaa00" }}> ({add}{extra > 0 ? "+" : ""}{extra})</span>)
            }
        }

        if (levelProp.scalingParameters != undefined) {
            for (const ability of levelProp.abilities) {
                for (const scale of levelProp.scalingParameters) {
                    if (scale.parameter == ability.parameter && scale.maximum != undefined) {
                        let stat = "";
                        if (scale.stat != undefined) {
                            stat = Utils.getStatNameByIdOrDefault(scale.stat, i18n);
                        }
                        else if (scale.part != undefined) {
                            switch (scale.part) {
                                case "lefthandweapon":
                                    stat = "Left Hand Weapon Attack";
                                    break;
                                case "righthandweapon":
                                    stat = "Right Hand Weapon Attack";
                                    break;
                                case "shield":
                                    stat = "Shield Defense";
                                    break;
                            }
                        }

                        out.push(<span style={{ color: "#ffaa00" }}><br />
                            {Utils.getStatNameByIdOrDefault(scale.parameter, i18n)} Scaling: +{scale.scale * 25}{ability.rate && "%"} per 25 {stat} (max {scale.maximum}{ability.rate && "%"})
                        </span>);
                    }
                }
            }
        }
    }

    out.push(<hr />);

    out.push(`\n${skillProp.description[shortLanguageCode] ?? skillProp.description.en}`);

    out.push(<hr />);

    for (const synergy of levelProp.synergies ?? []) {
        const synergyStyle = { color: "#4bc71a" };
        const synergyNameStyle = { color: "#4bc71a", fontWeight: 700 };
        const synergyProp = Utils.getSkillById(synergy.skill);

        out.push(<span style={synergyNameStyle}><br />{synergyProp.name[shortLanguageCode]} (Lv. {synergy.minLevel}+)</span>);

        let value = synergy.scale;
        if (!synergy.add) {
            value = 1 + synergy.scale / 100;
        }

        let paramName = Utils.getStatNameByIdOrDefault(synergy.parameter, i18n);
        if (synergy.parameter == "duration") {
            paramName = "Time";
            value *= 10;
        }


        if (synergy.add) {
            out.push(<span style={synergyStyle}><br />{paramName} Scaling per Lv.:+{value}%</span>);
        }
        else {
            out.push(<span style={synergyStyle}><br />{paramName} Scaling per Lv.: × {value}</span>);
        }
    }

    if (skillProp.lockedBy != undefined) {
        out.push(<hr />);
        out.push(<span><br />Locks:</span>);
        for (const locker of skillProp.lockedBy ?? []) {
            out.push(<span><i><br />   {Utils.getSkillById(locker).name[shortLanguageCode]}</i></span>);
        }
    }

    for (const masterId of skillProp.masterVariations ?? []) {
        const currentLevel = Context.player.skillLevels[masterId] ?? 0;
        if (currentLevel > 0) {
            out.push(<hr />);
            const currentMasterProp = Utils.getSkillById(masterId);
            out.push(<span style={{ color: "#d386ff", fontWeight: 700 }}><br />{currentMasterProp.name[shortLanguageCode]} Lv. {currentLevel}</span>);
            out.push(<span><br />{currentMasterProp.description[shortLanguageCode]}</span>);
        }
    }

    return (<div>{out.map((v, i) => <span key={i}>{v}</span>)}</div>);
}

/**
 * Get the tooltip text for the given partySkill
 * @param {object} partySkill The partySkill property
 * @param {I18n} i18n Localization
 */
function setupPartySkill(partySkill, i18n) {
    const out = []
    var shortLanguageCode = 'en'
    if (i18n.resolvedLanguage) {
        shortLanguageCode = i18n.resolvedLanguage.split('-')[0]
    }

    out.push(<span style={{ color: "#2fbe6d", fontWeight: 600 }}>{partySkill.name[shortLanguageCode] ?? partySkill.name.en}</span>);
    out.push(`\n${partySkill.description[shortLanguageCode] ?? partySkill.description.en}`)

    return (<div>{out.map((v, i) => <span key={i}>{v}</span>)}</div>);
}

/**
 * Get the tooltip text for the given housingNpc
 * @param {object} housingNpc The housingNpc property
 * @param {I18n} i18n Localization
 */
function setupHousingNpc(housingNpc, i18n) {
    const out = [];
    var shortLanguageCode = "en";
    if (i18n.resolvedLanguage) {
        shortLanguageCode = i18n.resolvedLanguage.split('-')[0];
    }

    out.push(<span style={{ color: "#2fbe6d", fontWeight: 600 }}>{housingNpc.name[shortLanguageCode] ?? housingNpc.name.en}</span>);
    const abilityStyle = { color: "#6161ff" };
    for (const ability of housingNpc.abilities) {
        if (ability.rate) {
            out.push(<span style={abilityStyle}><br />{Utils.getStatNameByIdOrDefault(ability.parameter, i18n)}{"+"}{ability.add}{"%"}</span>);
        } else {
            out.push(<span style={abilityStyle}><br />{Utils.getStatNameByIdOrDefault(ability.parameter, i18n)}{"+"}{ability.add}</span>);
        }
    }

    return (<div>{out.map((v, i) => <span key={i}>{v}</span>)}</div>);
}