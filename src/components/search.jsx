import { useSearch } from "../searchcontext";
import { useState } from "react";

import Slot from '../components/slot';
import pets from "../assets/Pets.json";
import items from "../assets/Items.json";
import Entity from "../flyff/flyffentity";
import skills from "../assets/Skills.json";
import Context from "../flyff/flyffcontext";
import * as Utils from "../flyff/flyffutils";
import ItemElem from "../flyff/flyffitemelem";
import monsters from "../assets/Monsters.json";
import { useTranslation } from "react-i18next";

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

    function getItemElem(itemProp) {
        const item = new ItemElem(itemProp);

        // Inject Demon/Goddess Blessing RandomStats
        if(item.itemProp.category === "fashion" && ['hat', 'cloth', 'gaunts', 'shoes', 'visualcloak', 'glove'].includes(item.itemProp.subcategory)) {
            item.itemProp.possibleRandomStats = [...(item.itemProp.possibleRandomStats ?? []), ...Utils.BOG_BOD_RANDOM_STATS];
            item.randomStats = [null, null]
        }

        return item;
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

                    // Check if the item supports that locale
                    var selectedLanguageItemName = item.name[shortCode] ?? item.name.en;
                    if (selectedLanguageItemName.toLowerCase().includes(query)) {
                        res.push(getItemElem(item));
                        continue;
                    }

                    if (searchProperties.searchByStats && item.abilities != undefined) {
                        for (const ability of item.abilities) {
                            if (ability.parameter != undefined && ability.parameter.toLowerCase().includes(query)) {
                                res.push(getItemElem(item));
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
                    <input type="text" name="query" autoFocus id="search-field" placeholder={i18n.t("search_placeholder", { type: searchProperties.type, })} onChange={e => search(e.target.value)} />
                    {
                        results.length > 0 &&
                        <hr />
                    }
                    <div id="search-results">
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
                                    <span>{result.monsterProp.name.en} (level {result.monsterProp.level})</span>
                                </div>
                            )
                        }

                        {
                            searchProperties.type == "skill" &&
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
                                    <span>{result.name.en}</span>
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
