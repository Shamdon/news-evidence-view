import { initializeProduct } from '../application/bootstrap.js';
import { inspectSnapshot } from '../application/controller.js';
import { applyTheme } from './themes.js';
const $ = (id) => document.getElementById(id);
const node = (tag, text, className) => {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (className) e.className = className;
  return e;
};
const emptyToNull = (id) => $(id).value.trim() || null;
const number = (id) => ($(id).value.trim() === '' ? null : Number($(id).value));
let app,
  snapshotIndex = -1,
  renderedCase = null,
  renderedSelected = null,
  highlightId = null;
function message(text, error = false) {
  $('status').textContent = text;
  $('status').classList.toggle('error', error);
}
async function guarded(fn) {
  try {
    await fn();
  } catch (error) {
    message(
      error.name === 'AbortError' ? 'Request cancelled.' : error.message,
      true,
    );
  }
}
const metadata = (text) => node('p', text, 'metadata');
const details = (target, rows) => {
  const dl = node('dl');
  for (const [key, value] of rows)
    dl.append(node('dt', key), node('dd', value ?? 'Unknown / unavailable'));
  target.append(dl);
};
function reference(url, label) {
  const a = node('a', label);
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}
function renderOriginal(current, selected) {
  const claim = current.claims.find((c) => c.id === selected);
  const original = $('original');
  original.replaceChildren();
  if (claim)
    original.append(
      document.createTextNode(current.source.text.slice(0, claim.span.start)),
      node('mark', current.source.text.slice(claim.span.start, claim.span.end)),
      document.createTextNode(current.source.text.slice(claim.span.end)),
    );
  else original.textContent = current.source.text;
  const source = $('source-metadata');
  source.replaceChildren(
    metadata(
      `Publication: ${current.source.publicationTime ?? 'Unknown'} · Account created: ${current.createdAt}`,
    ),
  );
  if (current.source.url)
    source.append(
      reference(current.source.url, 'Open original source ↗'),
      metadata(
        'Source links can change or disappear. The submitted text remains in this account.',
      ),
    );
  $('claims').replaceChildren();
  current.claims.forEach((c, i) => {
    const button = node('button');
    button.className = 'claim-button';
    button.type = 'button';
    button.setAttribute('aria-pressed', String(c.id === selected));
    button.append(
      node(
        'span',
        `STATEMENT ${String(i + 1).padStart(2, '0')}`,
        'claim-number',
      ),
      document.createTextNode(c.text),
    );
    button.addEventListener('click', () => {
      snapshotIndex = -1;
      app.controller.select(c.id);
    });
    $('claims').append(button);
  });
}
function renderInterpretation(claim) {
  if (!claim) return;
  $('selected-wording').textContent = claim.text;
  const map = {
    'event-date': 'eventDate',
    magnitude: 'magnitude',
    place: 'place',
    notes: 'notes',
    latitude: 'latitude',
    longitude: 'longitude',
  };
  for (const [field, key] of Object.entries(map))
    $(field).value = claim.interpretation[key] ?? '';
  $('reason').value = '';
  const date = claim.interpretation.eventDate;
  $('query-start').value = date ?? '';
  $('query-end').value = date ?? '';
  $('query-lat').value = claim.interpretation.latitude ?? '';
  $('query-lon').value = claim.interpretation.longitude ?? '';
  $('history-label').textContent =
    `Correction history (${claim.revisions.length})`;
  const history = $('history');
  history.replaceChildren();
  if (!claim.revisions.length)
    history.append(node('p', 'No corrections recorded.', 'hint'));
  for (const r of claim.revisions) {
    const item = node('div', undefined, 'revision');
    item.append(
      node('p', `${r.at} — ${r.reason}`),
      node(
        'pre',
        `Before: ${JSON.stringify(r.before, null, 2)}\nAfter: ${JSON.stringify(r.after, null, 2)}`,
      ),
    );
    history.append(item);
  }
}
function renderEvidence(current, selected) {
  const view = inspectSnapshot(current, selected, snapshotIndex);
  const select = $('snapshots');
  select.replaceChildren();
  if (!view.snapshots.length) {
    const option = node('option', 'No retrieval saved');
    option.value = '-1';
    select.append(option);
  } else
    view.snapshots.forEach((r, i) => {
      const option = node('option', `${i + 1}. ${r.retrievedAt} · ${r.status}`);
      option.value = i;
      option.selected =
        snapshotIndex === -1
          ? i === view.snapshots.length - 1
          : i === snapshotIndex;
      select.append(option);
    });
  const target = $('evidence');
  target.replaceChildren();
  const status = $('retrieval-status');
  status.replaceChildren();
  const r = view.retrieval;
  if (!r) {
    status.append(
      node(
        'p',
        'No evidence has been retrieved for this statement. All reported claims remain unverified.',
        'snapshot-status',
      ),
    );
  } else {
    const text =
      r.status === 'error'
        ? r.error
        : r.status === 'empty'
          ? 'No catalog records in this query. This does not show that the event did not happen.'
          : `${r.evidence.length} candidate records retrieved. Each requires inspection; none is an automatic match.`;
    status.append(
      node(
        'p',
        text,
        'snapshot-status' + (r.status === 'error' ? ' error' : ''),
      ),
      metadata(
        `Query: ${r.query.startDate} through ${r.query.endDate} UTC · ${r.query.latitude === null ? 'global area' : `${r.query.latitude}, ${r.query.longitude} within ${r.query.radiusKm} km`} · Retrieved: ${r.retrievedAt}`,
      ),
    );
    if (r.truncated)
      status.append(
        node(
          'p',
          'Potentially incomplete: the 100-record cap was reached. Narrow the area/window; missing records may include relevant differences.',
          'snapshot-status',
        ),
      );
    for (const { evidence: e, assessment } of view.comparisons) {
      const card = node('article', undefined, 'evidence-record');
      card.id = `evidence-${e.id}`;
      card.tabIndex = -1;
      card.append(
        node('span', 'CATALOG RECORD / CANDIDATE', 'tag observed-tag'),
        node('h4', e.title),
        reference(e.url, 'Inspect original catalog record ↗'),
      );
      details(card, [
        [
          'Magnitude',
          `${e.magnitude ?? 'Unknown'} · ${e.magnitudeType ?? 'scale unknown'}`,
        ],
        ['Event origin time (UTC)', e.eventTime],
        ['Publication time', e.publicationTime],
        ['Sensor observation time', e.observationTime],
        ['Record updated', e.updatedAt],
        ['Retrieved', e.retrievedAt],
        ['Coordinates', `${e.latitude}, ${e.longitude}`],
        ['Depth (km)', e.depthKm],
        ['Review status', e.reviewStatus],
        ['Source family', e.sourceFamily],
        [
          'Network / contributors',
          `${e.network ?? 'unknown'} / ${e.catalogSources ?? 'unknown'}`,
        ],
      ]);
      card.append(
        node(
          'p',
          `${assessment.status.toUpperCase()}: ${assessment.explanation}`,
          'assessment' +
            (assessment.status === 'measurement-differs' ? ' difference' : ''),
        ),
        node('p', e.limitations, 'hint'),
      );
      const locate = node('button', 'Locate this record');
      locate.addEventListener('click', () => {
        highlightId = e.id;
        renderEvidence(current, selected);
        $('map').scrollIntoView({ block: 'center' });
      });
      if (app.composition.count) card.append(locate);
      target.append(card);
    }
  }
  const timeline = $('timeline');
  timeline.replaceChildren();
  const row = (label, text, cls) => {
    const item = node('li', undefined, cls);
    item.append(node('b', label), document.createTextNode(text));
    timeline.append(item);
  };
  row(
    'Reported event date',
    view.claim?.interpretation.eventDate ??
      'Unresolved — do not substitute publication time',
  );
  row('Source publication', current.source.publicationTime ?? 'Unknown');
  for (const e of r?.evidence ?? [])
    row('Catalog origin time', `${e.eventTime} — ${e.title}`, 'catalog');
  if (r)
    row('Retrieval snapshot', `${r.retrievedAt} — ${r.status}`, 'retrieval');
  const chosen = r
    ? { ...current, retrievals: [r] }
    : { ...current, retrievals: [] };
  app.composition.update({ current: chosen, selected, highlightId });
}
function render(state) {
  $('workspace').hidden = !state.current;
  $('retrieve').disabled = state.pending;
  document.querySelector('#acquire-form button').disabled = state.pending;
  if (state.pending) message('Retrieving from the supported source…');
  if (!state.current) {
    renderedCase = null;
    renderedSelected = null;
    app?.composition.update(state);
    return;
  }
  if (state.current === renderedCase && state.selected === renderedSelected)
    return;
  const changedSelection =
    state.selected !== renderedSelected ||
    state.current.id !== renderedCase?.id;
  renderedCase = state.current;
  renderedSelected = state.selected;
  $('case-title').textContent =
    state.current.source.title || 'Untitled reading account';
  renderOriginal(state.current, state.selected);
  if (changedSelection) highlightId = null;
  if (changedSelection || !state.current.retrievals.length)
    renderInterpretation(
      state.current.claims.find((c) => c.id === state.selected),
    );
  else {
    const claim = state.current.claims.find((c) => c.id === state.selected);
    if (claim?.revisions.length && $('reason').value)
      renderInterpretation(claim);
  }
  renderEvidence(state.current, state.selected);
}
function refreshSaved() {
  const target = $('saved');
  target.replaceChildren();
  const records = app.controller.saved();
  if (!records.length)
    target.append(
      node('p', 'No saved accounts yet. Saving is explicit.', 'hint'),
    );
  for (const saved of records) {
    const row = node('div', undefined, 'saved-row');
    row.append(
      node(
        'span',
        `${saved.title || 'Untitled account'} · ${saved.createdAt ?? 'Unknown date'}`,
      ),
    );
    const open = node('button', 'Reopen snapshot');
    open.addEventListener('click', () =>
      guarded(() => {
        snapshotIndex = -1;
        app.controller.load(saved.id);
        message('Saved snapshot reopened. Evidence has not been refreshed.');
        $('workspace').focus();
      }),
    );
    const remove = node('button', 'Delete browser copy');
    remove.addEventListener('click', () =>
      guarded(() => {
        app.controller.remove(saved.id);
        refreshSaved();
        message('Browser copy deleted.');
      }),
    );
    row.append(open, remove);
    target.append(row);
  }
}
function exportAccount() {
  const blob = new Blob([app.controller.export()], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = node('a');
  link.href = url;
  link.download = `news-evidence-account-${app.controller.getState().current.id}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  message(
    'Account exported deliberately. It includes source text and saved evidence.',
  );
}
$('theme').addEventListener('change', () => applyTheme($('theme').value));
$('submit-form').addEventListener('submit', (event) => {
  event.preventDefault();
  guarded(() => {
    snapshotIndex = -1;
    app.controller.submit({
      text: $('report-text').value,
      title: $('report-title').value,
      url: emptyToNull('source-url'),
      publicationTime: emptyToNull('publication'),
    });
    message(
      'Account opened. Inspect proposed statements before retrieving evidence.',
    );
    $('workspace').focus();
  });
});
$('text-file').addEventListener('change', () =>
  guarded(async () => {
    const file = $('text-file').files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.txt') || file.size > 300000)
      throw new Error(
        'Use a UTF-8 .txt file up to 300 KB (100,000 characters). Audio/video and other files are unsupported.',
      );
    const bytes = await file.arrayBuffer();
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (text.length > 100000)
      throw new Error('Report exceeds 100,000 characters.');
    $('report-text').value = text;
    if (!$('report-title').value) $('report-title').value = file.name;
    message('Text loaded locally. Open the reading account to inspect it.');
  }),
);
$('acquire-form').addEventListener('submit', (event) => {
  event.preventDefault();
  guarded(async () => {
    snapshotIndex = -1;
    await app.controller.acquire($('acquire-url').value);
    message(
      'Official catalog report acquired. USGS evidence shares its underlying source family.',
    );
    $('workspace').focus();
  });
});
$('correct-form').addEventListener('submit', (event) => {
  event.preventDefault();
  guarded(() => {
    app.controller.correct(
      {
        eventDate: emptyToNull('event-date'),
        magnitude: number('magnitude'),
        place: emptyToNull('place'),
        latitude: number('latitude'),
        longitude: number('longitude'),
        notes: $('notes').value,
      },
      $('reason').value,
    );
    renderInterpretation(
      app.controller
        .getState()
        .current.claims.find(
          (c) => c.id === app.controller.getState().selected,
        ),
    );
    message(
      'Correction recorded. Original wording and previous interpretation are retained.',
    );
  });
});
$('query-form').addEventListener('submit', (event) => {
  event.preventDefault();
  guarded(async () => {
    snapshotIndex = -1;
    await app.controller.retrieve({
      startDate: $('query-start').value,
      endDate: $('query-end').value,
      latitude: number('query-lat'),
      longitude: number('query-lon'),
      radiusKm: Number($('query-radius').value),
    });
    message(
      'Retrieval snapshot recorded. Inspect differences and limitations below.',
    );
  });
});
$('snapshots').addEventListener('change', () => {
  snapshotIndex = Number($('snapshots').value);
  const s = app.controller.getState();
  renderEvidence(s.current, s.selected);
});
$('save').addEventListener('click', () =>
  guarded(() => {
    app.controller.save();
    refreshSaved();
    message(
      'Saved on this device. Submitted text is included; no server copy was created.',
    );
  }),
);
$('export').addEventListener('click', () => guarded(exportAccount));
$('clear').addEventListener('click', () => {
  app.controller.clear();
  message('Account closed. Explicitly saved copies remain on this device.');
});
$('import-file').addEventListener('change', () =>
  guarded(async () => {
    const file = $('import-file').files[0];
    if (!file) return;
    if (file.size > 4000000) throw new Error('Account file is too large.');
    const text = new TextDecoder('utf-8', { fatal: true }).decode(
      await file.arrayBuffer(),
    );
    snapshotIndex = -1;
    app.controller.importCase(JSON.parse(text));
    message(
      'Account imported. Its provenance comes from the file and is not authenticated or refreshed.',
    );
    $('workspace').focus();
  }),
);
try {
  app = await initializeProduct({
    mapHost: $('map'),
    onSelectEvidence: (id) => {
      highlightId = id;
      const state = app.controller.getState();
      renderEvidence(state.current, state.selected);
      document.getElementById(`evidence-${id}`)?.focus();
    },
  });
  $('map-mode').textContent =
    app.geography === 'off'
      ? 'Geography omitted by configuration. Document, chronology and evidence remain available.'
      : app.geography === 'coordinates'
        ? 'Coordinate-list extension selected. No map boundary request is constructed.'
        : 'Focus the map on the current statement and retrieved candidates. All record details are available below.';
  if (app.geography === 'off') $('map').hidden = true;
  app.controller.subscribe(render);
  refreshSaved();
  addEventListener('pagehide', (event) => {
    if (event.persisted) {
      app.controller.suspend();
      app.composition.disable();
    } else app.dispose();
  });
  addEventListener('pageshow', (event) => {
    if (event.persisted) {
      app.composition.enable();
      app.composition.update(app.controller.getState());
    }
  });
} catch (error) {
  message(`Application could not start: ${error.message}`, true);
}
