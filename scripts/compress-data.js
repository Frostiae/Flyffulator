import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { gzipSync } from 'zlib';

mkdirSync('public/data', { recursive: true });

for (const file of readdirSync('data-src').filter(f => f.endsWith('.json'))) {
  const raw = readFileSync(`data-src/${file}`, 'utf8');
  const minified = JSON.stringify(JSON.parse(raw)); // strip whitespace first
  const gz = gzipSync(minified, { level: 9 });
  writeFileSync(`public/data/${file}.gz`, gz);
  const name = file.replace('.json', '');
  console.log(`${name}: ${(raw.length/1e6).toFixed(1)}MB → ${(gz.length/1e6).toFixed(1)}MB`);
}