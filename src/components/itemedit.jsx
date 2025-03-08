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
    const allStatAwakeningParameters = ["None", ...new Set(Utils.getAvailableStatAwakeOptions(null).flatMap((option) => option.abilities.map(ability => ability.parameter)))];
    function getPossibleStatAwakeningParameter(i) {
        const currentAbbilitiesWithoutThis = [...(itemElem?.statAwake?.abilities ?? [])];
        if(currentAbbilitiesWithoutThis[i]) currentAbbilitiesWithoutThis.splice(i, 1)

        const parameters = [
            "None",
            ...new Set(Utils.getAvailableStatAwakeOptions({abilities: currentAbbilitiesWithoutThis})
                .flatMap((option) => option.abilities.map(ability => ability.parameter)))
            ]

        for(const [index, el] of (itemElem?.statAwake?.abilities ?? []).entries()) {
            if(el === null) continue;
            if(index == i) continue;

            parameters.splice(parameters.indexOf(el.parameter), 1)
        }

        return parameters;
    }
    function setStatAwakeOption(index, parameter) {
        if(parameter == "None") {
            if(index == 0) {
                itemElem.statAwake = null;
            } else {
                itemElem.statAwake.abilities.splice(index, 1); 
            }

            setState(!state)
            return;
        }

        if(index == 0) {
            itemElem.statAwake = null;
        } else {
            if(itemElem.statAwake.abilities[index] != null) {
                itemElem.statAwake.abilities.splice(index, 1);
            }
        }
        
        let searchStatAwake = {abilities: [...(itemElem.statAwake?.abilities ?? [])]};
        if(index == 0) searchStatAwake = {abilities: [{parameter: parameter, add: 1, rate: false}]}
        else searchStatAwake.abilities.push({parameter: parameter, add: 1, rate: false})

        const modifiedOptions = Utils.getAvailableStatAwakeOptions(searchStatAwake);
        const foundStatAwake = modifiedOptions.find((statAwakey) => {
            if(statAwakey.abilities.length != searchStatAwake.abilities.length) {
                return false; 
            }

            for(const ability of statAwakey.abilities) {
                if(ability.parameter != parameter) continue;
                if(ability.add !== 1) continue;

                return true; 
            }

            return false;
        })

        const oldStatAwake = [...(itemElem?.statAwake?.abilities ?? [])]
        itemElem.statAwake = {...foundStatAwake};
        itemElem.statAwake.abilities = oldStatAwake;
        itemElem.statAwake.abilities[index] = {...foundStatAwake.abilities.find((e) => e.parameter == parameter)}

        setState(!state)
    }

    function setStatAwakeValue(index, value) {
        if(value == 4) {
            for(const [i, el] of (itemElem.statAwake?.abilities ?? []).entries()) {
                if(i === index) continue;

                itemElem.statAwake.abilities.splice(i, 1)
            }
        }

        itemElem.statAwake.abilities[index].add = value
        setState(!state)
    }

    function getStatAwakeMaxValue(index) {
        let parameter = itemElem.statAwake?.abilities[index]?.parameter
        let currentMax = 0;
        
        const currentAbilitiesWithoutIndex = [...(itemElem?.statAwake?.abilities ?? [])]
        currentAbilitiesWithoutIndex.splice(index, 1);

        for(const option of Utils.getAvailableStatAwakeOptions({abilities: currentAbilitiesWithoutIndex})) {
            for(const ability of option.abilities) {
                if(ability.parameter != parameter) continue;

                currentMax = Math.max(currentMax, ability.add)
            }
        }
        
        return currentMax;
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
                        options={allStatAwakeningParameters}
                        onSelectionChanged={(i) => {setStatAwakeOption(0, allStatAwakeningParameters[i])}}
                        valueKey={Math.max(allStatAwakeningParameters.indexOf(itemElem.statAwake?.abilities[0]?.parameter), 0)}
                        style={{ minWidth: "200px" }}
                    />
                    <div className="row">
                        <RangeInput
                            key={itemElem.statAwake?.abilities[0]?.parameter ?? "null0"}
                            disabled={itemElem.statAwake?.abilities[0] == null}
                            onChange={(x) => setStatAwakeValue(0, x)}
                            value={itemElem.statAwake?.abilities[0]?.add ?? 1}
                            prefix={"+"}
                            step={1}
                            min={1}
                            max={getStatAwakeMaxValue(0)}
                        />
                    </div>

                    <Dropdown
                        options={getPossibleStatAwakeningParameter(1)}
                        onSelectionChanged={(i) => {setStatAwakeOption(1, getPossibleStatAwakeningParameter(1)[i])}}
                        valueKey={Math.max(getPossibleStatAwakeningParameter(1).indexOf(itemElem.statAwake?.abilities[1]?.parameter), 0)}
                        style={{ minWidth: "200px" }}
                    />
                    <div className="row">
                        <RangeInput
                            key={itemElem.statAwake?.abilities[1]?.parameter ?? "null1"}
                            disabled={itemElem.statAwake?.abilities[1] == null}
                            onChange={(x) => setStatAwakeValue(1, x)}
                            value={itemElem.statAwake?.abilities[1]?.add ?? 1}
                            prefix={"+"}
                            step={1}
                            min={1}
                            max={getStatAwakeMaxValue(1)}
                        />
                    </div>
                </div>
            }
        </div>
    );
}

export default ItemEdit;
