import { useState } from "react";
import { useSearch } from '../searchcontext';
import { useTranslation } from "react-i18next";

import Slot from "./slot";
import HoverInfo from './hoverinfo';
import Context from "../flyff/flyffcontext";
import SkillTreeIcon from "./skilltreeicon";
import NumberInput from "./numberinput";
import * as Utils from "../flyff/flyffutils";

function SkillTree() {
    const { showSearch } = useSearch();
    const [refresh, setRefresh] = useState(false);
    const { t } = useTranslation();

    const classIds = Utils.getAnteriorClassIds(Context.player.job.id);
    const classes = [];
    for (const id of classIds) {
        classes.push(Utils.getClassById(id));
    }

    function clickSkill(skill, inc, e) {
        e.preventDefault();

        if (!Context.player.canUseSkill(skill)) {
            return;
        }

        const currentLevel = Context.player.getSkillLevel(skill.id);
        const maxLevel = skill.levels.length;
        if (inc > 0 && currentLevel < maxLevel) {
            Context.player.skillLevels[skill.id] = currentLevel + 1;
        }
        else if (inc < 0 && currentLevel > 0) {
            Context.player.skillLevels[skill.id] = currentLevel - 1;
            if (Context.player.skillLevels[skill.id] <= 0) {
                delete Context.player.skillLevels[skill.id];
            }
        }

        setRefresh(!refresh);
    }

    function maxTree(classId) {
        Utils.getClassSkills(classId).forEach((skill) => {
            // Only check level and skill point requirements, not prerequisites since they'll be maxed
            if (Context.player.level >= skill.level) {
                Context.player.skillLevels[skill.id] = skill.levels.length;
            }
        })

        setRefresh(!refresh);
    }

    function addBuffItem() {
        showSearch({
            type: "item",
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
            onSet: (result) => {
                Context.player.activeBuffs[parseInt(result.id)] = result.levels.length;
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
            9047 // spirit fortune
        ];

        for (const id of buffs) {
            Context.player.activeBuffs[id] = Utils.getSkillById(id).levels.length;
        }

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

    return (
        <div className="skill-tree">
            <div id="skill-tree-base">
                <div style={{ position: "relative" }}>
                    <div id="skill-points">
                        <i style={{ color: Context.player.getRemainingSkillPoints() < 0 ? "red" : "inherit" }}>{Context.player.getRemainingSkillPoints()} {t("skills_and_buffs_skills_points_available")}</i>
                        <HoverInfo text={"How many skill points you have remaining.\n\nWhile you cannot go below 0 skill points in-game, this page allows you to allocate more points than you have."} />
                    </div>
                    {
                        classes.map((c) => {
                            return (
                                <div key={c.id}>
                                    <div className="skill-tree-header">
                                        <h3>{c.name.en} skills</h3>
                                        <button className="flyff-button" onClick={() => maxTree(c.id)}>Max</button>
                                    </div>
                                    <hr />
                                    <div style={{ position: "relative" }}>
                                        <img src={`/tree/${c.tree}`} />
                                        {
                                            Utils.getClassSkills(c.id).map(skill =>
                                                <SkillTreeIcon
                                                    clickHandle={(e) => clickSkill(skill, 1, e)}
                                                    rightClickHandle={(e) => clickSkill(skill, -1, e)}
                                                    skill={skill}
                                                    key={skill.id}
                                                    disabled={!Context.player.canUseSkill(skill)}
                                                    level={Context.player.getSkillLevel(skill.id)}
                                                />
                                            )
                                        }
                                    </div>
                                </div>
                            )
                        })
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
                            <Slot key={item.id} className={"slot-item"} content={item} onRemove={removeBuffItem} />
                        )
                    }
                </div>
            </div>
            <div className="buffs">
                <div className="buffs-header">
                    <h3>{t("skills_and_buffs_active_buffs")}</h3>
                    <button className="flyff-button" onClick={() => addBuffSkill()}>{t("skills_and_buffs_add")}</button>
                    <button className="flyff-button" onClick={() => addRMBuffs()}>{t("skills_and_buffs_add_rm")}</button>
                </div>
                <div className="column">
                    <NumberInput min={15} max={1000} value={Context.player.bufferStr} label={"Caster STR"} onChange={(v) => {Context.player.bufferStr = v;}} />
                    <NumberInput min={15} max={1000} value={Context.player.bufferSta} label={"Caster STA"} onChange={(v) => {Context.player.bufferSta = v;}} />
                    <NumberInput min={15} max={1000} value={Context.player.bufferDex} label={"Caster DEX"} onChange={(v) => {Context.player.bufferDex = v;}} />
                    <NumberInput min={15} max={1000} value={Context.player.bufferInt} label={"Caster INT"} onChange={(v) => {Context.player.bufferInt = v;}} />
                </div>
                <hr />
                <div className="buffs-container">
                    {
                        Object.entries(Context.player.activeBuffs).map(([id,]) =>
                            <Slot key={id} className={"slot-skill"} content={Utils.getSkillById(id)} onRemove={removeSkill} />
                        )
                    }
                </div>
            </div>
        </div>
    );
}

export default SkillTree;