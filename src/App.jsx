import { useState } from 'react';
import { useTranslation } from "react-i18next";
import { SearchProvider } from './searchcontext';
import { TooltipProvider } from './tooltipcontext';

import './styles/App.scss';
import Context from './flyff/flyffcontext';
import Classes from './assets/Classes.json';
import * as Utils from './flyff/flyffutils';
import Search from './components/shared/search';
import Tooltip from './components/shared/tooltip';
import Dropdown from './components/shared/dropdown';
import Equipment from './components/equipment/equipment';
import NumberInput from './components/shared/numberinput';
import Experience from './components/experience/experience';
import ImportCharacter from './components/base/importcharacter';
import SkillsBuffs from './components/skillsandbuffs/skillsbuffs';
import Calculations from './components/calculations/calculations';

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
    if (Context.player[statKey] != statValue) {
      Context.player[statKey] = statValue;

      // If we have negative remaining stat points, remove enough from other stats to make up for it.
      let remainder = Context.player.getRemainingStatPoints();
      const otherStats = ["str", "sta", "dex", "int"]
        .filter(s => s !== statKey)
        .sort((a, b) => Context.player[a] - Context.player[b]);

      while (remainder < 0 && otherStats.length > 0) {
        const nextStat = otherStats.pop();
        const nextStatValue = Math.max(15, Context.player[nextStat] + remainder); // reminder: remainder is negative
        remainder += Context.player[nextStat] - nextStatValue;
        Context.player[nextStat] = nextStatValue;
      }

      setState(!state); // Just to re-render...
    }
  }

  async function share() {
    const buildName = prompt(t("enter_build_name"));
    
    if (buildName === null || buildName.length === 0) {
      return;
    }

    const json = Context.player.serialize(buildName);
    try {
      await navigator.clipboard.writeText(json);
      alert("The build's JSON was copied to your clipboard.");
    }
    catch (e) {
      console.error(e); // Some extensions block clipboard access randomly
      alert("Something prevented access to your clipboard. Please try again.")
    }
  }

  function importCharacter(json) {
    const deserialized = Context.player.unserialize(json);
    setIsImporting(false);
    const buildName = deserialized.buildName ?? 'Imported';
    const key = `${buildName}_${Utils.getGuid()}`;
    localStorage.setItem(key, Context.player.serialize());
    loadBuild(key);
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
    // Invalidate old flyffulator builds
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith("i18next")) {
        continue;
      }

      const build = localStorage.getItem(key);
      if (build.includes("\"appliedStats\":")) {
        toRemove.push(key);
      }
    }

    for (const key of toRemove) {
      localStorage.removeItem(key);
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith("i18next")) {
        continue;
      }

      loadBuild(localStorage.key(i));
      break;
    }
  }

  function removeBuild(key) {
    if (confirm("Are you sure you want to remove this build?")) {
      localStorage.removeItem(key);
      if (loadedBuild == key) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith("i18next")) {
            continue;
          }

          loadBuild(localStorage.key(i));
          break;
        }
      }
      setState(!state);
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
                  <Dropdown onRemove={removeBuild} options={buildOptions} onSelectionChanged={loadBuild} valueKey={loadedBuild} />
                </div>

              }
            </div>
            <div id="build-stats">
              <div className="stat-block">
                <NumberInput min={Context.player.job.minLevel} max={Context.player.job.maxLevel} label={"Level"} onChange={(v) => setPlayerStat("level", v)} value={Context.player.level} />
                <i>{Context.player.getRemainingStatPoints()} {t("stat_points_available")}</i>
              </div>
              <div className="stat-block">
                <div className="stat-row">
                  <NumberInput min={15} max={15 + Context.player.level * 2 - 2} label={"STR"} onChange={(v) => setPlayerStat("str", v)} value={Context.player.str} />
                </div>
                <div className="stat-row">
                  <NumberInput min={15} max={15 + Context.player.level * 2 - 2} label={"STA"} onChange={(v) => setPlayerStat("sta", v)} value={Context.player.sta} />
                </div>
              </div>
              <div className="stat-block">
                <div className="stat-row">
                  <NumberInput min={15} max={15 + Context.player.level * 2 - 2} label={"DEX"} onChange={(v) => setPlayerStat("dex", v)} value={Context.player.dex} />
                </div>
                <div className="stat-row">
                  <NumberInput min={15} max={15 + Context.player.level * 2 - 2} label={"INT"} onChange={(v) => setPlayerStat("int", v)} value={Context.player.int} />
                </div>
              </div>
            </div>
            <div id="build-share">
              <button className='flyff-button' onClick={save}>{t("build_share_save")}</button>
              <div>
                <button className='flyff-button' onClick={share}>{t("build_share_share")}</button>
                <button className='flyff-button' onClick={() => setIsImporting(true)}>{t("build_share_import")}</button>
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
            <button onClick={() => setCurrentTab(3)} className={"tab-button" + (currentTab == 3 ? " active" : "")}>
              <div className="tab-button-border"></div>
              {t("experience_tab_name")}
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
          {
            currentTab == 3 &&
            <Experience />
          }

          <ImportCharacter open={isImporting} onImport={importCharacter} close={() => setIsImporting(false)} />

          <Search />
          <Tooltip />
        </div>
      </SearchProvider>
    </TooltipProvider>
  )
}

export default App
