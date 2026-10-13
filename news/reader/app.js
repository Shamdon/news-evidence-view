import {
  createConsumer,
  createConsumerApi,
  createConsumerStorage,
  consumerView,
  geographyForAccount,
} from '../application/consumer.js';
import { createComposition } from '../application/composition.js';
import { applyTheme } from '../presentation/themes.js';
const $ = (id) => document.getElementById(id),
  element = (tag, text, cls) => {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  };
let application,
  composition,
  previousAccount = null,
  previousSelection = null,
  snapshotIndex = -1,
  allRecords = false,
  highlightId = null;
const mode = () => document.querySelector('input[name=mode]:checked').value;
const note = (text, failed = false) => {
  $('progress').textContent = failed ? '' : text;
  $('error').hidden = !failed;
  $('error').textContent = failed ? text : '';
};
const guarded = async (fn) => {
  try {
    await fn();
  } catch (error) {
    if (error.name !== 'AbortError') note(error.message, true);
  }
};
const link = (url, text) => {
  const n = element('a', text);
  n.href = url;
  n.target = '_blank';
  n.rel = 'noopener noreferrer';
  return n;
};
function setMode() {
  const m = mode();
  $('input-label').textContent =
    m === 'url'
      ? 'Public article URL'
      : m === 'headline'
        ? 'Headline you want to investigate'
        : 'Original report text';
  $('input').placeholder =
    m === 'url'
      ? 'https://…'
      : m === 'headline'
        ? 'A headline you saw in your feed'
        : 'Paste the report or an excerpt you can access.';
  $('start').textContent =
    m === 'headline' ? 'Find candidate reporting' : 'Explore this report';
}
function latest(account, id) {
  return account.retrievals.filter((v) => v.claimId === id).at(-1);
}
function renderSaved() {
  const target = $('saved');
  target.replaceChildren();
  let rows;
  try {
    rows = application.saved();
  } catch {
    target.append(
      element(
        'p',
        'Browser storage is unavailable. You can still explore and export an account.',
        'help',
      ),
    );
    return;
  }
  if (!rows.length)
    target.append(
      element('p', 'No saved accounts yet. Saving is explicit.', 'help'),
    );
  for (const item of rows) {
    const row = element('div', undefined, 'saved-row');
    row.append(
      element(
        'span',
        `${item.title || 'Untitled report'} · ${item.createdAt ?? 'Date unknown'}`,
      ),
    );
    const open = element('button', 'Reopen recorded account');
    open.addEventListener('click', () =>
      guarded(() => {
        snapshotIndex = -1;
        application.load(item.id);
        note('Reopened as recorded. No source or evidence was refreshed.');
        $('result').focus();
      }),
    );
    const remove = element('button', 'Delete browser copy');
    remove.addEventListener('click', () =>
      guarded(() => {
        application.remove(item.id);
        renderSaved();
        note('Browser copy deleted. Exported files are unchanged.');
      }),
    );
    row.append(open, remove);
    target.append(row);
  }
}
function renderDiscovery(discovery) {
  $('discovery').hidden = !discovery;
  if (!discovery) return;
  $('discovery-note').textContent =
    discovery.explanation ?? 'Choose a report before inspecting its claims.';
  const target = $('candidates');
  target.replaceChildren();
  for (const candidate of discovery.candidates ?? []) {
    const card = element('article', undefined, 'candidate');
    card.append(
      element('h3', candidate.title),
      element(
        'p',
        `${candidate.publisher ?? 'Publisher not established'} · publication ${candidate.publishedAt ?? 'unknown'}`,
      ),
    );
    const actions = element('div', undefined, 'actions');
    const choose = element('button', 'Examine this report');
    choose.addEventListener('click', () =>
      guarded(() => application.chooseCandidate(candidate.id)),
    );
    actions.append(choose, link(candidate.url, 'Open candidate source'));
    card.append(
      actions,
      element('p', (candidate.limitations ?? []).join(' '), 'help'),
    );
    target.append(card);
  }
  if (!discovery.candidates?.length)
    target.append(
      element(
        'p',
        'No candidate report is available from this visit. Paste the original link or accessible report text to continue.',
        'help',
      ),
    );
}
function renderSource(account, claim) {
  const target = $('source-info');
  target.replaceChildren();
  if (account.source.url)
    target.append(link(account.source.url, 'Open the original publisher page'));
  target.append(
    element(
      'p',
      `Publication: ${account.source.publicationTime ?? 'unknown'} · Material accessed: ${account.source.accessedAt}`,
      'help',
    ),
    element('p', account.source.acquisition.notes, 'help'),
  );
  const text = $('source-text');
  text.replaceChildren();
  if (claim)
    text.append(
      document.createTextNode(account.source.text.slice(0, claim.span.start)),
      element('mark', claim.text),
      document.createTextNode(account.source.text.slice(claim.span.end)),
    );
  else text.textContent = account.source.text;
}
function contextWords(claim) {
  const i = claim.interpretation,
    parts = [];
  if (i.places.length)
    parts.push('Place context: ' + i.places.map((p) => p.name).join(' / '));
  if (i.eventDate) parts.push('Reported event date: ' + i.eventDate);
  if (i.year) parts.push('Reported year: ' + i.year);
  if (i.measurements.length)
    parts.push(
      'Proposed quantities: ' +
        i.measurements
          .map(
            (m) =>
              `${m.comparator === 'gt' ? 'more than ' : m.comparator === 'lt' ? 'less than ' : m.comparator === 'approx' ? 'about ' : ''}${m.value.toLocaleString('en')} ${m.unit}`,
          )
          .join('; '),
    );
  return parts;
}
function renderDetail(account, id) {
  const view = consumerView(account, id, snapshotIndex),
    claim = view.claim;
  $('retry').disabled = !claim || Boolean(application.getState().pending);
  $('show-source').disabled = !account;
  const list = $('evidence-list');
  list.replaceChildren();
  $('more-evidence').hidden = true;
  if (!claim) {
    $('statement').textContent =
      'No supported factual candidate was identified. Original wording remains available and unassessed.';
    $('claim-context').replaceChildren();
    $('claim-status').replaceChildren(
      element(
        'p',
        'You can still inspect the original report. This release has not assessed its assertions.',
        'visit-summary unresolved',
      ),
    );
    renderSource(account, null);
    composition.update({
      records: [],
      countries: [],
      queryLabel: 'No resolved geographic claim.',
    });
    return;
  }
  $('statement').textContent = claim.text;
  const context = $('claim-context');
  context.replaceChildren();
  const summary = element('div', undefined, 'context-summary');
  for (const text of contextWords(claim)) summary.append(element('p', text));
  if (!summary.childNodes.length)
    summary.append(element('p', 'Place and time remain unresolved.'));
  for (const text of claim.interpretation.uncertainty)
    summary.append(element('p', text, 'help'));
  context.append(summary);
  const selector = $('snapshot');
  selector.replaceChildren();
  if (!view.snapshots.length)
    selector.append(element('option', 'No evidence visit recorded'));
  view.snapshots.forEach((visit, index) => {
    const option = element(
      'option',
      `${index + 1}. ${visit.retrievedAt} — ${visit.status}`,
    );
    option.value = index;
    option.selected =
      snapshotIndex === -1
        ? index === view.snapshots.length - 1
        : index === snapshotIndex;
    selector.append(option);
  });
  const visit = view.snapshot,
    status = $('claim-status');
  status.replaceChildren();
  if (visit) {
    const box = element('div', undefined, `visit-summary ${visit.status}`);
    box.append(element('p', visit.explanation));
    if (visit.error) box.append(element('p', visit.error));
    if (visit.truncated)
      box.append(
        element(
          'p',
          'Coverage is incomplete: the record limit was reached. Relevant records may be missing. No absence conclusion follows.',
        ),
      );
    if (visit.status === 'ok')
      box.append(
        element(
          'p',
          `${visit.records.length} related records, requiring inspection. These are not independent confirmations or automatic matches.`,
        ),
      );
    status.append(box);
  } else
    status.append(
      element(
        'p',
        'This statement has not yet had a source visit. Choose “Look for sources again” to examine it.',
        'visit-summary',
      ),
    );
  const records = allRecords ? view.records : view.records.slice(0, 12);
  for (const { record: r, assessment } of records) {
    const card = element('article', undefined, 'evidence-card');
    card.id = `record-${r.id}`;
    card.tabIndex = -1;
    card.append(
      element(
        'p',
        r.kind === 'observation'
          ? 'RETRIEVED RECORD'
          : r.kind === 'source-assertion'
            ? 'SOURCE ASSERTION'
            : r.kind === 'inference'
              ? 'ANALYTICAL INFERENCE'
              : 'RECONSTRUCTION',
        'record-kind',
      ),
      element('h4', r.title),
    );
    for (const m of r.measurements)
      card.append(
        element('p', `${m.value.toLocaleString('en')} ${m.unit} · ${m.key}`),
      );
    card.append(
      element(
        'p',
        assessment.explanation,
        'comparison' +
          (assessment.status === 'difference' ? ' difference' : ''),
      ),
      link(r.url, 'Inspect the underlying record'),
    );
    const detail = element('details');
    detail.append(element('summary', 'Provenance, dates and limitations'));
    const dl = element('dl');
    for (const [name, value] of [
      ['Source family', r.sourceFamily],
      [
        'Reported period',
        r.period ? `${r.period.kind}: ${r.period.value}` : null,
      ],
      ['Event origin time', r.eventTime],
      ['Observation time', r.observationTime],
      ['Publication time', r.publicationTime],
      ['Retrieved', r.retrievedAt],
    ])
      dl.append(
        element('dt', name),
        element('dd', value ?? 'Unknown / unavailable'),
      );
    detail.append(dl);
    for (const m of r.measurements)
      if (m.methodology) detail.append(element('p', m.methodology));
    const limitations = element('ul');
    r.limitations.forEach((text) => limitations.append(element('li', text)));
    detail.append(limitations);
    card.append(detail);
    if (r.places.some((p) => p.latitude !== null) && composition.count) {
      const locate = element('button', 'Explore this location');
      locate.addEventListener('click', () => {
        highlightId = r.id;
        $('geography-detail').open = true;
        composition.update({
          ...geographyForAccount(account, id, snapshotIndex),
          highlightId,
        });
        $('map').scrollIntoView({ block: 'center' });
      });
      card.append(locate);
    }
    list.append(card);
  }
  $('more-evidence').hidden = allRecords || view.records.length <= 12;
  const history = $('revision-list');
  history.replaceChildren();
  for (const revision of claim.revisions)
    history.append(
      element('p', `${revision.at} — ${revision.reason}`, 'revision'),
    );
  const timeline = $('chronology');
  timeline.replaceChildren();
  const row = (label, value) =>
    timeline.append(element('li', `${label}: ${value ?? 'unknown'}`));
  row('Source publication', account.source.publicationTime);
  row(
    'Reported date/year',
    claim.interpretation.eventDate ?? claim.interpretation.year,
  );
  for (const { record: r } of records)
    row('Record period/origin', r.eventTime ?? r.period?.value);
  if (visit) row('Evidence retrieved', visit.retrievedAt);
  row(
    'Sensor observation time',
    'Unavailable unless the record provides it; present-day data does not verify a historical account.',
  );
  renderSource(account, claim);
  composition.update({
    ...geographyForAccount(account, id, snapshotIndex),
    highlightId,
  });
}
function render(state) {
  $('start').disabled = Boolean(state.pending);
  $('progress').textContent = state.pending ?? '';
  $('error').hidden = !state.error;
  if (state.error) $('error').textContent = state.error;
  renderDiscovery(state.discovery);
  $('result').hidden = !state.account;
  if (!state.account) {
    previousAccount = null;
    previousSelection = null;
    composition?.update({
      records: [],
      countries: [],
      queryLabel: 'No report selected.',
    });
    return;
  }
  if (
    state.account === previousAccount &&
    state.selectedId === previousSelection
  ) {
    $('retry').disabled = Boolean(state.pending);
    return;
  }
  if (state.selectedId !== previousSelection) {
    snapshotIndex = -1;
    allRecords = false;
    highlightId = null;
  }
  previousAccount = state.account;
  previousSelection = state.selectedId;
  const account = state.account;
  $('account-title').textContent = account.source.title || 'Submitted report';
  const withRecords = new Set(
    account.retrievals.filter((r) => r.status === 'ok').map((r) => r.claimId),
  ).size;
  $('overview-copy').textContent =
    `${account.claims.length} proposed factual statements · ${withRecords} have retrieved context · ${account.unassessed.length} source passages remain unassessed. No overall truth verdict is assigned.`;
  const target = $('claim-list');
  target.replaceChildren();
  account.claims.forEach((claim, index) => {
    const button = element('button', undefined, 'claim-card');
    button.setAttribute('aria-pressed', String(claim.id === state.selectedId));
    const visit = latest(account, claim.id);
    button.append(
      element(
        'small',
        `STATEMENT ${index + 1} · ${visit?.status === 'ok' ? 'Related records available' : visit?.status === 'error' ? 'Source visit failed' : visit?.status === 'unresolved' ? 'Needs context or another capability' : 'Not assessed'}`,
      ),
      element('strong', claim.text),
    );
    button.addEventListener('click', () => application.select(claim.id));
    target.append(button);
  });
  $('unassessed-summary').textContent =
    `Unassessed wording (${account.unassessed.length} passages)`;
  $('unassessed-text').replaceChildren();
  for (const part of account.unassessed) {
    const item = element('p', undefined, 'unassessed-item');
    item.append(
      document.createTextNode(part.text),
      element('small', part.reason),
    );
    $('unassessed-text').append(item);
  }
  renderDetail(account, state.selectedId);
}
$('theme').addEventListener('change', () => applyTheme($('theme').value));
document
  .querySelectorAll('input[name=mode]')
  .forEach((input) => input.addEventListener('change', setMode));
$('entrance-form').addEventListener('submit', (event) => {
  event.preventDefault();
  guarded(async () => {
    snapshotIndex = -1;
    allRecords = false;
    await application.submit({ mode: mode(), value: $('input').value.trim() });
    if (application.getState().account) $('result').focus();
  });
});
$('clarify-form').addEventListener('submit', (event) => {
  event.preventDefault();
  guarded(async () => {
    application.clarify($('clarification').value, $('correction-reason').value);
    $('clarification').value = '';
    $('correction-reason').value = '';
    await application.investigateSelected();
    note(
      'Correction and a separate evidence visit recorded. The original wording remains unchanged.',
    );
  });
});
$('retry').addEventListener('click', () =>
  guarded(async () => {
    snapshotIndex = -1;
    await application.investigateSelected();
    note('A new evidence visit was recorded. Older visits remain available.');
  }),
);
$('show-source').addEventListener('click', () => {
  $('original-detail').open = true;
  $('original-detail').scrollIntoView({ block: 'start' });
});
$('snapshot').addEventListener('change', () => {
  snapshotIndex = Number($('snapshot').value);
  allRecords = false;
  highlightId = null;
  const state = application.getState();
  renderDetail(state.account, state.selectedId);
});
$('more-evidence').addEventListener('click', () => {
  allRecords = true;
  const state = application.getState();
  renderDetail(state.account, state.selectedId);
});
$('save').addEventListener('click', () =>
  guarded(() => {
    application.save();
    renderSaved();
    note(
      'Saved on this device, including original text and the recorded evidence.',
    );
  }),
);
$('close').addEventListener('click', () => application.clear());
$('export').addEventListener('click', () =>
  guarded(() => {
    const content = application.export(),
      url = URL.createObjectURL(
        new Blob([content], { type: 'application/json' }),
      ),
      a = element('a');
    a.href = url;
    a.download = `news-evidence-account-${application.getState().account.id}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    note(
      'Exported deliberately. The file includes text and recorded evidence.',
    );
  }),
);
$('text-file').addEventListener('change', () =>
  guarded(async () => {
    const file = $('text-file').files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.txt') || file.size > 300000)
      throw new Error(
        'Use a UTF-8 .txt file up to 300 KB, or paste a permitted transcript. Other media are not acquired.',
      );
    const text = new TextDecoder('utf-8', { fatal: true }).decode(
      await file.arrayBuffer(),
    );
    if (text.length > 100000)
      throw new Error(
        'This report exceeds 100,000 characters. Paste a shorter excerpt.',
      );
    document.querySelector('input[name=mode][value=text]').checked = true;
    setMode();
    $('input').value = text;
    note('Text loaded on this device. Choose Explore to inspect it.');
  }),
);
$('import').addEventListener('change', () =>
  guarded(async () => {
    const file = $('import').files[0];
    if (!file) return;
    if (file.size > 2500000)
      throw new Error('This account is larger than the 2.5 MB limit.');
    application.importAccount(
      JSON.parse(
        new TextDecoder('utf-8', { fatal: true }).decode(
          await file.arrayBuffer(),
        ),
      ),
    );
    note(
      'Imported as recorded. File provenance is not authenticated; no current retrieval occurred.',
    );
    $('result').focus();
  }),
);
try {
  application = createConsumer({
    api: createConsumerApi(),
    storage: createConsumerStorage(localStorage),
  });
  const geographic = new URLSearchParams(location.search).get('geography');
  let layers = [];
  if (geographic !== 'off') {
    const module =
      geographic === 'coordinates'
        ? await import('../geography/coordinate-list.js')
        : await import('../geography/map.js');
    layers = [
      geographic === 'coordinates' ? module.coordinateLayer : module.mapLayer,
    ];
  }
  composition = createComposition({
    layers,
    services: {
      mapHost: $('map'),
      boundaries: async ({ signal }) => {
        const r = await fetch('/assets/countries.json', { signal });
        if (!r.ok) throw new Error('Boundaries unavailable');
        return r.json();
      },
      onSelectEvidence: (id) =>
        document.getElementById(`record-${id}`)?.focus(),
    },
  });
  if (geographic === 'off') $('geography-detail').hidden = true;
  application.subscribe(render);
  renderSaved();
  setMode();
  addEventListener('pagehide', (event) => {
    if (event.persisted) {
      application.cancel();
      composition.disable();
    } else {
      application.dispose();
      composition.dispose();
    }
  });
  addEventListener('pageshow', (event) => {
    if (event.persisted) {
      composition.enable();
      const state = application.getState();
      if (state.account)
        composition.update(
          geographyForAccount(state.account, state.selectedId),
        );
    }
  });
} catch (error) {
  note(`The reading desk could not start: ${error.message}`, true);
}
