import { useState } from 'react';
import { useTranslation } from "react-i18next";
import { getExperience } from '../../flyff/flyffexperiencecalculator';

import '../../styles/calculations.scss';
import Dropdown from '../shared/dropdown';
import HoverInfo from '../shared/hoverinfo';
import Entity from '../../flyff/flyffentity';
import RangeInput from '../shared/rangeinput';
import Context from '../../flyff/flyffcontext';
import * as Utils from "../../flyff/flyffutils";
import NumberInput from '../shared/numberinput';
import Teammate from '../../flyff/flyffteammate';
import BarChart from '../calculations/charts/barchart';
import BasicStat from '../calculations/charts/basicstat';

// TODO: This entire file could be optimized quite a bit, as well as the BarChart component

function Experience() {
    const [refresh, setRefresh] = useState(false);
    const [monsterWindow, setMonsterWindow] = useState(0);
    const [madrigalOnly, setMadrigalOnly] = useState(false);
    const { t } = useTranslation();

    var shortCode = "en";
    if (t.resolvedLanguage) {
        shortCode = t.resolvedLanguage.split('-')[0];
    }

    // Set the current player's level just to be sure
    Context.expSettings.teammates[0].level = Context.player.level;

    if (Context.defender.monsterProp == null || Context.defender.monsterProp.dummy) {
        return (
            <div id="experience" style={{ textAlign: "center" }}>
                <p>You must select a <b>monster</b> target in the calculations tab to view experience calculations.</p>
            </div>
        )
    }

    const partySettingOptions = {
        "contribution": "Contribution",
        "level": "Level"
    };

    function setSetting(setting, value) {
        Context.expSettings[setting] = value;
        setRefresh(!refresh);
    }

    function addTeammate() {
        const teammate = new Teammate(Context.player.level);
        Context.expSettings.teammates.push(teammate);
        setRefresh(!refresh);
    }

    function removeTeammate(index) {
        Context.expSettings.teammates.splice(index, 1);
        setRefresh(!refresh);
    }

    function setTeammateDamage(index, damage) {
        const totalHealth = 100;
        const numEnemies = Context.expSettings.teammates.length;
        Context.expSettings.teammates[index].totalDamageFactor = damage;

        // Distribute the damage properly

        let sum = 0;
        for (let teammate of Context.expSettings.teammates) {
            sum += teammate.totalDamageFactor;
        }

        const delta = totalHealth - sum;
        let div = Math.floor(delta / (numEnemies - 1));

        for (let i = 0; i < numEnemies; i++) {
            if (div <= 0 && Context.expSettings.teammates[i].totalDamageFactor <= 0) {
                div += div + Context.expSettings.teammates[i].totalDamageFactor;
            }
        }

        for (let i = 0; i < numEnemies; i++) {
            if (i == index) {
                continue;
            }

            if (div <= 0 && Context.expSettings.teammates[i].totalDamageFactor + div <= 0) {
                Context.expSettings.teammates[i].totalDamageFactor = 0;
                continue;
            }

            Context.expSettings.teammates[i].totalDamageFactor += div;
        }

        setRefresh(!refresh);
    }

    function setTeammateValue(index, key, value) {
        Context.expSettings.teammates[index][key] = value;
        setRefresh(!refresh);
    }

    function getChartData() {
        const data = [];
        for (let i = 0; i < Context.expSettings.teammates.length; ++i) {
            const exp = getExperience(Context.defender, i);

            let name = Context.expSettings.teammates[i].name;
            if (i == 0) {
                name = "You";
            }
            if (name.length == 0) {
                name = `Teammate ${i}`;
            }

            data.push({
                value: exp,
                name: name
            });
        }

        return data;
    }

    function getKillsPerLevel() {
        let monsters = Utils.getMonsterRange(Context.player.level - 2 + monsterWindow, Context.player.level + 10 + monsterWindow);

        // Sort ascending by level
        monsters.sort((a, b) => a.level > b.level);

        monsters = monsters.filter((m) =>
            m.experience > 0 &&
            !m.event &&
            (m.rank == "small" || m.rank == "normal" || m.rank == "captain")
        );

        if (madrigalOnly) {
            monsters = monsters.filter((m) => m.area == "normal");
        }

        let data = [];
        for (let i = 0; i < monsters.length; ++i) {
            const exp = getExperience(new Entity(monsters[i]), 0);
            const kills = Math.floor(100 / exp);

            data.push({
                value: kills,
                name: monsters[i].level + "  " + monsters[i].name.en
            });
        }

        return data;
    }

    return (
        <div id="experience">
            <div className="category-header">
                <h3>Configuration</h3>
                <HoverInfo text={"Set configurations for all calculations such as your target, debuffs, and so on."} />
            </div>
            <hr />

            <div className="row" style={{ alignItems: "start", gap: "20px" }}>
                <div className="column" style={{ maxWidth: "50%" }}>
                    <div id="target-select">
                        <img draggable="false" id="monster-icon" src={`https://api.flyff.com/image/monster/${Context.defender.monsterProp.icon}`} alt={Context.defender.monsterProp.name.en} />
                        <div style={{ display: "flex" }}>
                            <div className="column">
                                <b id="target-name">
                                    {Context.defender.monsterProp.name[shortCode] ?? Context.defender.monsterProp.name.en}
                                </b>
                                <BasicStat title={"HP"} value={Context.defender.monsterProp.hp} />
                            </div>
                            <div className="column">
                                <BasicStat title={"STR"} value={Context.defender.str} />
                                <BasicStat title={"STA"} value={Context.defender.sta} />
                            </div>
                            <div className="column">
                                <BasicStat title={"DEX"} value={Context.defender.dex} />
                                <BasicStat title={"INT"} value={Context.defender.int} />
                            </div>
                            <div className="column">
                                <BasicStat
                                    title={"EXP"}
                                    value={getExperience(Context.defender, 0).toFixed(5)}
                                    percentage={true}
                                    information={"How much experience this monster gives you under the current configurations."}
                                />
                            </div>
                        </div>
                    </div>

                    <hr />

                    <div className="row">
                        Party Setting:
                        <Dropdown options={partySettingOptions} onSelectionChanged={(v) => setSetting("partySetting", v)} valueKey={Context.expSettings.partySetting} style={{ minWidth: "200px" }} />
                    </div>

                    <div className="grid">
                        <div className="row">
                            <input type="checkbox" id="single-target" checked={Context.expSettings.singleTargetBonus} onChange={() => setSetting("singleTargetBonus", !Context.expSettings.singleTargetBonus)} />
                            <label htmlFor="single-target">1v1 Bonus</label>
                            <HoverInfo text={"The single target bonus is applied if the monster loses no more than 20% of its health through AoE damage."} />
                        </div>

                        <div className="row">
                            <NumberInput min={1} max={10} value={Context.expSettings.multiplier} onChange={(v) => setSetting("multiplier", v)} label={"Multiplier"} suffix={"x"} />
                            <HoverInfo text={"Any arbitrary experience multipliers you would like to apply. Useful for simulating experience events or FWC rates."} />
                        </div>
                    </div>

                    <BarChart
                        chartData={getChartData()}
                        title={"Experience Distribution"}
                        info={"How the experience is distributed amongst the party members."}
                        label={"Experience"}
                        percentage={true}
                    />
                </div>

                <div id="team-setup">
                    <div className="category-header">
                        <h3>Your Team</h3>
                        <HoverInfo text={"These are the players in your party who have an effect on your experience gain, such as healers, attackers, leechers, tankers, and so on."} />
                    </div>

                    {
                        Context.expSettings.teammates.map((p, i) =>
                            <div className="teammate" key={i}>
                                <div className="row" style={{ justifyContent: "space-between", alignItems: "start" }}>
                                    <div className="column">
                                        {
                                            i == 0 ?
                                                <h4>
                                                    <i>You</i>
                                                </h4>
                                                :
                                                <h4>
                                                    <i>Name</i>
                                                    <input type="text" value={p.name} placeholder='Name' onChange={(v) => setTeammateValue(i, "name", v.target.value)} />
                                                </h4>
                                        }
                                        {
                                            i == 0 ?
                                                <>Level {Context.player.level}</>
                                                :
                                                <div className="row">
                                                    <NumberInput min={1} max={165} label={"Level"} onChange={(v) => setTeammateValue(i, "level", v)} value={p.level} />
                                                </div>
                                        }
                                    </div>
                                    {
                                        i > 0 &&
                                        <button className="flyff-button" onClick={() => removeTeammate(i)}>Remove</button>
                                    }
                                </div>

                                <div className="grid four">
                                    <div className="row">
                                        <input type="checkbox" id={`healer${i}`} checked={p.healer} onChange={() => setTeammateValue(i, "healer", !p.healer)} />
                                        <label htmlFor={`healer${i}`}>Healer</label>
                                    </div>

                                    <div className="row">
                                        <input type="checkbox" id={`tanker${i}`} checked={p.tanker} onChange={() => setTeammateValue(i, "tanker", !p.tanker)} />
                                        <label htmlFor={`tanker${i}`}>Tanker</label>
                                    </div>

                                    <div className="row">
                                        <input type="checkbox" id={`master${i}`} checked={p.master} onChange={() => setTeammateValue(i, "master", !p.master)} />
                                        <label htmlFor={`master${i}`}>Master</label>
                                    </div>

                                    <div className="row">
                                        <input type="checkbox" id={`cheer${i}`} checked={p.cheered} onChange={() => setTeammateValue(i, "cheered", !p.cheered)} />
                                        <label htmlFor={`cheer${i}`}>Cheered</label>
                                    </div>
                                </div>

                                <div className="row">
                                    <span>Damage Done</span>
                                    <RangeInput disabled={Context.expSettings.teammates.length <= 1} min={0} max={100} value={p.totalDamageFactor} step={1} isRange={true} onChange={(v) => setTeammateDamage(i, v)} />
                                </div>
                                <hr />
                            </div>
                        )
                    }
                    {
                        Context.expSettings.teammates.length < 7 &&
                        <div>
                            <br />
                            <button className="flyff-button" onClick={addTeammate}>Add Teammate</button>
                        </div>
                    }
                </div>
            </div>

            <div className="category-header">
                <h3>Calculations</h3>
                <HoverInfo text={"Other miscellaneous experience calculations."} />
            </div>
            <hr />

            <div className="row">
                Level Range Offset
                <RangeInput min={-2} max={5} value={monsterWindow} step={1} onChange={(v) => setMonsterWindow(v)} showValue={false} />
            </div>

            <div className="row">
                <input type="checkbox" id="madrigalOnly" checked={madrigalOnly} onChange={() => setMadrigalOnly(!madrigalOnly)} />
                <label htmlFor="madrigalOnly">Madrigal Only</label>
            </div>

            <BarChart
                chartData={getKillsPerLevel()}
                title={"Kills per Level"}
                info={"How many kills it takes to gain one level. Lower is better."}
                label={"Kills"}
                percentage={false}
                highlightMin={true}
            />
        </div>
    )
}

export default Experience;
