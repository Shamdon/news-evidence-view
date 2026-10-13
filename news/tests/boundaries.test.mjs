import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectProductModule } from '../scripts/check.mjs';
test('boundary gate rejects actual multiline presentation/domain/provider coupling and request-selected code', () => {
  const multiline =
    "import {\n interpret,\n normalize\n} from '../providers/usgs.mjs';\n";
  assert.throws(
    () => inspectProductModule('presentation', 'bad.js', multiline),
    /forbidden dependency/,
  );
  assert.throws(
    () =>
      inspectProductModule('domain', 'bad.js', "import '../geography/map.js';"),
    /forbidden dependency/,
  );
  assert.throws(
    () =>
      inspectProductModule(
        'providers',
        'bad.js',
        "export { controller } from '../application/controller.js';",
      ),
    /forbidden dependency/,
  );
  assert.throws(
    () =>
      inspectProductModule(
        'application',
        'bad.js',
        'const module = await import(caseData.plugin);',
      ),
    /Computed imports/,
  );
  assert.throws(
    () =>
      inspectProductModule('domain', 'bad.js', 'fetch("https://example.com")'),
    /UI\/provider global/,
  );
  assert.deepEqual(
    inspectProductModule(
      'application',
      'ok.js',
      "import {\n createCase\n} from '../domain/case.js';\nconst module=await import('../geography/map.js');",
    ),
    ['../domain/case.js', '../geography/map.js'],
  );
});
