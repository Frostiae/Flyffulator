const FILES = [
  'Items', 
  'Monsters', 
  'Skills', 
  'Classes', 
  'Achievements',
  'Blessings',
  'EquipSets',
  'HousingNPCs',
  'LevelDifferencePenalties',
  'PartySkills',
  'Pets',
  'SkillAwakes',
  'Skills',
  'StatAwakes',
  'StatNames',
  'UpgradeBonus'
];

export const API = {};

export async function loadData() {
  await Promise.all(
    FILES.map(async (name) => {
      API[name] = await fetch(`/data/${name}.json`).then(r => r.json());
    })
  );
}
