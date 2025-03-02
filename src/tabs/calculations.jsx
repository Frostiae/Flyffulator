import { useState } from 'react';
import { useSearch } from '../searchcontext';
import { useTranslation } from "react-i18next";
import { getDamage, getHealing } from '../flyff/flyffdamagecalculator';

import '../styles/calculations.scss';
import Entity from '../flyff/flyffentity';
import Context from '../flyff/flyffcontext';
import * as Utils from "../flyff/flyffutils";
import HoverInfo from '../components/hoverinfo';
import LineChart from '../components/linechart';
import BasicStat from '../components/basicstat';

function Calculations() {
    const { showSearch } = useSearch();
    const [targetType, setTargetType] = useState(0);
    const { t } = useTranslation();
    var shortCode = "en";
    if(t.resolvedLanguage) {
        shortCode = t.resolvedLanguage.split('-')[0];
    }

    function setTarget(index) {
        if (index == 0) { // Training dummy
            Context.defender = new Entity(Utils.TRAINING_DUMMY);
            setTargetType(index);
        }
        else if (index == 1) { // Other player
            //
        }
        else if (index == 2) { // Monster
            showSearch({
                type: "monster", onSet: (res) => {
                    Context.defender = res;
                    setTargetType(index);
                }
            });
        }
    }

    function generateMonsterAttack() {
        let out = [];

        const defender = Context.defender;
        Context.attacker = Context.defender;
        Context.defender = Context.player;

        for (let i = 0; i < 100; i++) {
            Context.skill = null;
            Context.attackFlags = Utils.ATTACK_FLAGS.GENERIC;

            const res = {
                damage: getDamage(false),
                critical: (Context.attackFlags & Utils.ATTACK_FLAGS.CRITICAL) != 0,
                block: (Context.attackFlags & Utils.ATTACK_FLAGS.BLOCKING) != 0,
                miss: (Context.attackFlags & Utils.ATTACK_FLAGS.MISS) != 0,
                parry: (Context.attackFlags & Utils.ATTACK_FLAGS.PARRY) != 0,
                double: (Context.attackFlags & Utils.ATTACK_FLAGS.DOUBLE) != 0
            }

            out.push(res);
        }

        Context.defender = defender;
        Context.attacker = Context.player;

        return out;
    }

    function generateAutoAttack() {
        let out = [];
        for (let i = 0; i < 200; i++) {
            Context.skill = null;

            if (Context.attacker.equipment.mainhand.itemProp.subcategory == "wand") {
                Context.attackFlags = Utils.ATTACK_FLAGS.MAGIC;
            }
            else {
                Context.attackFlags = Utils.ATTACK_FLAGS.GENERIC;
            }

            const res = {
                damage: getDamage(false),
                critical: (Context.attackFlags & Utils.ATTACK_FLAGS.CRITICAL) != 0,
                block: (Context.attackFlags & Utils.ATTACK_FLAGS.BLOCKING) != 0,
                miss: (Context.attackFlags & Utils.ATTACK_FLAGS.MISS) != 0,
                parry: (Context.attackFlags & Utils.ATTACK_FLAGS.PARRY) != 0,
                double: (Context.attackFlags & Utils.ATTACK_FLAGS.DOUBLE) != 0
            }

            out.push(res);
        }
        return out;
    }

    function generateHealing() {
        let data = {};
        for (const [skill, level] of Object.entries(Context.player.skillLevels)) {
            if (level <= 0) {
                continue; // Shouldn't happen
            }

            const skillProp = Utils.getSkillById(skill);

            const healing = getHealing(skillProp);
            if (healing <= 0) {
                continue; // Not a healing skill
            }

            data[skill] = healing;
        }

        return data;
    }

    function generateSkillDamage() {
        let data = {};
        for (const [skill, level] of Object.entries(Context.player.skillLevels)) {
            if (level <= 0) {
                continue; // Shouldn't happen
            }

            let out = [];

            const skillProp = Utils.getSkillById(skill);
            const levelProp = skillProp.levels[level - 1];

            if (levelProp.minAttack == undefined) {
                continue;
            }

            for (let i = 0; i < 100; i++) {
                Context.skill = skillProp;
                Context.attackFlags = skillProp.magic ? Utils.ATTACK_FLAGS.MAGICSKILL : Utils.ATTACK_FLAGS.MELEESKILL;

                const res = {
                    damage: getDamage(false),
                    critical: (Context.attackFlags & Utils.ATTACK_FLAGS.CRITICAL) != 0,
                    block: (Context.attackFlags & Utils.ATTACK_FLAGS.BLOCKING) != 0,
                    miss: (Context.attackFlags & Utils.ATTACK_FLAGS.MISS) != 0,
                    parry: (Context.attackFlags & Utils.ATTACK_FLAGS.PARRY) != 0,
                    double: (Context.attackFlags & Utils.ATTACK_FLAGS.DOUBLE) != 0
                }

                out.push(res);
            }

            data[skill] = out;
        }

        return data;
    }

    function generateDefense() {
        // This is annoying but defense is a random between two values defined by your equipment.
        // Not reliable and probably a better way to find it but its ok

        Context.skill = null;
        Context.attackFlags = Utils.ATTACK_FLAGS.GENERIC;

        let out = [];
        for (let i = 0; i < 100; i++) {
            const res = Context.player.getDefense();
            out.push(res);
        }

        const minValue = Math.min(...out);
        const maxValue = Math.max(...out);

        return `${minValue}~${maxValue}`;
    }

    function getMagicDefense() {
        Context.skill = null;
        Context.attackFlags = Utils.ATTACK_FLAGS.MAGIC;

        let defense = Context.player.getDefense();
        defense += defense * Context.player.getStat("magicdefense", true) / 100;
        return Math.floor(defense);
    }

    return (
        <div id="calculations">
            <div id="basic-stats">
                <BasicStat title={"Stamina"} value={Context.player.getBaseStat("sta")}
                    information={"This is your total stamina, including any bonuses from equipment or elsewhere."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L290"}
                />

                <BasicStat title={"Strength"} value={Context.player.getBaseStat("str")}
                    information={"This is your total strength, including any bonuses from equipment or elsewhere."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L290"}
                />

                <BasicStat title={"Dexterity"} value={Context.player.getBaseStat("dex")}
                    information={"This is your total dexterity, including any bonuses from equipment or elsewhere."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L290"}
                />

                <BasicStat title={"Intelligence"} value={Context.player.getBaseStat("int")}
                    information={"This is your total intelligence, including any bonuses from equipment or elsewhere."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L290"}
                />

                <hr />

                <BasicStat title={"Maximum HP"} value={Context.player.getHP()}
                    information={"This is your maximum health."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L302"}
                />

                <BasicStat title={"Maximum MP"} value={Context.player.getMP()}
                    information={"This is your maximum MP. MP is a requirement for using most magic skills."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L324"}
                />

                <BasicStat title={"Maximum FP"} value={Context.player.getFP()}
                    information={"This is your maximum FP. FP is a requirement for most non-magic skills."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L345"}
                />

                <hr />

                <BasicStat title={"Speed"} value={Context.player.getMovementSpeed()}
                    information={"This is your current movement speed factor."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L365"}
                    percentage
                />

                <BasicStat title={"Jump Height"} value={(Context.player.getStat("jumpheight", false) + 200) / 2}
                    information={"This is your current jumping height factor."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L735"}
                    percentage
                />

                <BasicStat title={"Casting Speed"} value={100 + Context.player.getStat("decreasedcastingtime", true)}
                    information={"This is your current casting speed bonus. Casting speed affects how long it takes you to cast magic skills."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L735"}
                    percentage
                />

                <hr />

                <BasicStat title={"Attack"} value={Context.player.getAttack()}
                    information={"This is your attack. This is an approximated value of your general damage, as your true damage heavily relies on the current context."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L423"}
                />

                <BasicStat title={"Skill Damage"} value={Context.player.getStat("skilldamage", true)}
                    information={"This value is a bonus multiplier for your skill damage."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L735"}
                    percentage
                />

                <BasicStat title={"PvE Damage"} value={Context.player.getStat("pvedamage", true)}
                    information={"This value is a bonus multiplier for your damage against monsters."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L735"}
                    percentage
                />

                <BasicStat title={"PvP Damage"} value={Context.player.getStat("pvpdamage", true)}
                    information={"This value is a bonus multiplier for your damage against other players."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L735"}
                    percentage
                />

                <BasicStat title={"Attack Speed"} value={Math.floor(Context.player.getAttackSpeed() * 100) / 2}
                    information={"This value affects how fast you can unleash subsequent auto attacks."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L378"}
                    percentage
                />

                <BasicStat title={"Hit Rate"} value={Context.player.getContextHitRate(Context.defender).probAdjusted}
                    information={"How often your auto attacks will land (not miss or be parried) on your target.\n\nThis value differs from the one you see in-game, but is the true hit rate against your current target."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L550"}
                    percentage
                />

                <BasicStat title={"Critical Chance"} value={Context.player.getCriticalChance()}
                    information={"How often your auto attacks will result in a critical hit."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L949"}
                    percentage
                />

                <BasicStat title={"Critical Damage"} value={Context.player.getStat("criticaldamage", true)}
                    information={"This value is a bonus multiplier on your critical hits' damage."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L735"}
                    percentage
                />

                <BasicStat title={"Block Penetration"} value={Context.player.getStat("blockpenetration", true)}
                    information={"This value lowers your target's chance to block your auto attacks.\n\nThis is a factor, meaning that 50% block penetration will lower your target's block chance by 50%, leaving them with half of what they would have otherwise."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L735"}
                    percentage
                />

                <hr />

                <BasicStat title={"Defense"} value={generateDefense()}
                    information={"This value lowers how much damage you take from auto attacks.\n\nWhile this value is significantly lower than the value you would see in-game, it is the real value used during damage calculations."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/tabs/calculations.jsx#L147"}
                />

                <BasicStat title={"Magic Defense"} value={getMagicDefense()}
                    information={"This value lowers how much damage you take from magical attacks."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/tabs/calculations.jsx#L166"}
                />

                <BasicStat title={"Critical Resist"} value={Context.player.getStat("criticalresist", true)}
                    information={"This value lowers your target's chance to land critical hits against you.\n\nThis is a factor, meaning that 50% critical resist will leave your target with 50% of their original critical chance."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L735"}
                    percentage
                />

                {/* TODO: There are some stats missing here like PVP damage, incoming damage, etc */}

                <BasicStat title={"Parry"} value={Context.player.getParry()}
                    information={"This is your parry."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L535"}
                />

                <BasicStat title={"Melee Block"} value={Utils.clamp(Context.player.getBlockChance(false, Context.defender), 6.25, 93.75)}
                    information={"How often you block melee attacks from the current target.\n\nThis value may be different than the one you see in the character window as it takes everything into account, such as minimums, maximums and the opponent's stats. This is your true block rate."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L965"}
                    percentage
                />

                <BasicStat title={"Ranged Block"} value={Utils.clamp(Context.player.getBlockChance(true, Context.defender), 6.25, 93.75)}
                    information={"How often you block ranged attacks from the current target.\n\nThis value may be different than the one you see in the character window as it takes everything into account, such as minimums, maximums and the opponent's stats. This is your true block rate."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L965"}
                    percentage
                />
            </div>

            <div id="extra-stats">
                <div id="target-select">
                    <div id="target-options">
                        <div>
                            <input type="radio" id="target-dummy" name="target-type" checked={targetType == 0} onChange={() => setTarget(0)} />
                            <label htmlFor="target-dummy">{t("training_dummy_target")}</label>
                        </div>
                        <div>
                            <input type="radio" id="target-player" name="target-type" checked={targetType == 1} onChange={() => setTarget(1)} />
                            <label htmlFor="target-player">{t("player_target")}</label>
                        </div>
                        <div>
                            <input type="radio" id="target-monster" name="target-type" checked={targetType == 2} onChange={() => setTarget(2)} />
                            <label htmlFor="target-monster">{t("monster_target")}</label>
                        </div>
                    </div>

                    {
                        targetType == 0 && // training dummy
                        <div id="target-information">
                            <div className="column">
                                <b id="target-name">
                                    {Context.defender.monsterProp.name[shortCode] ?? Context.defender.monsterProp.name.en}
                                </b>
                                <div className="basic-stat">
                                    <span className="basic-label">HP</span>
                                    <span className="basic-value">∞</span>
                                </div>
                            </div>
                            <div className="column">
                                <div className="basic-stat">
                                    <span className="basic-label">STR</span>
                                    <span className="basic-value">{Context.defender.monsterProp.str}</span>
                                </div>
                                <div className="basic-stat">
                                    <span className="basic-label">STA</span>
                                    <span className="basic-value">{Context.defender.monsterProp.sta}</span>
                                </div>
                            </div>
                            <div className="column">
                                <div className="basic-stat">
                                    <span className="basic-label">DEX</span>
                                    <span className="basic-value">{Context.defender.monsterProp.dex}</span>
                                </div>
                                <div className="basic-stat">
                                    <span className="basic-label">INT</span>
                                    <span className="basic-value">{Context.defender.monsterProp.int}</span>
                                </div>
                            </div>
                        </div>
                    }

                    {
                        targetType == 2 && // Monster
                        <div id="target-information">
                            <div className="column">
                                <b id="target-name">
                                    {Context.defender.monsterProp.name[shortCode] ?? Context.defender.monsterProp.name.en}
                                </b>
                                <div className="basic-stat">
                                    <span className="basic-label">HP</span>
                                    <span className="basic-value">{Context.defender.monsterProp.hp}</span>
                                </div>
                            </div>
                            <div className="column">
                                <div className="basic-stat">
                                    <span className="basic-label">STR</span>
                                    <span className="basic-value">{Context.defender.str}</span>
                                </div>
                                <div className="basic-stat">
                                    <span className="basic-label">STA</span>
                                    <span className="basic-value">{Context.defender.sta}</span>
                                </div>
                            </div>
                            <div className="column">
                                <div className="basic-stat">
                                    <span className="basic-label">DEX</span>
                                    <span className="basic-value">{Context.defender.dex}</span>
                                </div>
                                <div className="basic-stat">
                                    <span className="basic-label">INT</span>
                                    <span className="basic-value">{Context.defender.int}</span>
                                </div>
                            </div>
                        </div>
                    }
                </div>

                <div className="category-header">
                    <h3>Offensive calculations</h3>
                    <HoverInfo text={"Information about damage dealt using auto attacks and allocated skills."} />
                </div>
                <hr />

                <div className="charts">
                    <LineChart
                        chartData={generateAutoAttack()}
                        title={"Auto Attack Damage"}
                        info={"This is the result of 200 simulated auto attacks against the selected target. On the chart is each iteration's final damage, the highest attack highlighted with a white point, and the average of all 200 simulations."}
                        label={"Damage"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffdamagecalculator.js#L50"}
                    />

                    {/* Skills */}

                    {
                        Object.entries(generateSkillDamage()).map(([skill, data]) =>
                            <LineChart
                                chartData={data}
                                title={(Utils.getSkillById(skill).name[shortCode] ?? Utils.getSkillById(skill).name.en) + " Damage"}
                                info={"This is the result of 100 simulated attacks of this skill against the selected target. On the chart is each iteration's final damage, the highest attack highlighted with a white point, and the average of all 200 simulations."}
                                key={skill}
                                label={"Damage"}
                                sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffdamagecalculator.js#L50"}
                            />
                        )
                    }
                </div>

                <div className="category-header">
                    <h3>Defensive calculations</h3>
                    <HoverInfo text={"Information about your defensive capabilities against the current target."} />
                </div>
                <hr />

                <div className="charts">
                    <LineChart
                        chartData={generateMonsterAttack()}
                        title={"Monster Damage"}
                        info={"This is the result of 100 simulated attacks taken from the selected target. On the chart is each iteration's final damage, the highest attack highlighted with a white point, and the average of all 100 simulations."}
                        label={"Damage"}
                        sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/tabs/calculations.jsx#L34"}
                    />
                </div>

                <div className="category-header">
                    <h3>Other skill calculations</h3>
                    <HoverInfo text={"Other calculations about allocated skills such as healing."} />
                </div>
                <hr />

                <div className="charts">
                    {/* Healing Skills */}

                    {
                        Object.entries(generateHealing()).map(([skill, data]) =>
                            <div className="basic-stat" key={skill}>
                                <span className="basic-label">{(Utils.getSkillById(skill).name[shortCode] ?? Utils.getSkillById(skill).name.en) + " Healing"}</span>
                                <span className="basic-value">{data}</span>
                                <HoverInfo text="View calculation code 🔗" icon="code-icon.svg" link="https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffdamagecalculator.js#L11" />
                            </div>
                        )
                    }
                </div>

            </div>

        </div>
    )
}

export default Calculations;
