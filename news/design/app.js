import { claimView } from './account-view.js';
import { addContextMap } from './geography.js';
import { fixtures, directions } from './fixtures.js';
const $ = (s) => document.querySelector(s),
  main = $('#main');
const direction = new URLSearchParams(location.search).get('direction');
let current = null,
  selected = 0,
  step = 0,
  question = '',
  busy = false,
  accountMode = 'ready';
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );
const button = (label, action, extra = '') =>
  `<button data-action="${action}" ${extra}>${escape(label)}</button>`;
const status = (message) => {
  $('#feedback').textContent = message;
};
$('#theme').addEventListener('change', (e) => {
  document.documentElement.dataset.theme = e.target.value;
});
$('#close').onclick = () => $('#inspector').close();
function gallery() {
  main.innerHTML = `<p class="eyebrow">Four working alternatives / one comparison set</p><h1>How would you like to inspect a report?</h1><p>Explore four different reading journeys. Each uses the same invented report and evidence fixtures. The live service is separate.</p><div class="grid gallery">${directions.map(([id, name, desc], i) => `<article class="card"><p class="eyebrow">Direction ${i + 1}</p><h2>${name}</h2><p>${desc}</p><a href="?direction=${id}">Explore ${name.toLowerCase()}</a></article>`).join('')}</div><a href="/">Open the real supported service</a>`;
}
function intake() {
  const d = directions.find((x) => x[0] === direction);
  main.innerHTML = `<p class="eyebrow">${escape(d[1])}</p><h1>Start with something you want to understand.</h1><p>${escape(d[2])} This comparison does not acquire URLs or process pasted content.</p><section class="card"><form id="submission"><label>Choose a controlled report example<select id="fixture">${Object.entries(
    fixtures,
  )
    .map(([key, f]) => `<option value="${key}">${escape(f.name)}</option>`)
    .join(
      '',
    )}<option value="unsupported">Unsupported media or custom input</option></select></label><label>Submission mode<select id="mode"><option value="fixture">Controlled URL/text example</option><option value="headline">Headline discovery example</option><option value="media">Video or audio (unsupported)</option></select></label><label>Optional URL, headline or wording (illustrative only; will not be sent anywhere)<textarea id="input" placeholder="Paste a link or wording to exercise the unsupported-input explanation"></textarea></label><p class="hint">Choose an example to inspect its synthetic evidence. Any custom URL or wording receives a supported fallback instead of a fabricated result.</p><button class="primary" type="submit">Open selected example</button></form></section><div class="toolbar">${button('Reopen saved fixture account', 'reopen')}<a href="/design/index.html">Compare all directions</a></div>`;
  $('#submission').onsubmit = (e) => {
    e.preventDefault();
    const key = $('#fixture').value;
    const mode = $('#mode').value;
    if (mode === 'headline' && key !== 'unsupported') {
      main.innerHTML = `<h1>Which report did you mean?</h1><p>Controlled headline-discovery fixture. These are invented candidate cards, not search results. A headline alone is not a factual claim.</p><section class="card"><h2>${escape(fixtures[key].title)}</h2><p>Candidate A / complete invented account / ${escape(fixtures[key].date)}</p>${button('Choose this example report', 'candidate', `data-key="${key}"`)}</section><section class="card"><h2>A similarly worded report</h2><p>Candidate B / unavailable original. This comparison cannot resolve it.</p>${button('Original unavailable: show fallback', 'unsupported')}</section>${button('Refine or choose another example', 'reset')}`;
      return;
    }
    if (mode === 'media' || key === 'unsupported' || $('#input').value.trim()) {
      main.innerHTML = `<h1>This prototype cannot examine that source.</h1><section class="card"><p>No URL was acquired and no text was assessed. For controlled comparison, choose a fixture. The real service describes its actual supported modes.</p>${button('Choose a fixture', 'reset')} <a href="/">Open supported service</a></section>`;
      return;
    }
    current = structuredClone(fixtures[key]);
    current.key = key;
    selected = 0;
    step = 0;
    question = '';
    accountMode = 'ready';
    busy = true;
    render();
  };
}
function claimButtons() {
  return `<div class="claims">${current.claims.map((c, i) => button(c.quote, 'claim', `data-index="${i}" aria-pressed="${i === selected}"`)).join('')}</div>`;
}
function inspector() {
  const c = claimView(current, selected, accountMode);
  $('#detail').innerHTML =
    `<p class="eyebrow">Claim ${selected + 1} / synthetic inspection</p><h2>${escape(c.status)}</h2><h3>Original wording</h3><blockquote>${escape(c.quote)}</blockquote><h3>Evidence represented in this fixture</h3><p>${escape(c.evidence)}</p><h3>What it does not establish</h3><p>${escape(c.limit)}</p><h3>Source relationship</h3><p>${escape(c.family)}</p><p>No live retrieval occurred. Invented values are not statements made by the linked reference organization.</p>${current.source ? `<a href="${escape(current.source)}" target="_blank" rel="noopener">Open reference documentation: ${escape(current.reference)}</a><p class="hint">This external page explains the kind of evidence. It does not corroborate the synthetic report.</p>` : '<p>The original source is unavailable. Provide an original notice, transcript timestamp or publication date to resolve it.</p>'}`;
  $('#inspector').showModal();
}
function source() {
  $('#detail').innerHTML =
    `<p class="eyebrow">Synthetic original account</p><h2>${escape(current.title)}</h2><p>${escape(current.text)}</p><p>Publication: ${escape(current.publicationTime || 'Unknown: the fixture original publication time is not supplied')}. No publisher is impersonated. This complete text is invented.</p>`;
  $('#inspector').showModal();
}
function detailInline() {
  const c = claimView(current, selected, accountMode);
  return `<section class="card selected"><p class="eyebrow">Selected claim ${selected + 1}</p><h2>${escape(c.status)}</h2><blockquote>${escape(c.quote)}</blockquote><p>${escape(c.evidence)}</p><p class="hint">${escape(c.limit)}</p>${button('Inspect evidence and source family', 'inspect')} ${button('Read original wording', 'source')}</section>`;
}
function context() {
  return `<section class="card"><h2>Where and when</h2><p>${escape(current.place)}</p>${current.coords ? `<div id="context-map" class="map"></div><p class="hint">Orientation map: inherited Natural Earth country geometry (public domain). Context coordinate ${current.coords.join(', ')}. ${current.key === 'quake' ? 'Illustrative candidate location, not an observed event pin.' : 'Country orientation coordinate, not a reported event pin.'} No distance, affected area or causal inference can be read from it.</p>` : '<p>No map is drawn: the place is unresolved.</p>'}<ol class="timeline">${current.timeline.map(([kind, time]) => `<li><strong>${escape(kind)}</strong>${escape(time)}</li>`).join('')}</ol></section>`;
}
function ambiguity() {
  return `<section class="card"><h2>One question that could change this account</h2><p>${current.key === 'adversarial' ? 'Which Springfield, and what is the publication date?' : current.key === 'population' ? 'Does “population” mean the national total or a specific town?' : 'Does the report refer to the initial estimate or the later revision?'}</p><form id="question"><label>Your clarification<input id="clarification" value="${escape(question)}" placeholder="Enter a clarification for this fixture only"></label><button type="submit">Record clarification</button></form><p class="hint">${question ? 'Recorded as your clarification. Fixture evidence remains unchanged; no evidence was retrieved.' : 'Your answer is a user assertion until independently examined.'}</p></section>`;
}
function render() {
  main.innerHTML = `<p class="eyebrow">${escape(directions.find((x) => x[0] === direction)[1])} / ${escape(current.name)}</p><h1>${escape(current.title)}</h1><div class="toolbar">${button('Choose another example', 'reset')}${button('Read original source wording', 'source')}${button('Save fixture account locally', 'save')}${button('Reopen saved fixture account', 'reopen')}<label>Exercise account state<select id="state"><option value="ready">Available fixture</option><option value="partial">Partial evidence</option><option value="unavailable">Original unavailable</option><option value="ambiguous">Ambiguous context</option><option value="loading">Loading state</option></select></label></div><div id="state-notice" role="status"></div><div id="result"></div>`;
  $('#state').value = busy ? 'loading' : accountMode;
  $('#state').onchange = (e) => renderState(e.target.value);
  renderState(busy ? 'loading' : accountMode);
}
function renderState(mode) {
  accountMode = mode;
  const notice = $('#state-notice'),
    result = $('#result');
  if (mode === 'loading') {
    notice.innerHTML = `<section class="card"><h2>Loading-state preview</h2><p>This is a manually controlled design state. There is no background retrieval or model activity.</p>${button('Continue to stored fixture', 'continue')} ${button('Cancel and return', 'reset')}</section>`;
    result.innerHTML = '';
    return;
  }
  notice.innerHTML =
    mode === 'ready'
      ? ''
      : `<section class="card"><h2>${mode === 'partial' ? 'Only part of the evidence is available' : mode === 'unavailable' ? 'The original source is unavailable' : 'Context needs clarification'}</h2><p>${mode === 'partial' ? 'The last claim remains unassessed. Available fixture records are retained.' : mode === 'unavailable' ? 'Use retained original wording cautiously. Supply accessible text in the real service; do not bypass source restrictions.' : 'Do not guess a place or relative date. Record a targeted clarification below.'}</p></section>`;
  const overview = `<section class="card"><p class="eyebrow">What was examined</p><h2>Three claims. No overall verdict.</h2><p>${escape(current.summary)}</p><p class="hint">All three statements and synthetic evidence records are represented. ${mode === 'partial' ? 'The last claim has no usable supporting evidence.' : ''}</p></section>`;
  if (direction === 'guide') {
    result.innerHTML = `<nav class="steps" aria-label="Review steps">${['1. Understand', '2. Inspect', '3. Reflect'].map((label, i) => button(label, 'step', `data-index="${i}" aria-pressed="${step === i}"`)).join('')}</nav>${step === 0 ? overview + `<h2>What would you like to examine?</h2>` + claimButtons() : step === 1 ? detailInline() + context() : `<h2>What can you conclude?</h2><p>The evidence applies claim by claim. An unresolved allegation remains unresolved; it does not make the whole report false.</p>` + ambiguity() + context()}<div class="toolbar">${step > 0 ? button('Previous step', 'previous') : ''}${step < 2 ? button('Next step', 'next') : ''}</div>`;
  }
  if (direction === 'document') {
    result.innerHTML =
      overview +
      `<div class="reader"><article class="card document"><p class="eyebrow">Original account / select a span</p>${claimButtons()}</article><aside>${detailInline()}${ambiguity()}</aside></div><details><summary>Open place and chronology context</summary>${context()}</details>`;
  }
  if (direction === 'journey') {
    result.innerHTML = `<p>${escape(current.summary)}</p><div class="split">${context()}<section><h2>Follow the claim at each stage</h2><p class="hint">Time order supplies context; it does not prove a causal chain.</p>${claimButtons()}${detailInline()}</section></div>${ambiguity()}`;
  }
  if (direction === 'matrix') {
    result.innerHTML =
      overview +
      `<section class="card comparison"><h2>Assertion × evidence relationship</h2><table><caption>Same records; source copies are grouped rather than counted as confirmations</caption><thead><tr><th scope="col">Original claim</th><th scope="col">Evidence family</th><th scope="col">What remains open</th></tr></thead><tbody>${current.claims
        .map((raw, i) => {
          const c = claimView(current, i, mode);
          return `<tr><th scope="row">${button(c.quote, 'claim', `data-index="${i}"`)}</th><td><span class="status">${escape(c.status)}</span>${escape(c.family)}</td><td>${escape(c.limit)}</td></tr>`;
        })
        .join(
          '',
        )}</tbody></table></section><div class="split">${detailInline()}${ambiguity()}</div><details><summary>Place and chronology context</summary>${context()}</details>`;
  }
  const map = $('#context-map');
  if (map && current.coords) addContextMap(map, current.coords, current.key);
  const q = $('#question');
  if (q)
    q.onsubmit = (e) => {
      e.preventDefault();
      question = $('#clarification').value.trim();
      status(
        'Clarification recorded locally as your assertion; evidence unchanged.',
      );
      renderState(mode);
    };
}
main.addEventListener('click', (e) => {
  const b = e.target.closest('[data-action]');
  if (!b) return;
  switch (b.dataset.action) {
    case 'candidate':
      current = structuredClone(fixtures[b.dataset.key]);
      current.key = b.dataset.key;
      selected = 0;
      step = 0;
      question = '';
      accountMode = 'ready';
      busy = true;
      render();
      break;
    case 'unsupported':
      main.innerHTML =
        '<h1>The original is unavailable.</h1><p>No source was acquired. Choose the other controlled candidate or provide accessible original text in the real service.</p>' +
        button('Return to submission', 'reset');
      break;
    case 'reset':
      current = null;
      busy = false;
      intake();
      break;
    case 'continue':
      busy = false;
      accountMode = 'ready';
      render();
      break;
    case 'claim':
      selected = Number(b.dataset.index);
      if (direction === 'guide') {
        step = 1;
        renderState(accountMode);
      } else {
        renderState($('#state').value);
        inspector();
      }
      break;
    case 'inspect':
      inspector();
      break;
    case 'source':
      source();
      break;
    case 'step':
      step = Number(b.dataset.index);
      renderState($('#state').value);
      break;
    case 'next':
      step = Math.min(2, step + 1);
      renderState(accountMode);
      break;
    case 'previous':
      step = Math.max(0, step - 1);
      renderState(accountMode);
      break;
    case 'save':
      try {
        localStorage.setItem(
          'nev-design-account',
          JSON.stringify({ current, selected, question, step, accountMode }),
        );
        status(
          'Synthetic account and its unchanged evidence saved in this browser.',
        );
      } catch {
        status(
          'Browser storage unavailable. Keep this tab open to retain the fixture.',
        );
      }
      break;
    case 'reopen':
      try {
        const saved = JSON.parse(localStorage.getItem('nev-design-account'));
        if (!saved || !fixtures[saved.current?.key]) {
          status('No fixture account saved. Open an example, then save it.');
          break;
        }
        current = structuredClone(fixtures[saved.current.key]);
        current.key = saved.current.key;
        selected =
          Number.isInteger(saved.selected) &&
          saved.selected >= 0 &&
          saved.selected < 3
            ? saved.selected
            : 0;
        question = String(saved.question || '');
        step = [0, 1, 2].includes(saved.step) ? saved.step : 0;
        accountMode = ['ready', 'partial', 'unavailable', 'ambiguous'].includes(
          saved.accountMode,
        )
          ? saved.accountMode
          : 'ready';
        busy = false;
        render();
        status('Saved fixture reopened. No new retrieval occurred.');
      } catch {
        status('Saved fixture unavailable; choose a fresh example.');
      }
      break;
  }
});
if (directions.some((x) => x[0] === direction)) intake();
else gallery();
