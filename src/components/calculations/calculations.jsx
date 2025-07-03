import { useState, useEffect } from 'react';
import { useSearch } from '../../searchcontext';
import { useTranslation } from "react-i18next";
import { getHealing } from '../../flyff/flyffdamagecalculator';
import { runAutoAttackWorker } from './utils/runAutoAttackWorker';
import { runSkillWorker } from './utils/runSkillWorker';
import { runMonsterWorker } from './utils/runMonsterWorker';

import '../../styles/calculations.scss';
import Entity from '../../flyff/flyffentity';
import Context from '../../flyff/flyffcontext';
import * as Utils from "../../flyff/flyffutils";
import HoverInfo from '../shared/hoverinfo';
import LineChart from './charts/linechart';
import BasicStat from './charts/basicstat';
import NumberInput from '../shared/numberinput';
import RangeInput from '../shared/rangeinput';
import ImportCharacter from '../base/importcharacter';

function Calculations() {
    const AA_DEFAULT_SAMPLE_SIZE = 200;
    const AA_MAX_SAMPLE_SIZE = 10000;
  
    const SKILL_DEFAULT_SAMPLE_SIZE = 100;
    const SKILL_MAX_SAMPLE_SIZE = 10000;
  
    const MONSTER_DEFAULT_SAMPLE_SIZE = 100;
    const MONSTER_MAX_SAMPLE_SIZE = 10000;

    const { showSearch } = useSearch();
    const [bigSampleActive, setBigSampleActive] = useState(false);
    const [aaBigSampleSize, setAaBigSampleSize] = useState(2000);
    const [skillBigSampleSize, setSkillBigSampleSize] = useState(100);
    const [monsterBigSampleSize, setMonsterBigSampleSize] = useState(100);
    const [targetType, setTargetType] = useState(Context.defender.isPlayer() ? 1 : (Context.defender.monsterProp.dummy ? 0 : 2));
    const [refresh, setRefresh] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const [autoAttackData, setAutoAttackData] = useState([]);
    const [skillData, setSkillData] = useState([]);
    const [monsterData, setMonsterData] = useState([]);
    const [isLoadingAA, setIsLoadingAA] = useState(false);
    const [isLoadingSkill, setIsLoadingSkill] = useState(false);
    const [isLoadingMonster, setIsLoadingMonster] = useState(false);

    const { i18n } = useTranslation();

    function SpinnerOverlay() {
        return (
            <div className="spinner-overlay">
                <div className="spinner" />
            </div>
        );
    }    

    useEffect(() => {
        setBigSampleActive(false);
    }, [
        Context.player,
        Context.defender,
        refresh,
        targetType,
        aaBigSampleSize,
        skillBigSampleSize,
        monsterBigSampleSize,
    ]);

    useEffect(() => {
        let cancelled = false;
        setIsLoadingAA(true);
        setIsLoadingSkill(true);
        setIsLoadingMonster(true);

        
        // Add waterbomb
        if (Context.settings.waterbombEnabled && Context.attacker.getStat("skillchance", true, 11389) > 0) {
            Context.player.skillLevels[11389] = 1;
        }

        
        // Counter attack
        if (Context.player.skillLevels[2506] != undefined) {
            Context.player.skillLevels[6725] = Context.player.skillLevels[2506];
        }
    
        const context = {
            player: Context.player.serialize(),
            attacker: Context.attacker.serialize(),
            defender: Context.defender.serialize(),
            attackFlags: Context.attackFlags,
            skill: Context.skill,
            settings: Context.settings,
            expSettings: Context.expSettings
        }

        runAutoAttackWorker(context, bigSampleActive ? aaBigSampleSize : AA_DEFAULT_SAMPLE_SIZE)
            .then(data => {
                if (!cancelled) {
                    setAutoAttackData(data);
                    setIsLoadingAA(false);
                }
            })
            .catch(error => {
                console.error("Error in auto attack worker:", error);
                setIsLoadingAA(false);
            });

        runSkillWorker(context, bigSampleActive ?  skillBigSampleSize : SKILL_DEFAULT_SAMPLE_SIZE)
            .then(data => {
                if (!cancelled) {
                    setSkillData(data);
                    setIsLoadingSkill(false);
                }
            })
            .catch(error => {
                console.error("Error in auto attack worker:", error);
                setIsLoadingSkill(false);
            });

        runMonsterWorker(context, bigSampleActive ?  monsterBigSampleSize : MONSTER_DEFAULT_SAMPLE_SIZE)
            .then(data => {
                if (!cancelled) {
                    setMonsterData(data);
                    setIsLoadingMonster(false);
                }
            })
            .catch(error => {
                console.error("Error in auto attack worker:", error);
                setIsLoadingMonster(false);
            });
    
        return () => {
            cancelled = true;
        };
    }, [Context.player, Context.defender, bigSampleActive, refresh]);

    var shortCode = "en";
    if (i18n.resolvedLanguage) {
        shortCode = i18n.resolvedLanguage.split('-')[0];
    }

    function setTarget(index) {
        if (index == 0) { // Training dummy
            Context.defender = new Entity(Utils.TRAINING_DUMMY);
            setTargetType(index);
        }
        else if (index == 1) { // Other player
            setIsImporting(true);
        }
        else if (index == 2) { // Monster
            showSearch({
                type: "monster", onSet: (res) => {
                    Context.defender = res;
                    setTargetType(index);

                    // Reset the damage done for experience calculations
                    Context.expSettings.teammates[0].totalDamageFactor = 100;
                    for (let i = 1; i < Context.expSettings.teammates.length; i++) {
                        Context.expSettings.teammates[i].totalDamageFactor = 0;
                    }
                }
            });
        }
    }

    function importCharacter(json) {
        Context.defender = new Entity(null);
        Context.defender.unserialize(json);
        setIsImporting(false);
        setTargetType(1);
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

    function setSetting(setting, value) {
        Context.settings[setting] = value;
        setRefresh(!refresh);
    }

    return (
        <div id="calculations">
            <div id="basic-stats">
                <BasicStat title={"Strength"} value={Context.player.getBaseStat("str")}
                    information={"This is your total strength, including any bonuses from equipment or elsewhere."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L290"}
                />

                <BasicStat title={"Stamina"} value={Context.player.getBaseStat("sta")}
                    information={"This is your total stamina, including any bonuses from equipment or elsewhere."}
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
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935"}
                    percentage
                />

                <BasicStat title={"Casting Speed"} value={100 + Context.player.getStat("decreasedcastingtime", true)}
                    information={"This is your current casting speed bonus. Casting speed affects how long it takes you to cast magic skills."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935"}
                    percentage
                />

                <BasicStat
                    title='Healing'
                    value={Context.player.getStat("healing", true)}
                    information='This value increases the amount of healing done by your healing skills.'
                    sourceLink='https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935'
                    percentage
                    optional
                />

                <hr />

                <BasicStat title={"Attack"} value={Context.player.getAttack()}
                    information={"This is your attack. This is an approximated value of your general damage, as your true damage heavily relies on the current context."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L423"}
                />

                <BasicStat title={"Skill Damage"} value={Context.player.getStat("skilldamage", true)}
                    information={"This value is a bonus multiplier for your skill damage."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935"}
                    percentage
                    optional
                />

                <BasicStat title={"PvE Damage"} value={Context.player.getStat("pvedamage", true)}
                    information={"This value is a bonus multiplier for your damage against monsters."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935"}
                    percentage
                    optional
                />

                <BasicStat title={"PvP Damage"} value={Context.player.getStat("pvpdamage", true)}
                    information={"This value is a bonus multiplier for your damage against other players."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935"}
                    percentage
                    optional
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
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935"}
                    percentage
                />

                <BasicStat title={"Block Penetration"} value={Context.player.getStat("blockpenetration", true)}
                    information={"This value lowers your target's chance to block your auto attacks.\n\nThis is a factor, meaning that 50% block penetration will lower your target's block chance by 50%, leaving them with half of what they would have otherwise."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935"}
                    percentage
                    optional
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

                <BasicStat
                    title='Magic Resistance'
                    value={Context.player.getStat('magicdefense', true)}
                    information='This value reduces magic damage received by this percentage.'
                    sourceLink='https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935'
                    percentage
                    optional
                />

                <BasicStat title={"Critical Resist"} value={Context.player.getStat("criticalresist", true)}
                    information={"This value lowers your target's chance to land critical hits against you.\n\nThis is a factor, meaning that 50% critical resist will leave your target with 50% of their original critical chance."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935"}
                    percentage
                />

                <BasicStat
                    title='Incoming Damage'
                    value={Context.player.getStat("incomingdamage", true)}
                    information='This value multiplies the amount of damage you take. Negative values reduce the amount of damage you take.'
                    sourceLink='https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935'
                    percentage
                    optional
                />

                <BasicStat
                    title='PvE Damage Reduction'
                    value={Context.player.getStat('pvedamagereduction', true)}
                    information='This value reduces the amount of damage you take from monsters.'
                    sourceLink='https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935'
                    percentage
                    optional
                />

                <BasicStat
                    title='PvP Damage Reduction'
                    value={Context.player.getStat('pvpdamagereduction', true)}
                    information='This value reduces the amount of damage you take from other players.'
                    sourceLink='https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L935'
                    percentage
                    optional
                />

                <BasicStat title={"Parry"} value={Context.player.getParry()}
                    information={"This is your parry."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L535"}
                />

                <BasicStat title={"Melee Block"} value={Utils.clamp(Context.player.getBlockChance(false, Context.defender), 6.25, 92.5)}
                    information={"How often you block melee attacks from the current target.\n\nThis value may be different than the one you see in the character window as it takes everything into account, such as minimums, maximums and the opponent's stats. This is your true block rate."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L965"}
                    percentage
                />

                <BasicStat title={"Ranged Block"} value={Utils.clamp(Context.player.getBlockChance(true, Context.defender), 6.25, 92.5)}
                    information={"How often you block ranged attacks from the current target.\n\nThis value may be different than the one you see in the character window as it takes everything into account, such as minimums, maximums and the opponent's stats. This is your true block rate."}
                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffentity.js#L965"}
                    percentage
                />
            </div>

            <div id="extra-stats">
                <div className="category-header">
                    <h3>Configuration</h3>
                    <HoverInfo text={"Set configurations for all calculations such as your target, debuffs, and so on."} />
                </div>
                <hr />

                <div id="target-select">
                    <div id="target-options">
                        <div>
                            <input type="radio" id="target-dummy" name="target-type" checked={targetType == 0} onChange={() => setTarget(0)} />
                            <label htmlFor="target-dummy">{i18n.t("training_dummy_target")}</label>
                        </div>
                        <div>
                            <input type="radio" id="target-player" name="target-type" checked={targetType == 1} onChange={() => setTarget(1)} />
                            <label htmlFor="target-player">{i18n.t("player_target")}</label>
                        </div>
                        <div>
                            <input type="radio" id="target-monster" name="target-type" checked={targetType == 2} onChange={() => setTarget(2)} />
                            <label htmlFor="target-monster">{i18n.t("monster_target")}</label>
                        </div>
                    </div>

                    {
                        (targetType == 0 || targetType == 2) && // training dummy or monster
                        <div id="target-information">
                            <div className="column">
                                <b id="target-name">
                                    {Context.defender.monsterProp.name[shortCode] ?? Context.defender.monsterProp.name.en}
                                </b>
                                <BasicStat title={"HP"} value={targetType == 0 ? "∞" : Context.defender.monsterProp.hp} />
                            </div>
                            <div className="column">
                                <BasicStat title={"STR"} value={Context.defender.str} />
                                <BasicStat title={"STA"} value={Context.defender.sta} />
                            </div>
                            <div className="column">
                                <BasicStat title={"DEX"} value={Context.defender.dex} />
                                <BasicStat title={"INT"} value={Context.defender.int} />
                            </div>
                        </div>
                    }

                    {
                        targetType == 1 && // Player
                        <div id="target-information">
                            <div className="column">
                                <b id="target-name">
                                    {Context.defender.buildName}
                                </b>
                                <BasicStat title={"HP"} value={Context.defender.getHP()} />
                            </div>
                            <div className="column">
                                <BasicStat title={"STR"} value={Context.defender.getBaseStat("str")} />
                                <BasicStat title={"STA"} value={Context.defender.getBaseStat("sta")} />
                            </div>
                            <div className="column">
                                <BasicStat title={"DEX"} value={Context.defender.getBaseStat("dex")} />
                                <BasicStat title={"INT"} value={Context.defender.getBaseStat("int")} />
                            </div>
                        </div>
                    }
                </div>

                <div className="grid" style={{marginBottom: "20px"}}>
                    <div>
                        <input type="checkbox" id="missing" checked={Context.settings.missingEnabled} onChange={() => setSetting("missingEnabled", !Context.settings.missingEnabled)} />
                        <label htmlFor="missing">{i18n.t("enable_missing")}</label>
                    </div>

                    <div>
                        <input type="checkbox" id="blocking" checked={Context.settings.blockingEnabled} onChange={() => setSetting("blockingEnabled", !Context.settings.blockingEnabled)} />
                        <label htmlFor="blocking">{i18n.t("enable_blocking")}</label>
                    </div>

                    <div>
                        <input type="checkbox" id="plartyLeader" checked={Context.settings.partyLeaderEnabled} onChange={() => setSetting("partyLeaderEnabled", !Context.settings.partyLeaderEnabled)} />
                        <label htmlFor="plartyLeader">{i18n.t("enable_party_leader")}</label>
                    </div>

                    {
                        (Context.player.equipment.mainhand.itemProp.triggerSkill != undefined && Context.player.equipment.mainhand.itemProp.triggerSkill == 3124) &&
                        <div>
                            <input type="checkbox" id="swordcross" checked={Context.settings.swordcrossEnabled} onChange={() => setSetting("swordcrossEnabled", !Context.settings.swordcrossEnabled)} />
                            <label htmlFor="swordcross">{i18n.t("enable_swordcross")}</label>
                        </div>
                    }

                    {
                        Context.attacker.getStat("skillchance", true, 11389) > 0 &&
                        <div>
                            <input type="checkbox" id="waterbomb" checked={Context.settings.waterbombEnabled} onChange={() => setSetting("waterbombEnabled", !Context.settings.waterbombEnabled)} />
                            <label htmlFor="waterbomb">{i18n.t("enable_waterbomb")}</label>
                        </div>
                    }

                    {
                        Context.attacker.getStat("skillchance", true, 7513) > 0 &&
                        <div>
                            <input type="checkbox" id="lifesteal" checked={Context.settings.lifestealEnabled} onChange={() => setSetting("lifestealEnabled", !Context.settings.lifestealEnabled)} />
                            <label htmlFor="lifesteal">{i18n.t("enable_lifesteal")}</label>
                        </div>
                    }

                </div>

                <div className="row" style={{marginBottom: "20px"}}>
                    <span>{i18n.t("achievement_attack_bonus")}</span>
                    <RangeInput min={0} max={15} onChange={(v) => setSetting("achievementAttackBonus", v)} value={Context.settings.achievementAttackBonus} isRange={true} step={3}/>
                </div>

                <div className="column" style={{width: "fit-content", marginBottom: "20px"}}>
                    <div>
                        <NumberInput min={1} max={100} suffix={"%"} hasButtons={false} label={i18n.t("your_health")} onChange={(v) => setSetting("playerHealthPercent", v)} value={Context.settings.playerHealthPercent} />
                    </div>

                    <div>
                        <NumberInput min={1} max={100} suffix={"%"} hasButtons={false} label={i18n.t("target_health")} onChange={(v) => setSetting("targetHealthPercent", v)} value={Context.settings.targetHealthPercent} />
                    </div>
                </div>

                

                <div className="column flex" style={{width: "fit-content", marginBottom: "20px"}}>
                <button
                    className="flyff-button"
                    onClick={() => setBigSampleActive(true)}
                >
                    {i18n.t("bigger_sample")}
                </button>
                <button
                    className="flyff-button"
                    onClick={() => setBigSampleActive(false)}
                    disabled={!bigSampleActive}
                >
                    {i18n.t("clear_sample")}
                </button>
                </div>
                
                <div className="row" style={{marginBottom: "20px"}}>
                    <span>{i18n.t("aa_sample_size")}</span>
                    <RangeInput min={100} max={AA_MAX_SAMPLE_SIZE} onChange={(v) => setAaBigSampleSize(v) } value={aaBigSampleSize} isRange={false} step={100}/>
                </div>
                
                <div className="row" style={{marginBottom: "20px"}}>
                    <span>{i18n.t("skill_sample_size")}</span>
                    <RangeInput min={100} max={SKILL_MAX_SAMPLE_SIZE} onChange={(v) => setSkillBigSampleSize(v) } value={skillBigSampleSize} isRange={false} step={100}/>
                </div>
                
                <div className="row" style={{marginBottom: "20px"}}>
                    <span>{i18n.t("monster_sample_size")}</span>
                    <RangeInput min={100} max={MONSTER_MAX_SAMPLE_SIZE} onChange={(v) => setMonsterBigSampleSize(v) } value={monsterBigSampleSize} isRange={false} step={100}/>
                </div>

                <div className="category-header">
                    <h3>{i18n.t("calculations_offensive")}</h3>
                    <HoverInfo text={"Information about damage dealt using auto attacks and allocated skills."} />
                </div>
                <hr />
                
                <div className="charts">
                {(isLoadingAA || isLoadingMonster || isLoadingSkill) && <SpinnerOverlay />}
                    <LineChart
                        chartData={autoAttackData}
                        title={"Auto Attack Damage"}
                        info={`This is the result of ${
                            bigSampleActive ? aaBigSampleSize : AA_DEFAULT_SAMPLE_SIZE
                        } simulated auto attacks against the selected target.`}
                        label={"Damage"}
                        sourceLink={
                            "https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffdamagecalculator.js#L50"
                        }
                    />


                        {/* Skills */}

                        {Object.entries(
                            skillData
                        ).map(([skill, data]) => (
                            <LineChart
                            chartData={data}
                            title={
                                (Utils.getSkillById(skill).name[shortCode] ??
                                Utils.getSkillById(skill).name.en) + " Damage"
                            }
                            info={`This is the result of ${
                                bigSampleActive
                                ? skillBigSampleSize
                                : SKILL_DEFAULT_SAMPLE_SIZE
                            } simulated attacks of this skill against the selected target. On the chart is each iteration's final damage, the highest attack highlighted with a white point, and the average of all ${
                                bigSampleActive
                                ? skillBigSampleSize
                                : SKILL_DEFAULT_SAMPLE_SIZE
                            } simulations.`}
                            key={skill}
                            label={"Damage"}
                            sourceLink={
                                "https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffdamagecalculator.js#L50"
                            }
                            skillId={skill}
                            />
                        ))}
                        </div>

                    <div className="category-header">
                        <h3>{i18n.t("calculations_defensive")}</h3>
                        <HoverInfo text={"Information about your defensive capabilities against the current target."} />
                    </div>
                    <hr />

                    <div className="charts">
                    <LineChart
                        chartData={monsterData}
                        title={"Monster Damage"}
                        info={`This is the result of ${
                        bigSampleActive
                            ? monsterBigSampleSize
                            : MONSTER_DEFAULT_SAMPLE_SIZE
                        } simulated attacks taken from the selected target. On the chart is each iteration's final damage, the highest attack highlighted with a white point, and the average of all ${
                        bigSampleActive
                            ? monsterBigSampleSize
                            : MONSTER_DEFAULT_SAMPLE_SIZE
                        } simulations.`}
                        label={"Damage"}
                        sourceLink={
                        "https://github.com/Frostiae/Flyffulator/blob/main/src/tabs/calculations.jsx#L34"
                        }
                    />
                    </div>

                    <div className="category-header">
                        <h3>Other skill calculations</h3>
                        <HoverInfo text={"Other calculations about allocated skills such as healing."} />
                    </div>
                    <hr />

                    <div className="charts">
                        <BasicStat title={"Waterbomb chance"} value={Context.attacker.getStat("skillchance", true, 11389)}
                            information={"This value lowers how much damage you take from auto attacks.\n\nWhile this value is significantly lower than the value you would see in-game, it is the real value used during damage calculations."}
                            sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/tabs/calculations.jsx#L147"}
                            percentage
                        />

                        {/* Healing Skills */}

                        {
                            Object.entries(generateHealing()).map(([skill, data]) =>
                                <BasicStat key={skill} title={(Utils.getSkillById(skill).name[shortCode] ?? Utils.getSkillById(skill).name.en) + " Healing"} value={data}
                                    sourceLink={"https://github.com/Frostiae/Flyffulator/blob/main/src/flyff/flyffdamagecalculator.js#L11"}
                                />
                            )
                        }
                    </div>

                </div>

            <ImportCharacter open={isImporting} onImport={importCharacter} close={() => setIsImporting(false)} />
        </div>
    )
}

export default Calculations;
