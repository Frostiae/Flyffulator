import { useState } from "react";
import { useSearch } from "../../searchcontext";
import { useTranslation } from "react-i18next";

import Slot from '../equipment/inventory/slot';
import pets from "../../assets/Pets.json";
import items from "../../assets/Items.json";
import Entity from "../../flyff/flyffentity";
import skills from "../../assets/Skills.json";
import Context from "../../flyff/flyffcontext";
import * as Utils from "../../flyff/flyffutils";
import ItemElem from "../../flyff/flyffitemelem";
import monsters from "../../assets/Monsters.json";
import housingNpcs from "../../assets/HousingNPCs.json";

function Search() {
    const { isSearchOpen, searchProperties, hideSearch } = useSearch();
    const [results, setResults] = useState([]);
    const { i18n } = useTranslation();

    var shortCode = "en";
    if (i18n.resolvedLanguage) {
        shortCode = i18n.resolvedLanguage.split('-')[0];
    }

    if (!isSearchOpen) {
        return null;
    }

    function search(query) {
        let res = [];

        if (query.length >= 3) {
            query = query.toLowerCase();

            if (searchProperties.type == "item") {
                for (const [, item] of Object.entries(items)) {
                    if (searchProperties.checkCanUse) {
                        if (!Context.player.canUseItem(item)) {
                            continue;
                        }
                    }

                    if (searchProperties.targetItemLevel != undefined) {
                        if (item.minimumTargetItemLevel != undefined && item.minimumTargetItemLevel > searchProperties.targetItemLevel) {
                            continue;
                        }
                    }

                    if (searchProperties.subcategory != null) {
                        if (searchProperties.subcategory instanceof Array) {
                            if (!searchProperties.subcategory.includes(item.subcategory)) {
                                continue;
                            }
                        }
                        else if (item.subcategory != searchProperties.subcategory) {
                            continue;
                        }
                    }

                    if (searchProperties.category != null) {
                        if (searchProperties.category instanceof Array) {
                            if (!searchProperties.category.includes(item.category)) {
                                continue;
                            }
                        }
                        else if (item.category != searchProperties.category) {
                            continue;
                        }

                        // only display actual pets, not skins or the ones with modified flags                        
                        if (item.category === "raisedpet") {
                            const petFound = Object.values(pets).find((pet) => pet.petItemId === item.id);
                            if (!petFound) {
                                continue;
                            }
                        }
                    }

                    // Powerups are messy, just do their conditions here
                    if (searchProperties.powerup) {
                        let powerupFound = false;
                        if ((item.abilities != undefined && item.duration != undefined) ||
                            item.category == "buff" || item.category == "scroll") {
                            powerupFound = true;
                        }

                        if (!powerupFound) {
                            continue;
                        }
                    }

                    // Check if the item supports that locale
                    var selectedLanguageItemName = item.name[shortCode] ?? item.name.en;
                    if (selectedLanguageItemName.toLowerCase().includes(query)) {
                        res.push(new ItemElem(item));
                        continue;
                    }

                    if (searchProperties.searchByStats && item.abilities != undefined) {
                        for (const ability of item.abilities) {
                            if (ability.parameter != undefined && ability.parameter.toLowerCase().includes(query)) {
                                res.push(new ItemElem(item));
                                break;
                            }
                        }
                    }
                }
            }
            else if (searchProperties.type == "monster") {
                for (const [, monster] of Object.entries(monsters)) {
                    if (monster.name.en.toLowerCase().includes(query)) {
                        res.push(new Entity(monster));
                    }
                }

                res.sort((a, b) => a.level - b.level);
            }
            else if (searchProperties.type == "skill") {
                for (const [, skill] of Object.entries(skills)) {
                    if (skill.name.en.toLowerCase().includes(query)) {
                        res.push(skill);
                    }
                }
            }
            else if (searchProperties.type == "personalOrCoupleHousingNpc") {
                for (const [, housingNpc] of Object.entries(housingNpcs)) {
                    if (!housingNpc.name.en.includes("Personal House NPC")) {
                        continue;
                    }

                    var selectedLanguageNpcName = housingNpc.name[shortCode] ?? housingNpc.name.en;
                    if (selectedLanguageNpcName.toLowerCase().includes(query)) {
                        // Npcs dont have an icon. Assign a more or less fitting icon here
                        housingNpc.icon = "asschecatsre.png"
                        res.push(housingNpc);
                        continue;
                    }

                    if (searchProperties.searchByStats && housingNpc.abilities != undefined) {
                        for (const ability of housingNpc.abilities) {
                            if (ability.parameter != undefined && ability.parameter.toLowerCase().includes(query)) {
                                housingNpc.icon = "asschecatsre.png";
                                res.push(housingNpc);
                                break;
                            }
                        }
                    }
                }
            }
            else if (searchProperties.type == "guildHousingNpc") {
                for (const [, housingNpc] of Object.entries(housingNpcs)) {
                    if (!housingNpc.name.en.includes("Guild House NPC")) {
                        continue;
                    }

                    var selectedLanguageGuildNpcName = housingNpc.name[shortCode] ?? housingNpc.name.en;
                    if (selectedLanguageGuildNpcName.toLowerCase().includes(query)) {
                        // Npcs dont have an icon. Assign a more or less fitting icon here
                        housingNpc.icon = "asschecatsre.png"
                        res.push(housingNpc);
                        continue;
                    }

                    if (searchProperties.searchByStats && housingNpc.abilities != undefined) {
                        for (const ability of housingNpc.abilities) {
                            if (ability.parameter != undefined && ability.parameter.toLowerCase().includes(query)) {
                                housingNpc.icon = "asschecatsre.png";
                                res.push(housingNpc);
                                break;
                            }
                        }
                    }
                }
            };
        }

        setResults(res);
    }

    function close() {
        setResults([]);
        hideSearch();
    }

    function handleItemClick(result) {
        searchProperties.onSet(result);
        close();
    }

    return (
        <div className="search-modal" onClick={close} onKeyDown={(e) => { if (e.key == "Escape") close(); }}>
            <div id="search-box" onClick={(e) => e.stopPropagation()}>
                <div className="window-title">{i18n.t("search_title")}</div>
                <div className="window-content">
                    <input type="text" name="query" autoFocus id="search-field" placeholder={i18n.t("search_placeholder", { type: searchProperties.typeLocalization ? (i18n.t(searchProperties.typeLocalization)) : searchProperties.type, })} onChange={e => search(e.target.value)} />
                    {
                        results.length > 0 &&
                        <hr />
                    }
                    <div id="search-results" tabIndex={-1}>
                        {
                            searchProperties.type == "item" &&
                            results.map(result =>
                                <div id="search-result" key={result.itemProp.id} onClick={() => handleItemClick(result)} tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key == "Enter") {
                                            handleItemClick(result);
                                        }

                                        if (e.key == "ArrowDown") {
                                            e.currentTarget.nextSibling && e.currentTarget.nextSibling.focus();
                                        }
                                        if (e.key == "ArrowUp") {
                                            e.currentTarget.previousSibling && e.currentTarget.previousSibling.focus();
                                        }

                                        e.preventDefault(); // prevent scrolling
                                    }}
                                >
                                    <Slot className={"slot-item"} content={result} />
                                    <span style={{ color: Utils.getItemNameColor(result.itemProp) }}>{result.itemProp.name[shortCode] ?? result.itemProp.name.en}</span>
                                </div>
                            )
                        }

                        {
                            searchProperties.type == "monster" &&
                            results.map(result =>
                                <div id="search-result" key={result.monsterProp.id} onClick={() => handleItemClick(result)} tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key == "Enter") {
                                            handleItemClick(result);
                                        }

                                        if (e.key == "ArrowDown") {
                                            e.currentTarget.nextSibling && e.currentTarget.nextSibling.focus();
                                        }
                                        if (e.key == "ArrowUp") {
                                            e.currentTarget.previousSibling && e.currentTarget.previousSibling.focus();
                                        }

                                        e.preventDefault(); // prevent scrolling
                                    }}
                                >
                                    <img style={{ width: 32, height: 32, objectFit: "contain" }} src={`https://api.flyff.com/image/monster/${result.monsterProp.icon}`} alt={result.monsterProp.name.en} />
                                    <span>{result.monsterProp.name[shortCode] ?? result.monsterProp.name.en} (level {result.monsterProp.level})</span>
                                </div>
                            )
                        }

                        {
                            (searchProperties.type == "skill" || searchProperties.type == "personalOrCoupleHousingNpc" || searchProperties.type == "guildHousingNpc") &&
                            results.map(result =>
                                <div id="search-result" key={result.id} onClick={() => handleItemClick(result)} tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key == "Enter") {
                                            handleItemClick(result);
                                        }

                                        if (e.key == "ArrowDown") {
                                            e.currentTarget.nextSibling && e.currentTarget.nextSibling.focus();
                                        }
                                        if (e.key == "ArrowUp") {
                                            e.currentTarget.previousSibling && e.currentTarget.previousSibling.focus();
                                        }

                                        e.preventDefault(); // prevent scrolling
                                    }}
                                >
                                    <Slot className={"slot-skill"} content={result} />
                                    <span>{result.name[shortCode] ?? result.name.en}</span>
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Search;
