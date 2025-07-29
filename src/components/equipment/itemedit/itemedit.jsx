import { useState } from 'react';
import { useSearch } from '../../../searchcontext';
import { useTranslation } from "react-i18next";

import Slot from '../inventory/slot';
import Dropdown from '../../shared/dropdown';
import RangeInput from '../../shared/rangeinput';
import NumberInput from '../../shared/numberinput';
import * as Utils from '../../../flyff/flyffutils';
import blessings from '../../../assets/Blessings.json';
import skillAwakes from '../../../assets/SkillAwakes.json';

function ItemEdit({ itemElem }) {
    const [state, setState] = useState(false);
    const { showSearch } = useSearch();
    const { i18n } = useTranslation();
    var shortCode = "en";
    if (i18n.resolvedLanguage) {
        shortCode = Utils.getFlyffLanguageShortCodeFromLanguage(i18n);
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
        possibleBlessings[parameter] = Utils.getStatNameByIdOrDefault(parameter, i18n);
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
            type: "item", subcategory: "piercingcard", searchByStats: true, targetItemLevel: itemElem.itemProp.level, onSet: (cardItem) => {
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

    function setStatAwakeParameter(param, index) {
        if (param === "none") {
            itemElem.statAwake[index] = null;
        }
        else {
            itemElem.statAwake[index] = { parameter: param, value: 1 };
        }

        setState(!state);
    }

    function setStatAwakeValue(value, index) {
        itemElem.statAwake[index].value = value;
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

    function toggleElementStone() {
        itemElem.hasElementStone = !itemElem.hasElementStone;
        setState(!state);
    }

    return (
        <div className="item-edit">
            <div id="edit-header">
                <Slot className={"slot-item"} content={itemElem} />
                {itemElem.itemProp.name[shortCode] ?? itemElem.itemProp.name.en}

                {
                    itemElem.getMaximumUpgradeLevel() > 0 &&
                    <NumberInput hasButtons min={0} max={itemElem.getMaximumUpgradeLevel()} value={itemElem.upgradeLevel} onChange={setUpgradeLevel} label={"+"} />
                }
            </div>
            <p style={{ maxWidth: "300px", fontStyle: "italic", margin: "0" }}>
                {itemElem.itemProp.description.en != "null" && (itemElem.itemProp.description[shortCode] ?? itemElem.itemProp.description.en)}
            </p>
            {
                itemElem.isStatAwakeAble() &&
                <div className="column">
                    <h3>Stat Awake</h3>
                    <Dropdown options={Utils.getPossibleStatAwakeParams(itemElem.statAwake[1]?.parameter, itemElem.itemProp.level, i18n)} onSelectionChanged={(v) => setStatAwakeParameter(v, 0)} valueKey={itemElem.statAwake[0]?.parameter ?? "none"} style={{ minWidth: "100px" }} />

                    <RangeInput
                        onChange={(e) => setStatAwakeValue(e, 0)}
                        value={itemElem.statAwake[0]?.value ?? 0}
                        prefix={"+"}
                        step={1}
                        disabled={itemElem.statAwake[0] == null}
                        allowedValues={Utils.getPossibleStatAwakeValues(itemElem.statAwake[0]?.parameter ?? "none", itemElem.statAwake[1]?.parameter ?? "none", itemElem.statAwake[1]?.value ?? 0, itemElem.itemProp.level)}
                    />

                    <Dropdown options={Utils.getPossibleStatAwakeParams(itemElem.statAwake[0]?.parameter, itemElem.itemProp.level, i18n)} onSelectionChanged={(v) => setStatAwakeParameter(v, 1)} valueKey={itemElem.statAwake[1]?.parameter ?? "none"} style={{ minWidth: "100px" }} />

                    <RangeInput
                        onChange={(e) => setStatAwakeValue(e, 1)}
                        value={itemElem.statAwake[1]?.value ?? 0}
                        prefix={"+"}
                        step={1}
                        disabled={itemElem.statAwake[1] == null}
                        allowedValues={Utils.getPossibleStatAwakeValues(itemElem.statAwake[1]?.parameter ?? "none", itemElem.statAwake[0]?.parameter ?? "none", itemElem.statAwake[0]?.value ?? 0, itemElem.itemProp.level)}
                    />
                </div>
            }

            {
                itemElem.statRanges.length > 0 &&
                <div className="column">
                    <h3>{i18n.t("itemedit_stat_ranges")}</h3>
                    {
                        itemElem.statRanges.map((ability, index) =>
                            <div className="row" key={index}>
                                {ability.parameter}
                                <RangeInput
                                    min={Math.min(ability.add, ability.addMax)}
                                    max={Math.max(ability.addMax, ability.add)}
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
                    <h3>{i18n.t("itemedit_random_bonus_ultimate")}</h3>
                    <Dropdown options={possibleRandomStats} onSelectionChanged={(e) => setRandomStatOption(0, e)} valueKey={itemElem.randomStats[0]?.id} style={{ minWidth: "200px" }} />
                    <RangeInput
                        min={itemElem.randomStats[0]?.add ?? 0}
                        max={itemElem.randomStats[0]?.addMax ?? 1}
                        onChange={(e) => setRandomStatValue(0, e)}
                        value={itemElem.randomStats[0]?.value ?? 0}
                        isRange={itemElem.randomStats[0]?.rate ?? true}
                        prefix={"+"}
                        step={0.1}
                    />

                    <Dropdown options={possibleRandomStats} onSelectionChanged={(e) => setRandomStatOption(1, e)} valueKey={itemElem.randomStats[1]?.id} style={{ minWidth: "200px" }} />
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
            }

            {
                (itemElem.itemProp.category == "fashion" && itemElem.itemProp.subcategory != "mask") &&
                <div className="column">
                    <h3>{i18n.t("itemedit_goddess_demons")}</h3>
                    <Dropdown options={possibleBlessings} onSelectionChanged={(e) => setBlessingOption(0, e)} valueKey={itemElem.randomStats[0]?.id ?? 0} style={{ minWidth: "200px" }} />
                    <RangeInput
                        onChange={(e) => setRandomStatValue(0, e)}
                        value={itemElem.randomStats[0]?.value ?? 0}
                        isRange={itemElem.randomStats[0]?.rate ?? true}
                        prefix={"+"}
                        step={0.1}
                        disabled={itemElem.randomStats[0] == null}
                        allowedValues={itemElem.randomStats[0] ? getAllowedBlessingValues(itemElem.randomStats[0].parameter) : [0, 1]}
                    />

                    <Dropdown options={possibleBlessings} onSelectionChanged={(e) => setBlessingOption(1, e)} valueKey={itemElem.randomStats[1]?.id ?? 0} style={{ minWidth: "200px" }} />
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
            }

            {
                itemElem.isElementUpgradeAble() &&
                <div className="column">
                    <h3>Element</h3>
                    <Dropdown options={possibleElementValues} onSelectionChanged={setElement} valueKey={itemElem.element} />
                    <div className="row">
                        <NumberInput disabled={itemElem.element == "none"} hasButtons min={0} max={10} value={itemElem.elementUpgradeLevel} onChange={setElementUpgradeLevel} label={"+"} />
                    </div>
                </div>
            }

            {
                (itemElem.element != "none" && itemElem.elementUpgradeLevel > 0) &&
                <div>
                    <input type="checkbox" id="element-stone" checked={itemElem.hasElementStone} onChange={() => toggleElementStone()} />
                    <label htmlFor="element-stone">Element stone</label>
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
        </div>
    );
}

export default ItemEdit;
