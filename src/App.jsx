import { useState } from 'react';
import { useTranslation } from "react-i18next";
import { SearchProvider } from './searchcontext';
import { TooltipProvider } from './tooltipcontext';

import './styles/App.scss';
import Equipment from './tabs/equipment';
import Search from './components/search';
import Tooltip from './components/tooltip';
import Context from './flyff/flyffcontext';
import Classes from './assets/Classes.json';
import * as Utils from './flyff/flyffutils';
import Dropdown from './components/dropdown';
import SkillsBuffs from './tabs/skillsbuffs';
import Calculations from './tabs/calculations';
import ImportCharacter from './components/importcharacter';


function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [loadedBuild, setLoadedBuild] = useState(null);
  const [state, setState] = useState(false); // To force re-render. this is probably bad design but i dont care
  const { t } = useTranslation();

  const jobOptions = {};
  for (const [k, v] of Object.entries(Classes)) {
    jobOptions[k] = v.name.en;
  }

  function changeJob(newJobId) {
    if (newJobId == Context.player.job.id) {
      return;
    }

    Context.player.job = Utils.getClassById(newJobId);
    Context.player.level = Utils.clamp(Context.player.level, Context.player.job.minLevel, Context.player.job.maxLevel);
    Context.player.str = 15;
    Context.player.sta = 15;
    Context.player.dex = 15;
    Context.player.int = 15;

    Context.player.resetEquipment();
    Context.player.skillLevels = {};

    setState(!state); // Just to re-render...
  }

  function setPlayerStat(statKey, statValue) {
    statValue = Number(statValue);
    if (statKey == "level") {
      statValue = Utils.clamp(statValue, Context.player.job.minLevel, Context.player.job.maxLevel);
    }
    else {
      const maxDiff = Context.player.getRemainingStatPoints();
      if (statValue - Context.player[statKey] > maxDiff) {
        statValue = Context.player[statKey] + maxDiff;
      }
    }

    Context.player[statKey] = statValue;
    setState(!state); // Just to re-render...
  }

  async function share() {
    const json = Context.player.serialize();
    await navigator.clipboard.writeText(json);
  }

  function importCharacter(json) {
    setIsImporting(false);
    Context.player.unserialize(json);
  }

  const buildOptions = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    //Dont try to load the key saved from i18n
    if (key.startsWith("i18next")) {
      continue;
    }

    buildOptions[key] = key.split("_")[0];
  }

  function save() {
    // Crude way of saving for now
    const buildName = prompt(t("enter_build_name"));
    if (buildName == null || buildName.length == 0) {
      return;
    }

    const key = `${buildName}_${Utils.getGuid()}`;
    localStorage.setItem(key, Context.player.serialize());
    loadBuild(key);
  }

  function loadBuild(key) {
    Context.player.unserialize(localStorage.getItem(key));
    setLoadedBuild(key);
    setState(!state);
  }

  if (loadedBuild == null) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith("i18next")) {
        continue;
      }
  
      loadBuild(localStorage.key(i));
      break;
    }
  }

  return (
    <TooltipProvider>
      <SearchProvider>
        <div className="app">
          <div id="build-header">
            <img src={`https://api.flyff.com/image/class/target/${Utils.getClassById(Context.player.job.id).icon}`} alt="elementor" />
            <div id="build-job" style={{ fontWeight: "200" }}>
              <Dropdown options={jobOptions} onSelectionChanged={changeJob} valueKey={Context.player.job.id} />
              {t("flyff_universe_character_simulator")}
              {
                Object.entries(buildOptions).length > 0 &&
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  {t("loaded_build")}
                  <Dropdown options={buildOptions} onSelectionChanged={loadBuild} valueKey={loadedBuild} />
                </div>

              }
            </div>
            <div id="build-stats">
              <div className="stat-block">
                <label htmlFor="stats-level">Level</label>
                <input type="number" id="stats-level" value={Context.player.level} onChange={(e) => setPlayerStat("level", e.target.value)} />
                <i>{Context.player.getRemainingStatPoints()} {t("stat_points_available")}</i>
              </div>
              <div className="stat-block">
                <div className="stat-row">
                  <label htmlFor="stats-str">STR</label>
                  <input type="number" id="stats-str" value={Context.player.str} onChange={(e) => setPlayerStat("str", e.target.value)} />
                </div>
                <div className="stat-row">
                  <label htmlFor="stats-sta">STA</label>
                  <input type="number" id="stats-sta" value={Context.player.sta} onChange={(e) => setPlayerStat("sta", e.target.value)} />
                </div>
              </div>
              <div className="stat-block">
                <div className="stat-row">
                  <label htmlFor="stats-dex">DEX</label>
                  <input type="number" id="stats-dex" value={Context.player.dex} onChange={(e) => setPlayerStat("dex", e.target.value)} />
                </div>
                <div className="stat-row">
                  <label htmlFor="stats-int">INT</label>
                  <input type="number" id="stats-int" value={Context.player.int} onChange={(e) => setPlayerStat("int", e.target.value)} />
                </div>
              </div>
            </div>
            <div id="build-share">
              <button className='flyff-button' onClick={save}>{t("build_share_save")}</button>
              <div>
                <button className='flyff-button' onClick={share} disabled>{t("build_share_share")}</button>
                <button className='flyff-button' onClick={() => setIsImporting(true)} disabled>{t("build_share_import")}</button>
              </div>
            </div>
          </div>
          <div id="tab-container">
            <button onClick={() => setCurrentTab(0)} className={"tab-button" + (currentTab == 0 ? " active" : "")}>
              <div className="tab-button-border"></div>
              {t("equipment_tab_name")}
            </button>
            <button onClick={() => setCurrentTab(1)} className={"tab-button" + (currentTab == 1 ? " active" : "")}>
              <div className="tab-button-border"></div>
              {t("skills_and_buffs_tab_name")}
            </button>
            <button onClick={() => setCurrentTab(2)} className={"tab-button" + (currentTab == 2 ? " active" : "")}>
              <div className="tab-button-border"></div>
              {t("calculations_tab_name")}
            </button>
          </div>
          {
            currentTab == 0 &&
            <Equipment />
          }
          {
            currentTab == 1 &&
            <SkillsBuffs />
          }
          {
            currentTab == 2 &&
            <Calculations />
          }

          <ImportCharacter open={isImporting} onImport={importCharacter} />

          <Search />
          <Tooltip />
        </div>
      </SearchProvider>
    </TooltipProvider>
  )
}

export default App
