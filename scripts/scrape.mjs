#!/usr/bin/env node
/**
 * Flyffulator asset scraper.
 *
 * Regenerates the game-data JSON files under src/assets/ that are backed by the
 * public Flyff Universe API (https://api.flyff.com). The API exposes a few
 * different shapes, so the scraper handles three kinds of source:
 *
 *   - id-list collections (class, skill, monster, item, equipset, partyskill):
 *     fetch the id list from the collection endpoint, batch-fetch the full
 *     objects, and assemble a keyed { [id]: object } map.
 *   - whole-endpoint assets (statawake, skillawake, upgradebonus, pets): the
 *     entire endpoint response IS the file (an array or object), optionally
 *     transformed into the shape the app expects.
 *   - housing NPCs: fetch the housing pack list, batch-fetch pack details, and
 *     keep only the NPCs that grant abilities (see scrapeHousingNpcs).
 *
 * The remaining files are curated by hand and deliberately left alone. Blessings
 * and LevelDifferencePenalties have no endpoint at all. Achievements DO have an
 * API endpoint, but it exposes neither the achievement stat bonuses nor the
 * overhead logo images the app needs, so Achievements.json is maintained
 * manually (see src/assets/Achievements.json and public/fwc2026_*.png).
 *
 * Two whole-endpoint quirks are reconciled here:
 *   - /upgradelevelbonus omits the element attack/defense fields the damage
 *     calculator relies on, so those are merged back in from the existing file.
 *   - /raisedpet returns an array; it's keyed by pet item id to match the app.
 *
 * StatNames.json is a special case: it has no list endpoint, so its id set is
 * derived from the file itself plus every parameter referenced by the game data,
 * and each is fetched from /language/parameter/<id>.
 *
 * Usage:
 *   node scripts/scrape.mjs                # scrape everything (incl. statnames)
 *   node scripts/scrape.mjs item skill     # scrape only the named collections
 *   node scripts/scrape.mjs statnames      # regenerate StatNames.json only
 *   node scripts/scrape.mjs housingnpcs    # regenerate HousingNPCs.json only
 *   node scripts/scrape.mjs --dry-run      # fetch + report, but don't write files
 */

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, "..", "src", "assets");
const API_BASE = "https://api.flyff.com";

// Id-list collections: a list endpoint returns the ids, then the full objects
// are batch-fetched by id. Other API-backed assets are handled by
// WHOLE_ENDPOINTS and scrapeHousingNpcs; the curated files (see the header
// comment) have no endpoint and are never touched.
const COLLECTIONS = [
    { name: "class", endpoint: "class", file: "Classes.json" },
    { name: "skill", endpoint: "skill", file: "Skills.json" },
    { name: "monster", endpoint: "monster", file: "Monsters.json" },
    { name: "item", endpoint: "item", file: "Items.json" },
    { name: "equipset", endpoint: "equipset", file: "EquipSets.json" },
    { name: "partyskill", endpoint: "partyskill", file: "PartySkills.json" },
];

// Whole-endpoint assets: the entire response is the file, so there's no id list
// or batching. `transform` (optional) reconciles the API payload with the shape
// the app expects before it's written.
const WHOLE_ENDPOINTS = [
    { name: "statawake", endpoint: "statawake", file: "StatAwakes.json" },
    { name: "skillawake", endpoint: "skillawake", file: "SkillAwakes.json" },
    { name: "upgradebonus", endpoint: "upgradelevelbonus", file: "UpgradeBonus.json", transform: mergeUpgradeBonusElementFields },
    { name: "pets", endpoint: "raisedpet", file: "Pets.json", transform: keyByPetItemId },
];

// Tuning knobs. The API happily serves ~500 ids per request; we fetch a few
// batches in parallel to keep things quick without hammering the server.
const BATCH_SIZE = 400;
const CONCURRENCY = 6;
const MAX_RETRIES = 4;

/**
 * Fetch a URL as JSON with a small exponential-backoff retry loop, so a single
 * transient network blip doesn't abort a multi-minute scrape.
 */
async function fetchJson(url) {
    let lastError;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} for ${url}`);
            }

            return await response.json();
        } catch (error) {
            lastError = error;

            if (attempt < MAX_RETRIES) {
                const delayMs = 250 * 2 ** attempt;
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
    }

    throw lastError;
}

/**
 * Split an array into chunks of at most `size` elements.
 */
function chunk(array, size) {
    const chunks = [];

    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }

    return chunks;
}

/**
 * Run `worker` over every item in `items` with a bounded number of concurrent
 * in-flight promises. Results are returned in input order.
 */
async function mapWithConcurrency(items, concurrency, worker) {
    const results = new Array(items.length);
    let nextIndex = 0;

    async function runner() {
        while (true) {
            const index = nextIndex++;

            if (index >= items.length) {
                return;
            }

            results[index] = await worker(items[index], index);
        }
    }

    const runners = Array.from({ length: Math.min(concurrency, items.length) }, runner);
    await Promise.all(runners);

    return results;
}

/**
 * Detect the indentation string ("\t", "  ", "    ", ...) used by an existing
 * JSON file so the regenerated file matches the repo's current style and keeps
 * diffs limited to real data changes.
 */
function detectIndent(rawContents) {
    const line = rawContents.split("\n").find((l) => /^\s+\S/.test(l));

    if (!line) {
        return "\t";
    }

    return line.match(/^\s+/)[0];
}

/**
 * Read the existing on-disk map (if any) so we can report a meaningful
 * added / removed / changed summary after scraping.
 */
async function readExisting(filePath) {
    if (!existsSync(filePath)) {
        return { map: {}, indent: "\t", trailingNewline: false };
    }

    const raw = await readFile(filePath, "utf8");

    return {
        map: JSON.parse(raw),
        indent: detectIndent(raw),
        trailingNewline: raw.endsWith("\n"),
    };
}

/**
 * Serialize `data` to `filePath`, matching the file's existing indentation and
 * trailing-newline style so regenerated files keep the repo's formatting and
 * diffs stay limited to real data changes.
 */
async function writeAsset(filePath, data) {
    let indent = "\t";
    let trailingNewline = false;

    if (existsSync(filePath)) {
        const raw = await readFile(filePath, "utf8");
        indent = detectIndent(raw);
        trailingNewline = raw.endsWith("\n");
    }

    await writeFile(filePath, JSON.stringify(data, null, indent) + (trailingNewline ? "\n" : ""), "utf8");
}

/**
 * The /upgradelevelbonus endpoint doesn't return the element attack/defense
 * fields the damage calculator reads from getUpgradeBonus(), so carry them over
 * from the existing file (matched by upgradeLevel), leaving the field order the
 * file already uses.
 */
function mergeUpgradeBonusElementFields(apiData, existing) {
    const byLevel = new Map((Array.isArray(existing) ? existing : []).map((entry) => [entry.upgradeLevel, entry]));

    return apiData.map((entry) => {
        const previous = byLevel.get(entry.upgradeLevel) ?? {};
        const { setAbilities, ...base } = entry;

        return {
            ...base,
            elementAttack: previous.elementAttack,
            elementAttackStrong: previous.elementAttackStrong,
            elementDefense: previous.elementDefense,
            setAbilities,
        };
    });
}

/**
 * The /raisedpet endpoint returns an array, but the app keys pets by their item
 * id, so assemble a { [petItemId]: pet } map.
 */
function keyByPetItemId(apiData) {
    const map = {};

    for (const pet of apiData) {
        map[pet.petItemId] = pet;
    }

    return map;
}

/**
 * Compare the freshly scraped map against the previous one and return counts of
 * added, removed and changed entries.
 */
function diffMaps(previous, next) {
    const previousIds = new Set(Object.keys(previous));
    const nextIds = new Set(Object.keys(next));

    let added = 0;
    let removed = 0;
    let changed = 0;

    for (const id of nextIds) {
        if (!previousIds.has(id)) {
            added++;
        } else if (JSON.stringify(previous[id]) !== JSON.stringify(next[id])) {
            changed++;
        }
    }

    for (const id of previousIds) {
        if (!nextIds.has(id)) {
            removed++;
        }
    }

    return { added, removed, changed };
}

/**
 * Scrape a single collection end-to-end and write it to disk (unless dry-run).
 */
async function scrapeCollection(collection, { dryRun }) {
    const { name, endpoint, file } = collection;
    const filePath = join(ASSETS_DIR, file);
    const started = Date.now();

    console.log(`\n[${name}] fetching id list from ${API_BASE}/${endpoint} ...`);
    const ids = await fetchJson(`${API_BASE}/${endpoint}`);
    console.log(`[${name}] ${ids.length} ids; fetching in batches of ${BATCH_SIZE} (concurrency ${CONCURRENCY}) ...`);

    const batches = chunk(ids, BATCH_SIZE);
    let completedBatches = 0;

    const batchResults = await mapWithConcurrency(batches, CONCURRENCY, async (batch) => {
        const objects = await fetchJson(`${API_BASE}/${endpoint}/${batch.join(",")}`);
        completedBatches++;
        process.stdout.write(`\r[${name}] batch ${completedBatches}/${batches.length}   `);

        return objects;
    });

    process.stdout.write("\n");

    // Assemble the keyed map. The API returns objects in the same order they were
    // requested, each carrying its own `id`, which we use as the map key.
    const map = {};

    for (const objects of batchResults) {
        for (const object of objects) {
            map[object.id] = object;
        }
    }

    const { map: previousMap, indent, trailingNewline } = await readExisting(filePath);
    const diff = diffMaps(previousMap, map);
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);

    console.log(
        `[${name}] done in ${elapsed}s -> ${Object.keys(map).length} entries ` +
        `(+${diff.added} added, -${diff.removed} removed, ~${diff.changed} changed)`
    );

    if (dryRun) {
        console.log(`[${name}] dry-run: ${file} not written`);
        return diff;
    }

    const serialized = JSON.stringify(map, null, indent) + (trailingNewline ? "\n" : "");
    await writeFile(filePath, serialized, "utf8");
    console.log(`[${name}] wrote ${file}`);

    return diff;
}

/**
 * Scrape a whole-endpoint asset: the entire endpoint response is the file. An
 * optional `transform(apiData, existing)` reconciles it with the shape the app
 * expects before it's written.
 */
async function scrapeWholeEndpoint(entry, { dryRun }) {
    const { name, endpoint, file, transform } = entry;
    const filePath = join(ASSETS_DIR, file);
    const started = Date.now();

    console.log(`\n[${name}] fetching ${API_BASE}/${endpoint} ...`);
    let data = await fetchJson(`${API_BASE}/${endpoint}`);

    const existing = existsSync(filePath) ? JSON.parse(await readFile(filePath, "utf8")) : null;

    if (transform) {
        data = transform(data, existing);
    }

    const count = Array.isArray(data) ? data.length : Object.keys(data).length;
    const changed = JSON.stringify(existing) !== JSON.stringify(data);
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);

    console.log(`[${name}] done in ${elapsed}s -> ${count} entries (${changed ? "changed" : "unchanged"})`);

    if (dryRun) {
        console.log(`[${name}] dry-run: ${file} not written`);
        return;
    }

    await writeAsset(filePath, data);
    console.log(`[${name}] wrote ${file}`);
}

/**
 * Regenerate HousingNPCs.json from the housing packs API. Most packs are just
 * furniture; the buff-granting ones expose an `npcs` array. We keep every NPC
 * that grants abilities.
 *
 * Each such pack holds exactly one ability NPC, so entries are keyed by the pack
 * id (packItemId) — a stable id that survives re-scrapes, so serialized builds
 * keep resolving to the same NPC. Names are kept verbatim from the API; the
 * app's search filters match on them.
 *
 * The same NPC is sometimes sold in multiple packs (identical English name and
 * abilities); those are deduplicated, keeping the lowest pack id.
 */
async function scrapeHousingNpcs({ dryRun }) {
    const file = "HousingNPCs.json";
    const filePath = join(ASSETS_DIR, file);
    const started = Date.now();

    console.log(`\n[housingnpcs] fetching pack list from ${API_BASE}/housing/packs ...`);
    const packIds = await fetchJson(`${API_BASE}/housing/packs`);
    console.log(`[housingnpcs] ${packIds.length} packs; fetching details in batches of ${BATCH_SIZE} (concurrency ${CONCURRENCY}) ...`);

    const batches = chunk(packIds, BATCH_SIZE);
    let completedBatches = 0;

    const batchResults = await mapWithConcurrency(batches, CONCURRENCY, async (batch) => {
        const packs = await fetchJson(`${API_BASE}/housing/packs/${batch.join(",")}`);
        completedBatches++;
        process.stdout.write(`\r[housingnpcs] batch ${completedBatches}/${batches.length}   `);

        return packs;
    });

    process.stdout.write("\n");

    // Deduplicate NPCs that appear in several packs (same English name and
    // abilities), keeping the lowest pack id.
    const byIdentity = new Map();

    for (const packs of batchResults) {
        for (const pack of packs ?? []) {
            for (const npc of pack?.npcs ?? []) {
                if (!npc.abilities || npc.abilities.length === 0) {
                    continue;
                }

                const identity = `${npc.name.en} ${JSON.stringify(npc.abilities)}`;
                const existing = byIdentity.get(identity);

                if (!existing || pack.packItemId < existing.id) {
                    byIdentity.set(identity, { id: pack.packItemId, name: npc.name, abilities: npc.abilities });
                }
            }
        }
    }

    // Key by pack id, in ascending id order for a stable, reviewable file.
    const map = {};

    for (const npc of [...byIdentity.values()].sort((a, b) => a.id - b.id)) {
        map[npc.id] = npc;
    }

    const { map: previousMap } = await readExisting(filePath);
    const diff = diffMaps(previousMap, map);
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);

    console.log(
        `[housingnpcs] done in ${elapsed}s -> ${Object.keys(map).length} NPCs with abilities ` +
        `(+${diff.added} added, -${diff.removed} removed, ~${diff.changed} changed)`
    );

    if (dryRun) {
        console.log(`[housingnpcs] dry-run: ${file} not written`);
        return diff;
    }

    await writeAsset(filePath, map);
    console.log(`[housingnpcs] wrote ${file}`);

    return diff;
}

/**
 * Fetch a single stat parameter's localized names. Unlike the list collections,
 * a missing parameter (e.g. the "attribute" status-effect marker) legitimately
 * 404s, so we return null immediately rather than retrying it.
 */
async function fetchParameterName(id) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(`${API_BASE}/language/parameter/${encodeURIComponent(id)}`);

            if (response.status === 404) {
                return null;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            if (attempt === MAX_RETRIES) {
                return null;
            }

            await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
        }
    }

    return null;
}

/**
 * StatNames.json has no list endpoint, so its id set is seeded from the ids
 * already in the file, plus every stat parameter referenced across the game data
 * (items, skills, equip sets, stat/skill awakes, upgrade bonus, housing NPCs and
 * pets). Reads the on-disk assets, which the scraper may have just refreshed.
 */
async function deriveParameterIds() {
    const ids = new Set();

    const addAbilities = (abilities) => {
        for (const ability of abilities ?? []) {
            if (ability && ability.parameter) {
                ids.add(ability.parameter);
            }
        }
    };

    const readJson = async (file) => JSON.parse(await readFile(join(ASSETS_DIR, file), "utf8"));

    for (const id of Object.keys(await readJson("StatNames.json"))) {
        ids.add(id);
    }

    for (const item of Object.values(await readJson("Items.json"))) {
        addAbilities(item.abilities);
        addAbilities(item.possibleRandomStats);
        for (const upgrade of item.upgradeLevels ?? []) {
            addAbilities(upgrade.abilities);
        }
    }

    for (const skill of Object.values(await readJson("Skills.json"))) {
        for (const levelProp of skill.levels ?? []) {
            addAbilities(levelProp.abilities);
            addAbilities(levelProp.scalingParameters);
        }
    }

    for (const set of Object.values(await readJson("EquipSets.json"))) {
        for (const bonus of set.bonus ?? []) {
            if (bonus && bonus.ability && bonus.ability.parameter) {
                ids.add(bonus.ability.parameter);
            }
        }
    }

    for (const statAwake of await readJson("StatAwakes.json")) {
        addAbilities(statAwake.abilities);
    }

    for (const bonus of await readJson("UpgradeBonus.json")) {
        addAbilities(bonus.setAbilities);
    }

    for (const npc of Object.values(await readJson("HousingNPCs.json"))) {
        addAbilities(npc.abilities);
    }

    for (const pet of Object.values(await readJson("Pets.json"))) {
        if (pet.parameter) {
            ids.add(pet.parameter);
        }
    }

    // Skill awake parameters are keyed by the stat id they grant.
    for (const category of Object.values(await readJson("SkillAwakes.json"))) {
        for (const parameter of Object.keys(category.parameters ?? {})) {
            ids.add(parameter);
        }
    }

    return [...ids].sort();
}

/**
 * Regenerate StatNames.json from the /language/parameter/<id> endpoint.
 */
async function scrapeStatNames({ dryRun }) {
    const file = "StatNames.json";
    const filePath = join(ASSETS_DIR, file);
    const started = Date.now();

    console.log(`\n[statnames] deriving parameter ids from StatNames + game data ...`);
    const ids = await deriveParameterIds();
    console.log(`[statnames] ${ids.length} parameters; fetching /language/parameter (concurrency ${CONCURRENCY}) ...`);

    let completed = 0;
    let notFound = 0;

    const results = await mapWithConcurrency(ids, CONCURRENCY, async (id) => {
        const entry = await fetchParameterName(id);

        if (entry == null) {
            notFound++;
        }

        completed++;
        process.stdout.write(`\r[statnames] ${completed}/${ids.length}   `);

        return [id, entry];
    });

    process.stdout.write("\n");

    // Preserve the id ordering (sorted) for a stable, reviewable file.
    const map = {};

    for (const [id, entry] of results) {
        if (entry != null) {
            map[id] = entry;
        }
    }

    const { map: previousMap, indent, trailingNewline } = await readExisting(filePath);
    const diff = diffMaps(previousMap, map);
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);

    console.log(
        `[statnames] done in ${elapsed}s -> ${Object.keys(map).length} entries ` +
        `(+${diff.added} added, -${diff.removed} removed, ~${diff.changed} changed; ${notFound} not found)`
    );

    if (dryRun) {
        console.log(`[statnames] dry-run: ${file} not written`);
        return diff;
    }

    const serialized = JSON.stringify(map, null, indent) + (trailingNewline ? "\n" : "");
    await writeFile(filePath, serialized, "utf8");
    console.log(`[statnames] wrote ${file}`);

    return diff;
}

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes("--dry-run");
    const requested = args.filter((arg) => !arg.startsWith("--"));

    const allNames = [
        ...COLLECTIONS.map((c) => c.name),
        ...WHOLE_ENDPOINTS.map((w) => w.name),
        "housingnpcs",
        "statnames",
    ];
    let selectedNames = allNames;

    if (requested.length > 0) {
        const unknown = requested.filter((r) => !allNames.includes(r));

        if (unknown.length > 0) {
            console.error(`Unknown collection(s): ${unknown.join(", ")}`);
            console.error(`Available: ${allNames.join(", ")}`);
            process.exit(1);
        }

        selectedNames = requested;
    }

    console.log(`Flyffulator scraper -> ${API_BASE}`);
    console.log(`Collections: ${selectedNames.join(", ")}${dryRun ? " (dry-run)" : ""}`);

    const overallStart = Date.now();

    // Collections are scraped sequentially so their progress output stays
    // readable; batches within a collection are what run in parallel. StatNames
    // runs last so it derives its id set from the freshly written data.
    for (const collection of COLLECTIONS) {
        if (selectedNames.includes(collection.name)) {
            await scrapeCollection(collection, { dryRun });
        }
    }

    for (const entry of WHOLE_ENDPOINTS) {
        if (selectedNames.includes(entry.name)) {
            await scrapeWholeEndpoint(entry, { dryRun });
        }
    }

    if (selectedNames.includes("housingnpcs")) {
        await scrapeHousingNpcs({ dryRun });
    }

    if (selectedNames.includes("statnames")) {
        await scrapeStatNames({ dryRun });
    }

    const totalElapsed = ((Date.now() - overallStart) / 1000).toFixed(1);
    console.log(`\nAll done in ${totalElapsed}s.`);
}

main().catch((error) => {
    console.error("\nScrape failed:", error.message);
    process.exit(1);
});
