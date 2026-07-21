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
    const res = await fetch(`/data/${name}.json.gz`);
    if (res.headers.get("content-encoding") === "gzip") {
      API[name] = await res.json();
    }
    else {
      const buf = await res.arrayBuffer();
      const stream = new Blob([buf]).stream()
        .pipeThrough(new DecompressionStream('gzip'));
      API[name] = JSON.parse(await new Response(stream).text());
    }
  }));
}
