import { useState } from "react";
import { useSearch } from '../../searchcontext';
import { useTranslation } from "react-i18next";

import Slot from "../equipment/inventory/slot";
import HoverInfo from '../shared/hoverinfo';
import NumberInput from "../shared/numberinput";
import Context from "../../flyff/flyffcontext";
import SkillTreeIcon from "./skilltreeicon";
import * as Utils from "../../flyff/flyffutils";

function SkillTree() {
    const { showSearch } = useSearch();
    const [refresh, setRefresh] = useState(false);
    // Achievement currently hovered in the picker, so its details preview in the
    // panel without changing the selection.
    const [hoveredAchievement, setHoveredAchievement] = useState(null);
    const { t, i18n } = useTranslation();

    const classIds = Utils.getAnteriorClassIds(Context.player.job.id);
    const classes = [];
    for (const id of classIds) {
        classes.push(Utils.getClassById(id));
    }

    // Which class tab is currently open. Defaults to (and falls back to) the
    // player's current job whenever the selection isn't part of its progression.
    const [selectedClassId, setSelectedClassId] = useState(Context.player.job.id);
    const [selectedSkillId, setSelectedSkillId] = useState(null);

    const activeClassId = classIds.includes(selectedClassId) ? selectedClassId : Context.player.job.id;
    const activeClass = Utils.getClassById(activeClassId);

    const activeClassSkills = Utils.getClassSkills(activeClassId);
    const treeSkills = activeClassSkills.filter(skill => !isInlinePassive(skill));
    const passiveSkills = activeClassSkills.filter(isInlinePassive);

    // The skill shown in the detail panel, and the master variations to display
    // (those belonging to the selected skill's base skill).
    const selectedSkill = selectedSkillId != null ? Utils.getSkillById(selectedSkillId) : null;
    const variationBase = selectedSkill
        ? (selectedSkill.inheritSkill ? Utils.getSkillById(selectedSkill.inheritSkill) : selectedSkill)
        : null;
    const shownVariations = (variationBase?.masterVariations ?? []).map(id => Utils.getSkillById(id)).filter(Boolean);

    // Third-job passives all carry tree position (0,0), so they'd stack in the
    // top-left corner of the tree. Those are rendered inline instead. Passives
    // from earlier jobs (e.g. Elementor) have real tree positions and stay put.
    function isInlinePassive(skill) {
        return skill.passive && skill.treePosition?.x === 0 && skill.treePosition?.y === 0;
    }

    function selectSkill(skill) {
        setSelectedSkillId(skill.id);
    }

    // Recursively raise every prerequisite skill to its required minimum level.
    function ensurePrerequisites(skill) {
        for (const req of (skill.requirements ?? [])) {
            const current = Context.player.skillLevels[req.skill] ?? 0;
            if (current < req.level) {
                Context.player.skillLevels[req.skill] = req.level;
                const reqSkill = Utils.getSkillById(req.skill);
                if (reqSkill) {
                    ensurePrerequisites(reqSkill);
                }
            }
        }
    }

    // Prepare a skill to be leveled up: satisfy its prerequisites, and for a
    // master variation, max its base skill and drop any sibling variation (only
    // one variation per skill can be active at a time).
    function prepareForLevel(skill) {
        ensurePrerequisites(skill);

        if (skill.inheritSkill) {
            const base = Utils.getSkillById(skill.inheritSkill);
            if (base) {
                ensurePrerequisites(base);
                Context.player.skillLevels[base.id] = base.levels.length;

                for (const siblingId of (base.masterVariations ?? [])) {
                    if (siblingId != skill.id) {
                        delete Context.player.skillLevels[siblingId];
                    }
                }
            }
        }
    }

    function levelUp(skill) {
        const current = Context.player.skillLevels[skill.id] ?? 0;
        if (current >= skill.levels.length) {
            return;
        }

        prepareForLevel(skill);
        Context.player.skillLevels[skill.id] = current + 1;
        setRefresh(!refresh);
    }

    // Remove learned skills that depend on `skillId` now that its level dropped:
    // skills whose level requirement is no longer met, and master variations
    // whose base skill is no longer maxed. Cascades to their dependents in turn.
    function removeDependents(skillId) {
        const skill = Utils.getSkillById(skillId);
        const currentLevel = Context.player.skillLevels[skillId] ?? 0;

        for (const [otherId, otherLevel] of Object.entries(Context.player.skillLevels)) {
            if (otherLevel <= 0) {
                continue;
            }

            const other = Utils.getSkillById(otherId);
            const requirement = other?.requirements?.find((r) => String(r.skill) === String(skillId));

            if (requirement && requirement.level > currentLevel) {
                delete Context.player.skillLevels[otherId];
                removeDependents(otherId);
            }
        }

        // Master variations require their base skill to stay maxed.
        if (skill && !skill.inheritSkill && currentLevel < skill.levels.length) {
            for (const variationId of (skill.masterVariations ?? [])) {
                if (Context.player.skillLevels[variationId] > 0) {
                    delete Context.player.skillLevels[variationId];
                    removeDependents(variationId);
                }
            }
        }
    }

    function levelDown(skill) {
        const current = Context.player.skillLevels[skill.id] ?? 0;
        if (current <= 0) {
            return;
        }

        if (current - 1 <= 0) {
            delete Context.player.skillLevels[skill.id];
        }
        else {
            Context.player.skillLevels[skill.id] = current - 1;
        }

        removeDependents(skill.id);
        setRefresh(!refresh);
    }

    function maxSkill(skill) {
        prepareForLevel(skill);
        Context.player.skillLevels[skill.id] = skill.levels.length;
        setRefresh(!refresh);
    }

    // Master variations and inline passives only exist on third jobs.
    const isThirdJob = activeClass.minLevel >= 165;

    // Skill point cost per level for the selected tree's tier: Vagrant 1,
    // 1st job 2, 2nd job 3, 3rd job 10.
    const pointCost = activeClass.minLevel >= 165 ? 10
        : activeClass.minLevel >= 60 ? 3
            : activeClass.minLevel >= 15 ? 2
                : 1;

    function maxTree(classId) {
        Utils.getClassSkills(classId).forEach((skill) => {
            // Max every skill the character level allows, satisfying each one's
            // prerequisites too — including skills from earlier job trees (maxing
            // Psykeeper, say, still needs the Magician skills those depend on).
            if (Context.player.level >= skill.level) {
                ensurePrerequisites(skill);
                Context.player.skillLevels[skill.id] = skill.levels.length;
            }
        })

        setRefresh(!refresh);
    }

    function addBuffItem() {
        showSearch({
            type: "item",
            typeLocalization: "search_item",
            powerup: true,
            searchByStats: true,
            onSet: (result) => {
                Context.player.activeItems.push(result);
            }
        });
    }

    function addBuffSkill() {
        showSearch({
            type: "skill",
            typeLocalization: "search_skill",
            onSet: (result) => {
                Context.player.activeBuffs[parseInt(result.id)] = result.levels.length;
            }
        });
    }

    function addPersonalHousingNpc() {
        showSearch({
            type: "personalOrCoupleHousingNpc",
            typeLocalization: "search_personal_housing_npc",
            searchByStats: true,
            onSet: (result) => {
                if (!Context.player.activePersonalHousingNpcs.includes(result)) {
                    Context.player.activePersonalHousingNpcs.push(result);
                }
            }
        });
    }

    function addCoupleHousingNpc() {
        showSearch({
            type: "personalOrCoupleHousingNpc",
            typeLocalization: "search_couple_housing_npc",
            searchByStats: true,
            onSet: (result) => {
                if (!Context.player.activeCoupleHousingNpcs.includes(result)) {
                    Context.player.activeCoupleHousingNpcs.push(result);
                }
            }
        });
    }

    function addGuildHousingNpc() {
        showSearch({
            type: "guildHousingNpc",
            typeLocalization: "search_guild_housing_npc",
            searchByStats: true,
            onSet: (result) => {
                if (!Context.player.activeGuildHousingNpcs.includes(result)) {
                    Context.player.activeGuildHousingNpcs.push(result);
                }
            }
        });
    }

    function addRMBuffs() {
        const buffs = [
            2678, // patience
            3964, // quick step
            1129, // mental sign
            9852, // haste
            7661, // heap up
            3721, // cats reflex
            690,  // beef up
            1029, // cannon ball
            6858, // accuracy
            579,  // protect
            9047, // spirit fortune
            6845  // geburah tiphreth
        ];

        for (const id of buffs) {
            Context.player.activeBuffs[id] = Utils.getSkillById(id).levels.length;
        }

        setRefresh(!refresh);
    }

    // Apply every learned passive as an active buff at its learned level, so its
    // stat bonuses (scaled by the caster's stats) are counted.
    function addLearnedPassives() {
        for (const [id, level] of Object.entries(Context.player.skillLevels)) {
            if (level <= 0) {
                continue;
            }

            const skill = Utils.getSkillById(id);
            if (skill && skill.passive) {
                Context.player.activeBuffs[id] = level;
            }
        }

        setRefresh(!refresh);
    }

    function addPartyBuffs() {
        Context.player.activePartyBuffs = [
            // 18, // Gift Box
            1093, // Linked Attack
            // 2475, // Blitz
            // 2651, // Retreat
            4686, // Global Attack
            5942, // Precision
            // 6464, // Lucky Drop
            // 7632, // Resting
            // 8037, // Call
        ];

        setRefresh(!refresh);
    }

    function removeBuffItem(item) {
        Context.player.activeItems = Context.player.activeItems.filter((i) => i != item);
        setRefresh(!refresh);
    }

    function removeSkill(skill) {
        delete Context.player.activeBuffs[skill.id];
        setRefresh(!refresh);
    }

    function removePartySkill(skill) {
        Context.player.activePartyBuffs = Context.player.activePartyBuffs.filter((i) => i != skill.id);
        setRefresh(!refresh);
    }

    function removePersonalHousingNpc(housingNpc) {
        Context.player.activePersonalHousingNpcs = Context.player.activePersonalHousingNpcs.filter((i) => i != housingNpc);
        setRefresh(!refresh);
    }

    function removeCoupleHousingNpc(housingNpc) {
        Context.player.activeCoupleHousingNpcs = Context.player.activeCoupleHousingNpcs.filter((i) => i != housingNpc);
        setRefresh(!refresh);
    }

    function removeGuildHousingNpc(housingNpc) {
        Context.player.activeGuildHousingNpcs = Context.player.activeGuildHousingNpcs.filter((i) => i != housingNpc);
        setRefresh(!refresh);
    }

    function isAchievementActive(achievement) {
        return Context.player.activeAchievements[0]?.id === achievement.id;
    }

    // Achievements are single-select tiers; selecting one replaces the previous,
    // and "None" (null) clears the selection.
    function selectAchievement(achievement) {
        Context.player.activeAchievements = achievement ? [achievement] : [];
        setRefresh(!refresh);
    }

    // The achievement whose details to show: the hovered one if any, otherwise
    // the currently selected one.
    const detailAchievement = hoveredAchievement ?? Context.player.activeAchievements[0];

    return (
        <div className="skill-tree">
            {/* Left column: the in-game style Skills window. */}
            <div className="skills-window">
                <div className="skills-window-titlebar">Skills</div>

                {/* Class progression tabs (portrait cards). */}
                <div className="class-tabs">
                    {
                        classes.map((c) => (
                            <div
                                key={c.id}
                                className={`class-tab ${c.id === activeClassId ? "active" : ""}`}
                                onClick={() => { setSelectedClassId(c.id); setSelectedSkillId(null); }}
                            >
                                <img src={`/tree/${c.tree.slice(0, -4)}Slot.png`} alt={c.name.en} draggable={false} />
                                <span>{c.name.en}</span>
                            </div>
                        ))
                    }
                </div>

                <div className="class-name-banner">{activeClass.name.en}</div>

                {/* Active skills tree (centered) + selected-skill detail panel. */}
                <div className="active-skills-row">
                    <div className="skills-panel active-skills-panel">
                        <div className="skills-panel-header">Active Skills</div>
                        <div className="skill-tree-canvas">
                            <img src={`/tree/${activeClass.tree}`} draggable={false} />
                            {
                                treeSkills.map(skill =>
                                    <SkillTreeIcon
                                        key={skill.id}
                                        skill={skill}
                                        onSelect={selectSkill}
                                        selected={skill.id === selectedSkillId}
                                        disabled={!Context.player.canUseSkill(skill, true)}
                                        level={Context.player.getSkillLevel(skill.id)}
                                    />
                                )
                            }
                        </div>
                    </div>

                    <div className="skills-panel skill-detail-panel">
                        <div className="skills-panel-header">Skill</div>
                        {
                            selectedSkill ? (
                                <div className="skill-detail">
                                    <img className="skill-detail-icon" src={`https://api.flyff.com/image/skill/colored/${selectedSkill.icon}`} alt={selectedSkill.name.en} draggable={false} />
                                    <div className="skill-detail-name">{selectedSkill.name.en}</div>
                                    <div className="skill-detail-level">Lv. {Context.player.getSkillLevel(selectedSkill.id)} / {selectedSkill.levels.length}</div>
                                    <div className="skill-detail-buttons">
                                        <button className="flyff-button square" onClick={() => levelDown(selectedSkill)}>−</button>
                                        <button className="flyff-button square" onClick={() => levelUp(selectedSkill)}>+</button>
                                    </div>
                                    <button className="flyff-button skill-detail-max" onClick={() => maxSkill(selectedSkill)}>max</button>
                                </div>
                            ) : (
                                <div className="skill-detail-empty">Click a skill to level it.</div>
                            )
                        }
                    </div>
                </div>

                {/* Master variations + passives (third jobs only). */}
                {isThirdJob && (
                    <div className="skills-bottom-panels">
                        <div className="skills-panel">
                            <div className="skills-panel-header">Master Variations</div>
                            <div className="skills-panel-body master-variations-body">
                                {
                                    shownVariations.map(variation =>
                                        <SkillTreeIcon
                                            key={variation.id}
                                            skill={variation}
                                            inline
                                            onSelect={selectSkill}
                                            selected={variation.id === selectedSkillId}
                                            disabled={false}
                                            level={Context.player.getSkillLevel(variation.id)}
                                        />
                                    )
                                }
                            </div>
                        </div>
                        <div className="skills-panel">
                            <div className="skills-panel-header">Passive Skills</div>
                            <div className="skills-panel-body skill-tree-passives">
                                {
                                    passiveSkills.map(skill =>
                                        <SkillTreeIcon
                                            key={skill.id}
                                            skill={skill}
                                            inline
                                            onSelect={selectSkill}
                                            selected={skill.id === selectedSkillId}
                                            disabled={!Context.player.canUseSkill(skill, true)}
                                            level={Context.player.getSkillLevel(skill.id)}
                                        />
                                    )
                                }
                            </div>
                        </div>
                    </div>
                )}

                {/* Skill points + point cost footer. */}
                <div className="skills-window-footer">
                    <div className="skills-footer-field">
                        <span className="skills-footer-label">Skill Points</span>
                        <span style={{ color: Context.player.getRemainingSkillPoints() < 0 ? "red" : "inherit" }}>{Context.player.getRemainingSkillPoints()}/{Context.player.getTotalSkillPoints()}</span>
                        <HoverInfo text={"How many skill points you have remaining.\n\nWhile you cannot go below 0 skill points in-game, this page allows you to allocate more points than you have."} />
                    </div>
                    <div className="skills-footer-field">
                        <span className="skills-footer-label">Point Cost</span>
                        <span>{pointCost}</span>
                    </div>
                    <button className="flyff-button" onClick={() => maxTree(activeClassId)}>Max tree</button>
                </div>
            </div>

            {/* Right column: buffs, items and housing NPCs. */}
            <div className="buffs-column">
                <div className="buffs">
                    <div className="buffs-header">
                        <h3>{t("skills_and_buffs_active_buffs")}</h3>
                        <div className="buffs-header-actions">
                            <button className="flyff-button" onClick={() => addBuffSkill()}>{t("skills_and_buffs_add")}</button>
                            <button className="flyff-button" onClick={() => addRMBuffs()}>{t("skills_and_buffs_add_rm")}</button>
                        </div>
                    </div>
                    <div className="column">
                        <NumberInput min={15} max={1000} value={Context.player.bufferStr} label={"Caster STR"} onChange={(v) => { Context.player.bufferStr = v; }} />
                        <NumberInput min={15} max={1000} value={Context.player.bufferSta} label={"Caster STA"} onChange={(v) => { Context.player.bufferSta = v; }} />
                        <NumberInput min={15} max={1000} value={Context.player.bufferDex} label={"Caster DEX"} onChange={(v) => { Context.player.bufferDex = v; }} />
                        <NumberInput min={15} max={1000} value={Context.player.bufferInt} label={"Caster INT"} onChange={(v) => { Context.player.bufferInt = v; }} />
                    </div>
                    <button className="flyff-button apply-passives-button" onClick={() => addLearnedPassives()}>Apply Learned Passives</button>
                    <hr />
                    <div className="buffs-container">
                        {
                            Object.entries(Context.player.activeBuffs).map(([id,]) =>
                                <Slot key={id} className={"slot-skill"} content={Utils.getSkillById(id)} onRemove={removeSkill} />
                            )
                        }
                    </div>
                </div>

                <div className="buffs">
                    <div className="buffs-header">
                        <h3>{t("skills_and_buffs_active_items")}</h3>
                        <button className="flyff-button" onClick={() => addBuffItem()}>{t("skills_and_buffs_add")}</button>
                    </div>
                    <hr />
                    <div className="buffs-container">
                        {
                            Context.player.activeItems.map(item =>
                                <Slot key={item.itemProp.id} className={"slot-item"} content={item} onRemove={removeBuffItem} />
                            )
                        }
                    </div>
                </div>

                <div className="buffs">
                    <div className="buffs-header">
                        <h3>{t("skills_and_buffs_active_party_buffs")}</h3>
                        <button className="flyff-button" onClick={() => addPartyBuffs()}>{t("skills_and_buffs_add_party")}</button>
                    </div>
                    <div>
                        <NumberInput hasButtons min={1} max={8} onChange={(v) => { Context.player.activePartyMembers = v }} value={Context.player.activePartyMembers} label={t("skills_and_buffs_active_party_members")} />
                    </div>
                    <hr />
                    <div className="buffs-container">
                        {
                            Context.player.activePartyBuffs.map((id) =>
                                <Slot key={id} className={"slot-skill"} content={Utils.getPartySkillById(id)} onRemove={removePartySkill} />
                            )
                        }
                    </div>
                </div>

                <div className="buffs">
                    <div className="buffs-header">
                        <h3>{t("skills_and_buffs_active_personal_house_buffs")}</h3>
                        <button className="flyff-button" onClick={() => addPersonalHousingNpc()}>{t("skills_and_buffs_add")}</button>
                    </div>
                    <hr />
                    <div className="buffs-container">
                        {
                            Context.player.activePersonalHousingNpcs.map(personalNpc =>
                                <Slot key={personalNpc.id} className={"slot-skill"} content={personalNpc} onRemove={removePersonalHousingNpc} />
                            )
                        }
                    </div>
                </div>

                <div className="buffs">
                    <div className="buffs-header">
                        <h3>{t("skills_and_buffs_active_personal_couple_buffs")}</h3>
                        <button className="flyff-button" onClick={() => addCoupleHousingNpc()}>{t("skills_and_buffs_add")}</button>
                    </div>
                    <hr />
                    <div className="buffs-container">
                        {
                            Context.player.activeCoupleHousingNpcs.map(coupleNpc =>
                                <Slot key={coupleNpc.id} className={"slot-skill"} content={coupleNpc} onRemove={removeCoupleHousingNpc} />
                            )
                        }
                    </div>
                </div>

                <div className="buffs">
                    <div className="buffs-header">
                        <h3>{t("skills_and_buffs_active_personal_guild_buffs")}</h3>
                        <button className="flyff-button" onClick={() => addGuildHousingNpc()}>{t("skills_and_buffs_add")}</button>
                    </div>
                    <hr />
                    <div className="buffs-container">
                        {
                            Context.player.activeGuildHousingNpcs.map(guildNpc =>
                                <Slot key={guildNpc.id} className={"slot-skill"} content={guildNpc} onRemove={removeGuildHousingNpc} />
                            )
                        }
                    </div>
                </div>

                <div className="buffs achievements-section">
                    <div className="buffs-header">
                        <h3>Achievement (FWC Only)</h3>
                    </div>
                    <hr />
                    <div className="achievements-picker" onMouseLeave={() => setHoveredAchievement(null)}>
                        <div
                            className={`achievement none ${Context.player.activeAchievements.length === 0 ? "active" : ""}`}
                            onClick={() => selectAchievement(null)}
                            onMouseEnter={() => setHoveredAchievement(null)}
                        >
                            <span>None</span>
                        </div>
                        {
                            Utils.getAchievements().map(achievement =>
                                <div
                                    key={achievement.id}
                                    className={`achievement ${isAchievementActive(achievement) ? "active" : ""}`}
                                    onClick={() => selectAchievement(achievement)}
                                    onMouseEnter={() => setHoveredAchievement(achievement)}
                                >
                                    <img src={`/${achievement.image}`} alt={achievement.name.en} draggable={false} />
                                </div>
                            )
                        }
                    </div>
                    {
                        detailAchievement && (
                            <div className="achievement-details">
                                <div className="achievement-name">{detailAchievement.name.en}</div>
                                <div className="achievement-abilities">
                                    {
                                        detailAchievement.abilities.map((ability, index) =>
                                            <span key={index} className="achievement-ability">
                                                {Utils.getStatNameByIdOrDefault(ability.parameter, i18n)} +{ability.add}{ability.rate ? "%" : ""}
                                            </span>
                                        )
                                    }
                                </div>
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    );
}

export default SkillTree;