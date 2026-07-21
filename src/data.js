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
  await Promise.all(FILES.map(async (name) => {
    const buf = await fetch(`/data/${name}.json.gz`).then(r => r.arrayBuffer());
    const stream = new Blob([buf]).stream()
      .pipeThrough(new DecompressionStream('gzip'));
    API[name] = JSON.parse(await new Response(stream).text());
  }));
}
