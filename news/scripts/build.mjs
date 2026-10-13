import { checkProduct } from './check.mjs';
import { cp, mkdir, rm } from 'node:fs/promises';
await checkProduct();
const repo = new URL('../../', import.meta.url),
  destination = new URL('dist-news/', repo);
await rm(destination, { recursive: true, force: true });
await mkdir(new URL('news/', destination), { recursive: true });
for (const directory of [
  'domain',
  'providers',
  'geography',
  'presentation',
  'application',
  'server',
  'reader',
  'interpretation',
  'resolution',
  'design',
])
  await cp(
    new URL('news/' + directory, repo),
    new URL('news/' + directory, destination),
    { recursive: true },
  );
const target = new URL('src/data/local_data/natural_earth/', destination);
await mkdir(target, { recursive: true });
await cp(
  new URL('src/data/local_data/natural_earth/countries.json', repo),
  new URL('countries.json', target),
);
for (const file of ['LICENSE', 'DATA_SOURCES.md'])
  await cp(new URL(file, repo), new URL(file, destination));
console.log(
  'Built isolated product in dist-news; start with node dist-news/news/server/start.mjs. Uses the checkout’s installed acquisition dependency. No inherited runtime catalog or restricted assets included.',
);
