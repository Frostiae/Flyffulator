import { useState } from 'react';
import { useSearch } from '../searchcontext';
import { useTranslation } from "react-i18next";

import Slot from './slot';
import Dropdown from './dropdown';
import RangeInput from './rangeinput';
import NumberInput from './numberinput';
import * as Utils from '../flyff/flyffutils';
import blessings from '../assets/Blessings.json';
import skillAwakes from '../assets/SkillAwakes.json';
import { AlwaysStencilFunc } from 'three';

function ItemEdit({ itemElem }) {
    const [state, setState] = useState(false);
    const { showSearch } = useSearch();
    const { i18n } = useTranslation();
    var shortCode = "en";
    if (i18n.resolvedLanguage) {
        shortCode = i18n.resolvedLanguage.split('-')[0];
    }

    if (itemElem == null) {
        return (
            <div className="item-edit">
                {i18n.t("no_item_selected")}
                <br />
                {i18n.t("no_item_selected_explanation")}
            </div>
        );
    }

    // Random Stats

    const possibleRandomStats = {};
    if (itemElem.itemProp.possibleRandomStats != undefined) {
        for (let i = 0; i < itemElem.itemProp.possibleRandomStats.length; ++i) {
            const ability = itemElem.itemProp.possibleRandomStats[i];
            possibleRandomStats[i] = ability.parameter;
        }
    }

    // Fashion blessings

    const possibleBlessings = { "0": "None" };
    for (const [parameter,] of Object.entries(blessings)) {
        possibleBlessings[parameter] = parameter;
    }

    function getAllowedBlessingValues(parameter) {
        if (parameter == 0) {
            return [0, 1];
        }

        const values = blessings[parameter].map((e) => e.add);
        return values;
    }

    // Skill awakes

    const possibleSkillAwakeValues = {};
    const possibleSkillAwakeOptions = { "0": "None" };
    const skillAwakeCategories = [itemElem.itemProp.subcategory];
    if (itemElem.itemProp.subcategory == "sword" || itemElem.itemProp.subcategory == "axe") {
        skillAwakeCategories.push("swordoraxe");
    }
    else if (itemElem.itemProp.subcategory == "wand" || itemElem.itemProp.subcategory == "staff") {
        skillAwakeCategories.push("wandorstaff");
    }

    for (const [type, value] of Object.entries(skillAwakes)) {
        if (!skillAwakeCategories.includes(type)) {
            continue;
        }

        // Skills
        for (const [skill, rarities] of Object.entries(value.skills)) {
            if (rarities[itemElem.itemProp.rarity] != undefined) {
                possibleSkillAwakeValues[skill] = rarities[itemElem.itemProp.rarity];
            }
            else {
                // Use the highest rarity
                possibleSkillAwakeValues[skill] = rarities[Object.keys(rarities).at(-1)];
            }

            possibleSkillAwakeOptions[skill] = Utils.getSkillById(skill).name.en;
        }

        // Parameters
        for (const [parameter, rarities] of Object.entries(value.parameters)) {
            if (rarities[itemElem.itemProp.rarity] != undefined) {
                possibleSkillAwakeValues[parameter] = rarities[itemElem.itemProp.rarity];
            }
            else {
                // Use the highest rarity
                possibleSkillAwakeValues[parameter] = rarities[Object.keys(rarities).at(-1)];
            }

            possibleSkillAwakeOptions[parameter] = parameter;
        }
    }

    function setPiercingSlot(index) {
        showSearch({
            type: "item", subcategory: "piercingcard", searchByStats: true, onSet: (cardItem) => {
                itemElem.piercings[index] = cardItem;
            }
        });
    }

    function setJewelSlot(index) {
        showSearch({
            type: "item", subcategory: "ultimatejewel", searchByStats: true, onSet: (jewel) => {
                itemElem.ultimateJewels[index] = jewel;
            }
        });
    }

    function setOriginAwakeParameter(param) {
        if (param === "none") {
            itemElem.originAwake = null;
        }
        else {
            itemElem.originAwake = { parameter: param };
        }

        setState(!state);
    }

    function setSkillAwakeOption(option) {
        if (option === "0") {
            itemElem.skillAwake = null;
            setState(!state);
            return;
        }
        else {
            const range = {
                min: possibleSkillAwakeValues[option][0],
                max: possibleSkillAwakeValues[option].at(-1)
            };

            if (!isNaN(parseInt(option))) {
                // Is a skill
                itemElem.skillAwake = { id: option, skill: option, add: possibleSkillAwakeValues[option][Math.floor(possibleSkillAwakeValues[option].length / 2)] };
            }
            else {
                // Is a param
                itemElem.skillAwake = { id: option, parameter: option, add: possibleSkillAwakeValues[option][Math.floor(possibleSkillAwakeValues[option].length / 2)] };
            }

            setState(!state);
        }
    }

    function setSkillAwakeValue(value) {
        itemElem.skillAwake.add = parseFloat(value);
        setState(!state);
    }

    function setStatRange(index, value) {
        itemElem.statRanges[index].value = parseFloat(value);
        setState(!state);
    }

    function setRandomStatOption(index, option) {
        const ability = itemElem.itemProp.possibleRandomStats[option];
        itemElem.randomStats[index] = { ...ability, id: option, value: Math.floor(ability.add + (ability.addMax - ability.add) / 2) }
        setState(!state);
    }

    function setRandomStatValue(index, value) {
        itemElem.randomStats[index].value = parseFloat(value);
        setState(!state);
    }

    function setBlessingOption(index, option) {
        if (option == 0) {
            itemElem.randomStats[index] = null;
        }
        else {
            const values = blessings[option];
            itemElem.randomStats[index] = { ...values[0], id: option, value: values[0].add };
        }

        setState(!state);
    }

    // Element

    const possibleElementValues = {
        "none": "None",
        "fire": "Fire",
        "water": "Water",
        "electricity": "Electric",
        "earth": "Earth",
        "wind": "Wind"
    };

    function setElement(option) {
        itemElem.element = option;

        if (option == "none") {
            itemElem.elementUpgradeLevel = 0;
        }

        setState(!state);
    }

    function setUpgradeLevel(level) {
        itemElem.upgradeLevel = level;
        setState(!state);
    }

    function setElementUpgradeLevel(level) {
        itemElem.elementUpgradeLevel = level;
        setState(!state);
    }

    function fillPiercings(e) {
        if (itemElem.piercings.at(-1)) {
            while (itemElem.piercings.length < itemElem.getMaximumPiercingSlots()) {
                itemElem.piercings.push(itemElem.piercings.at(-1));
            }
        }
        setState(!state);
        e.stopPropagation();
    }

    function clearPiercing(i) {
        itemElem.piercings.splice(i, 1);
        setState(!state);
    }

    function clearJewel(i) {
        itemElem.ultimateJewels.splice(i, 1);
        setState(!state);
    }

    // Stat Awakening
    function getPossibleStatAwakeningParameter(index) {
        const possibleStatAwakeningParameter = ["None"];
        for(const availableOption of Utils.getAvailableStatAwakeOptions(itemElem?.statAwake)) {
            for(const ability of availableOption.abilities) {
                if(!possibleStatAwakeningParameter.includes(ability.parameter)) {
                    possibleStatAwakeningParameter.push(ability.parameter);
                }
            }
        }

        const theOtherParameter = itemElem.statAwake?.abilities[index == 0 ? 1 : 0]?.parameter;
        if(theOtherParameter) {
            possibleStatAwakeningParameter.splice(possibleStatAwakeningParameter.indexOf(theOtherParameter), 1);
        }

        return possibleStatAwakeningParameter;
    }

    function setStatAwakeOption(index, optionId) { 
        const parameter = getPossibleStatAwakeningParameter(index, optionId)[optionId];

        const foundAwake = Utils.getAvailableStatAwakeOptions(itemElem?.statAwake).find((option) => {
            const abilityIndex = option.abilities.findIndex((e) => e.parameter === parameter);
            if(abilityIndex < 0) return false;

            if(option.abilities[abilityIndex].add != 1) {
                return false;
            }

            return true; 
        })

        itemElem.statAwake = foundAwake;

        setState(!state);
    }

    function setStatAwakeValue(index, value) {
        const parameter = itemElem.statAwake.abilities[index].parameter;
        
        const foundAwake = Utils.getAvailableStatAwakeOptions(itemElem?.statAwake, false).find((option) => {
            for(const [i, localAbility] of Object.entries(itemElem.statAwake.abilities)) {
                const abilityIndex = option.abilities.findIndex((e) => e.parameter === localAbility.parameter);
                if(abilityIndex < 0) return false;

                // The stat to be changed
                if(option.abilities[abilityIndex].parameter === parameter) {
                    if(option.abilities[abilityIndex].add != value) {
                        return false; 
                    } 
                } else {
                    if(option.abilities[abilityIndex].add != itemElem.statAwake.abilities[i].add) {
                        return false;   
                    }
                }
            }

            return true;
        })

        itemElem.statAwake = foundAwake;
        

        setState(!state);
    }

    function getStatAwakePossibleRange(index) {
        const range = [4, 0];        
        const parameter = itemElem.statAwake?.abilities[index]?.parameter;

        const theOtherIndex = index == 0 ? 1 : 0;
        const parameterOther = itemElem.statAwake?.abilities[theOtherIndex]?.parameter;

        Utils.getAvailableStatAwakeOptions(itemElem?.statAwake, false).forEach((option) => {
            if(parameterOther) {
                const abilityIndexOther = option.abilities.findIndex((e) => e.parameter === parameterOther)
                
                if(option.abilities[abilityIndexOther].add != itemElem.statAwake.abilities[theOtherIndex].add) {
                    return false; 
                }
            }

            const abilityIndex = option.abilities.findIndex((e) => e.parameter === parameter);
            if(abilityIndex < 0) return false;

            range[0] = Math.min(range[0], option.abilities[abilityIndex].add)
            range[1] = Math.max(range[1], option.abilities[abilityIndex].add)
        })

        return range;
    }

    return (
        <div className="item-edit">
            <div id="edit-header">
                <Slot className={"slot-item"} content={itemElem} />
                {itemElem.itemProp.name.en}

                {
                    itemElem.getMaximumUpgradeLevel() > 0 &&
                    <NumberInput hasButtons min={0} max={itemElem.getMaximumUpgradeLevel()} value={itemElem.upgradeLevel} onChange={setUpgradeLevel} label={"+"} />
                }
            </div>
            <p style={{ maxWidth: "300px", fontStyle: "italic", margin: "0" }}>
                {itemElem.itemProp.description.en != "null" && (itemElem.itemProp.description[shortCode] ?? itemElem.itemProp.description.en)}
            </p>
            {
                itemElem.isOriginAwakeAble() &&
                <div className="column">
                    <h3>Origin Awake</h3>
                    <Dropdown options={{ "none": "None", "str": "STR", "sta": "STA", "dex": "DEX", "int": "INT" }} onSelectionChanged={setOriginAwakeParameter} valueKey={0} />
                    <div className="row">
                        <button className='flyff-button small' disabled={itemElem.originAwake == null}>-</button>
                        <input type="text" disabled value={itemElem.originAwake != null ? itemElem.originAwake.add : 0} />
                        <button className='flyff-button small' disabled={itemElem.originAwake == null}>+</button>
                    </div>
                </div>
            }

            {
                itemElem.statRanges.length > 0 &&
                <div className="column">
                    <h3>Stat Ranges</h3>
                    {
                        itemElem.statRanges.map((ability, index) =>
                            <div className="row" key={index}>
                                {ability.parameter}
                                <RangeInput
                                    min={ability.add}
                                    max={ability.addMax}
                                    onChange={(e) => setStatRange(index, e)}
                                    value={ability.value}
                                    isRange={ability.rate}
                                    prefix={"+"}
                                    step={0.1}
                                />
                            </div>
                        )
                    }
                </div>
            }

            {
                itemElem.itemProp.possibleRandomStats != undefined &&
                <div className="column">
                    <h3>Random Bonus (Ultimate)</h3>
                    <Dropdown options={possibleRandomStats} onSelectionChanged={(e) => setRandomStatOption(0, e)} valueKey={itemElem.randomStats[0]?.id} style={{ minWidth: "200px" }} />
                    <div className="row">
                        <RangeInput
                            min={itemElem.randomStats[0]?.add ?? 0}
                            max={itemElem.randomStats[0]?.addMax ?? 1}
                            onChange={(e) => setRandomStatValue(0, e)}
                            value={itemElem.randomStats[0]?.value ?? 0}
                            isRange={itemElem.randomStats[0]?.rate ?? true}
                            prefix={"+"}
                            step={0.1}
                        />
                    </div>

                    <Dropdown options={possibleRandomStats} onSelectionChanged={(e) => setRandomStatOption(1, e)} valueKey={itemElem.randomStats[1]?.id} style={{ minWidth: "200px" }} />
                    <div className="row">
                        <RangeInput
                            min={itemElem.randomStats[1]?.add ?? 0}
                            max={itemElem.randomStats[1]?.addMax ?? 0}
                            onChange={(e) => setRandomStatValue(1, e)}
                            value={itemElem.randomStats[1]?.value ?? 0}
                            isRange={itemElem.randomStats[1]?.rate ?? true}
                            prefix={"+"}
                            step={0.1}
                        />
                    </div>
                </div>
            }

            {
                itemElem.itemProp.category == "fashion" &&
                <div className="column">
                    <h3>Blessing of the Goddess / Demon</h3>
                    <Dropdown options={possibleBlessings} onSelectionChanged={(e) => setBlessingOption(0, e)} valueKey={itemElem.randomStats[0]?.id ?? 0} style={{ minWidth: "200px" }} />
                    <div className="row">
                        <RangeInput
                            onChange={(e) => setRandomStatValue(0, e)}
                            value={itemElem.randomStats[0]?.value ?? 0}
                            isRange={itemElem.randomStats[0]?.rate ?? true}
                            prefix={"+"}
                            step={0.1}
                            disabled={itemElem.randomStats[0] == null}
                            allowedValues={itemElem.randomStats[0] ? getAllowedBlessingValues(itemElem.randomStats[0].parameter) : [0, 1]}
                        />
                    </div>

                    <Dropdown options={possibleBlessings} onSelectionChanged={(e) => setBlessingOption(1, e)} valueKey={itemElem.randomStats[1]?.id ?? 0} style={{ minWidth: "200px" }} />
                    <div className="row">
                        <RangeInput
                            onChange={(e) => setRandomStatValue(1, e)}
                            value={itemElem.randomStats[1]?.value ?? 0}
                            isRange={itemElem.randomStats[1]?.rate ?? true}
                            prefix={"+"}
                            step={0.1}
                            disabled={itemElem.randomStats[1] == null}
                            allowedValues={itemElem.randomStats[1] ? getAllowedBlessingValues(itemElem.randomStats[1].parameter) : [0, 1]}
                        />
                    </div>
                </div>
            }

            {
                itemElem.isElementUpgradeAble() &&
                <div className="column">
                    <h3>Element</h3>
                    <Dropdown options={possibleElementValues} onSelectionChanged={setElement} valueKey={itemElem.element} />
                    <div className="row">
                        <NumberInput hasButtons min={0} max={10} value={itemElem.elementUpgradeLevel} onChange={setElementUpgradeLevel} label={"+"} />
                    </div>
                </div>
            }

            {
                itemElem.getMaximumPiercingSlots() > 0 &&
                <div className="column">
                    <h3>Piercing Slots {`(${itemElem.piercings.length}/${itemElem.getMaximumPiercingSlots()})`}</h3>
                    <div id="edit-piercing">
                        {
                            Array.from({ length: itemElem.getMaximumPiercingSlots() }, (_, i) => (
                                <div key={i} onClick={() => setPiercingSlot(i)}>
                                    <Slot className={"slot-item slot-editable"} content={itemElem.piercings[i]} onRemove={() => clearPiercing(i)} />
                                    {
                                        i == itemElem.piercings.length - 1 &&
                                        <button className="flyff-button icon" onClick={fillPiercings}>
                                            <img src="double-arrow-right.svg" alt="remove" />
                                        </button>

                                    }
                                </div>
                            ))
                        }
                    </div>
                </div>
            }

            {
                itemElem.getMaximumUltimateJewelSlots() > 0 &&
                <div className="column">
                    <h3>Jewels {`(${itemElem.ultimateJewels.length}/${itemElem.getMaximumUltimateJewelSlots()})`}</h3>
                    <div id="edit-piercing">
                        {
                            Array.from({ length: itemElem.getMaximumUltimateJewelSlots() }, (_, i) => (
                                <div key={i} onClick={() => setJewelSlot(i)}>
                                    <Slot className={"slot-item slot-editable"} content={itemElem.ultimateJewels[i]} onRemove={() => clearJewel(i)} />
                                </div>
                            ))
                        }
                    </div>
                </div>
            }

            {
                itemElem.isSkillAwakeAble() &&
                <div className="column">
                    <h3>Skill Awake</h3>
                    <Dropdown options={possibleSkillAwakeOptions} onSelectionChanged={setSkillAwakeOption} valueKey={itemElem.skillAwake == null ? 0 : itemElem.skillAwake.id} style={{ minWidth: "200px" }} />
                    <div className="row">
                        <RangeInput
                            disabled={itemElem.skillAwake == null}
                            onChange={setSkillAwakeValue}
                            value={itemElem.skillAwake == null ? 0 : itemElem.skillAwake.add}
                            isRange
                            prefix={"+"}
                            step={1}
                            allowedValues={itemElem.skillAwake ? possibleSkillAwakeValues[itemElem.skillAwake.id] : [0, 1]}
                        />
                    </div>
                </div>
            }

            {
                itemElem.isStatAwakeAble() &&
                <div className="column">
                    <h3>Stat Awake</h3>
                    <Dropdown
                        options={getPossibleStatAwakeningParameter(0, itemElem ?? null)}
                        onSelectionChanged={(optionId) => setStatAwakeOption(0, optionId)}
                        valueKey={itemElem.statAwake?.abilities[0] == null ? 0 : getPossibleStatAwakeningParameter(0, itemElem ?? null).indexOf(itemElem.statAwake.abilities[0].parameter)}
                        style={{ minWidth: "200px" }}
                    />
                    <div className="row">
                        <RangeInput
                            disabled={itemElem.statAwake?.abilities[0] == null}
                            onChange={(x) => setStatAwakeValue(0, x)}
                            value={itemElem.statAwake?.abilities[0]?.add ?? 0}
                            prefix={"+"}
                            step={1}
                            min={getStatAwakePossibleRange(0)[0]}
                            max={getStatAwakePossibleRange(0)[1]}
                        />
                    </div>

                    <Dropdown
                        options={getPossibleStatAwakeningParameter(1, itemElem ?? null)}
                        onSelectionChanged={(optionId) => setStatAwakeOption(1, optionId)}
                        valueKey={itemElem.statAwake?.abilities[1] == null ? 0 : getPossibleStatAwakeningParameter(1, itemElem ?? null).indexOf(itemElem.statAwake.abilities[1].parameter)}
                        style={{ minWidth: "200px" }}
                    />
                    <div className="row">
                        <RangeInput
                            disabled={itemElem.statAwake?.abilities[1] == null}
                            onChange={(x) => setStatAwakeValue(1, x)}
                            value={itemElem.statAwake?.abilities[1]?.add ?? 0}
                            prefix={"+"}
                            step={1}
                            min={getStatAwakePossibleRange(1)[0]}
                            max={getStatAwakePossibleRange(1)[1]}
                        />
                    </div>
                </div>
            }
        </div>
    );
}

export default ItemEdit;
