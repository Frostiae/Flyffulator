import { useState } from 'react';
import { useSearch } from '../searchcontext';
import { useTranslation } from "react-i18next";

import Slot from './slot';
import Dropdown from './dropdown';
import RangeInput from './rangeinput';
import NumberInput from './numberinput';
import * as Utils from '../flyff/flyffutils';
import skillAwakes from '../assets/SkillAwakes.json';

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
            type: "item", subcategory: "piercingcard", onSet: (cardItem) => {
                itemElem.piercings[index] = cardItem;
            }
        });
    }

    function setJewelSlot(index) {
        showSearch({
            type: "item", subcategory: "ultimatejewel", onSet: (jewel) => {
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
                itemElem.skillAwake = { id: option, skill: option, add: range.min + (range.max - range.min) / 2 };
            }
            else {
                // Is a param
                itemElem.skillAwake = { id: option, parameter: option, add: range.min + (range.max - range.min) / 2 };
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

    return (
        <div className="item-edit">
            <div id="edit-header">
                <Slot className={"slot-item"} content={itemElem} />
                {itemElem.itemProp.name.en}

                {
                    itemElem.getMaximumUpgradeLevel() > 0 &&
                    <NumberInput hasButtons min={0} max={itemElem.getMaximumUpgradeLevel()} value={itemElem.upgradeLevel} onChange={(v) => { itemElem.upgradeLevel = v; }} label={"+"} />
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
                    <h3>Random Bonus</h3>
                    <Dropdown options={possibleRandomStats} onSelectionChanged={(e) => setRandomStatOption(0, e)} valueKey={itemElem.randomStats[0].id} />
                    <div className="row">
                        <RangeInput
                            min={itemElem.randomStats[0].add}
                            max={itemElem.randomStats[0].addMax}
                            onChange={(e) => setRandomStatValue(0, e)}
                            value={itemElem.randomStats[0].value}
                            isRange
                            prefix={"+"}
                            step={0.1}
                        />
                    </div>

                    <Dropdown options={possibleRandomStats} onSelectionChanged={(e) => setRandomStatOption(1, e)} valueKey={itemElem.randomStats[1].id} />
                    <div className="row">
                        <RangeInput
                            min={itemElem.randomStats[1].add}
                            max={itemElem.randomStats[1].addMax}
                            onChange={(e) => setRandomStatValue(1, e)}
                            value={itemElem.randomStats[1].value}
                            isRange
                            prefix={"+"}
                            step={0.1}
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
                        <NumberInput hasButtons min={0} max={10} value={itemElem.elementUpgradeLevel} onChange={(v) => { itemElem.elementUpgradeLevel = v; }} label={"+"} />
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
                                    <Slot className={"slot-item slot-editable"} content={itemElem.piercings[i]} />
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
                                    <Slot className={"slot-item slot-editable"} content={itemElem.ultimateJewels[i]} />
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
                    <Dropdown options={possibleSkillAwakeOptions} onSelectionChanged={setSkillAwakeOption} valueKey={itemElem.skillAwake == null ? 0 : itemElem.skillAwake.id} />
                    <div className="row">
                        <RangeInput
                            min={itemElem.skillAwake == null ? 0 : possibleSkillAwakeValues[itemElem.skillAwake.id][0]}
                            max={itemElem.skillAwake == null ? 1 : possibleSkillAwakeValues[itemElem.skillAwake.id].at(-1)}
                            disabled={itemElem.skillAwake == null}
                            onChange={setSkillAwakeValue}
                            value={itemElem.skillAwake == null ? 0 : itemElem.skillAwake.add}
                            isRange
                            prefix={"+"}
                            step={1}
                        />
                    </div>
                </div>
            }
        </div>
    );
}

export default ItemEdit;
