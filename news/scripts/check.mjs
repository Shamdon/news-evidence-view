import { readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const rules = {
  domain: ['domain', 'interpretation'],
  interpretation: ['interpretation', 'resolution'],
  resolution: ['resolution'],
  reader: ['reader', 'application', 'presentation', 'geography'],
  providers: ['providers'],
  geography: ['geography'],
  presentation: ['presentation', 'application'],
  application: ['application', 'domain', 'geography', 'interpretation'],
  server: ['server', 'providers'],
};
// Covers the literal static/dynamic import forms used by this entry, including multiline declarations.
// This is a dependency lint gate for trusted source code, not an executable-plugin sandbox.
const imports =
  /(?:^\s*import\s+(?:(?:\{[^}]*\}|[\w$]+(?:\s*,\s*\{[^}]*\})?|\*\s+as\s+[\w$]+)\s+from\s*)?|^\s*export\s+(?:\{[^}]*\}|\*)\s+from\s*|import\s*\()\s*['"]([^'"]+)['"]/gm;
export function inspectProductModule(
  area,
  name,
  text,
  root = new URL('../', import.meta.url),
) {
  if (!rules[area]) throw new Error('Unknown product area');
  const file = new URL(area + '/' + name, root);
  if (/\bimport\s*\(\s*(?!['"\s])/.test(text) || /\brequire\s*\(/.test(text))
    throw new Error(
      'Computed imports and require are not supported in product runtime',
    );
  const dependencies = [];
  for (const match of text.matchAll(imports)) {
    const spec = match[1];
    dependencies.push(spec);
    if (spec.startsWith('node:')) {
      if (!['server', 'providers'].includes(area))
        throw new Error(`${area} imports Node implementation ${spec}`);
      continue;
    }
    if (area === 'providers' && spec === 'linkedom') continue;
    if (!spec.startsWith('.')) throw new Error(`Unexpected dependency ${spec}`);
    const target = path
      .relative(root.pathname, new URL(spec, file).pathname)
      .split(path.sep)[0];
    if (!rules[area].includes(target))
      throw new Error(`${area}/${name} forbidden dependency ${spec}`);
  }
  if (
    area === 'domain' &&
    /\b(?:document|localStorage|fetch|window)\s*[.(]/.test(text)
  )
    throw new Error('Domain depends on UI/provider global');
  return dependencies;
}
export async function checkProduct(root = new URL('../', import.meta.url)) {
  let count = 0;
  for (const area of Object.keys(rules))
    for (const entry of await readdir(new URL(area + '/', root))) {
      if (!/\.[mc]?js$/.test(entry)) continue;
      const file = new URL(area + '/' + entry, root),
        text = await readFile(file, 'utf8');
      const check = spawnSync(process.execPath, ['--check', file.pathname], {
        encoding: 'utf8',
      });
      if (check.status) throw new Error(check.stderr);
      inspectProductModule(area, entry, text, root);
      count++;
    }
  console.log(
    `Syntax and declared dependency boundaries passed for ${count} product modules.`,
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await checkProduct();
