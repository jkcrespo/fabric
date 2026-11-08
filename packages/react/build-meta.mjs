#!/usr/bin/env node
/** Bundles every src/<Name>/<name>.meta.json into dist/components.json — the file agents read. */
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const SRC = join(HERE, 'src');
const pkg = JSON.parse(readFileSync(join(HERE, 'package.json'), 'utf8'));
const components = readdirSync(SRC)
  .filter((d) => statSync(join(SRC, d)).isDirectory())
  .sort()
  .map((d) => {
    const { $schema, ...meta } = JSON.parse(readFileSync(join(SRC, d, `${d.toLowerCase()}.meta.json`), 'utf8'));
    return { ...meta, import: `import { ${meta.name} } from '${pkg.name}';` };
  });
mkdirSync(join(HERE, 'dist'), { recursive: true });
writeFileSync(
  join(HERE, 'dist/components.json'),
  JSON.stringify({ $description: 'Machine-readable contract for every Fabric component. Generated from src/*/*.meta.json.', package: pkg.name, version: pkg.version, components }, null, 2) + '\n'
);
console.log(`Bundled metadata for ${components.length} components → dist/components.json`);
