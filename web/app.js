/**
 * Slider-driven exploration of the Flow 2A new-car acquisition paths.
 *
 * This module owns presentation only. Every financial figure is produced by
 * `src/engine/`, which is the implementation locked by `src/engine/*.test.js`
 * and cross-checked against the Python harness in `validation/`. Do not
 * reimplement or "adjust" a formula here: fix the engine and its tests instead.
 */

import { flow2aScenario } from '../src/engine/fixtures.js';
import { comparePaths } from '../src/engine/new-car.js';

/**
 * Display metadata, in the fixed order `comparePaths` returns. Keying by
 * position rather than by the engine's path string keeps the label stable even
 * when the engine renames a path based on the horizon (for example
 * `lease` becomes `lease-then-buyout` past the lease term).
 */
const SERIES = [
  { key: 'cash', label: 'Cash', color: 'var(--cash)' },
  { key: 'loan', label: 'Loan', color: 'var(--loan)' },
  { key: 'lease', label: 'Lease (return)', color: 'var(--lease)' },
  { key: 'lease-buyout', label: 'Lease then buyout', color: 'var(--lease-buyout)' },
];

/** Attach display metadata to each engine result by position. */
function describe(results) {
  return results.map((result, index) => ({ ...SERIES[index], result }));
}

const HORIZONS = [12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72];

const CONTROLS = [
  {
    id: 'availableCapital',
    label: 'Available capital at time zero',
    min: 4000,
    max: 60000,
    step: 500,
    value: 42000,
    format: money,
  },
  {
    id: 'downPayment',
    label: 'Loan down payment',
    min: 0,
    max: 42000,
    step: 500,
    value: 8400,
    format: money,
  },
  {
    id: 'apr',
    label: 'Loan APR',
    min: 0,
    max: 15,
    step: 0.1,
    value: 3.99,
    format: (v) => `${v.toFixed(2)}%`,
    toModel: (v) => v / 100,
  },
  {
    id: 'loanTermMonths',
    label: 'Loan term',
    min: 24,
    max: 84,
    step: 12,
    value: 60,
    format: (v) => `${v} mo`,
  },
  {
    id: 'horizonMonths',
    label: 'Holding period',
    min: 12,
    max: 72,
    step: 6,
    value: 36,
    format: (v) => `${v} mo`,
    scenarioInput: false,
  },
  {
    id: 'discountRateAnnual',
    label: 'Discount rate',
    min: 0,
    max: 8,
    step: 0.1,
    value: 1.5,
    format: (v) => `${v.toFixed(1)}%`,
    toModel: (v) => v / 100,
  },
  {
    id: 'grossAnnualReturn',
    label: 'Investment return',
    min: 0,
    max: 15,
    step: 0.5,
    value: 10,
    format: (v) => `${v.toFixed(1)}%`,
    toModel: (v) => v / 100,
  },
];

const state = Object.fromEntries(CONTROLS.map((c) => [c.id, c.value]));
state.saving = 'invested';
state.basis = 'monthlyOwnershipCost';

function money(value) {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

function signedMoney(value) {
  return value < 0 ? `-${money(Math.abs(value))}` : money(value);
}

/** Build the engine scenario from the current slider state. */
function scenarioFromState() {
  const overrides = {};
  for (const control of CONTROLS) {
    if (control.scenarioInput === false) continue;
    const raw = state[control.id];
    overrides[control.id] = control.toModel ? control.toModel(raw) : raw;
  }
  // Only the "invested" behavior earns a return, so it is the only one that
  // charges a path for the growth its own time-zero outlay gave up.
  if (state.saving !== 'invested') overrides.grossAnnualReturn = 0;
  // A down payment above what the buyer holds is not a real option.
  overrides.downPayment = Math.min(overrides.downPayment, overrides.availableCapital);
  return flow2aScenario(overrides);
}

function seriesLabel(key) {
  const match = SERIES.find((s) => s.key === key);
  return match ? match.label : key;
}

function seriesColor(key) {
  const match = SERIES.find((s) => s.key === key);
  return match ? match.color : 'var(--muted)';
}

function renderControls() {
  const host = document.getElementById('controls');
  host.innerHTML = '';
  for (const control of CONTROLS) {
    const wrapper = document.createElement('div');
    wrapper.className = 'control';
    wrapper.innerHTML = `
      <label for="${control.id}">
        <span>${control.label}</span>
        <output id="${control.id}-out"></output>
      </label>
      <input type="range" id="${control.id}" min="${control.min}" max="${control.max}"
             step="${control.step}" value="${control.value}" />
    `;
    host.appendChild(wrapper);

    const input = wrapper.querySelector('input');
    input.addEventListener('input', () => {
      state[control.id] = Number(input.value);
      render();
    });
  }
}

function syncControlOutputs() {
  for (const control of CONTROLS) {
    document.getElementById(`${control.id}-out`).textContent = control.format(
      state[control.id],
    );
  }
}

/** Evaluate every horizon once so the chart and the table stay consistent. */
function buildSeries(scenario) {
  const byPath = new Map();
  for (const months of HORIZONS) {
    for (const { key, result } of describe(comparePaths(scenario, months))) {
      if (!result.comparable) continue;
      if (!byPath.has(key)) byPath.set(key, []);
      byPath.get(key).push({ months, result });
    }
  }
  return byPath;
}

function renderChart(byPath) {
  const host = document.getElementById('chart');
  const width = 720;
  const height = 300;
  const pad = { top: 16, right: 16, bottom: 34, left: 56 };

  const points = [...byPath.values()].flat().map((p) => p.result[state.basis]);
  if (points.length === 0) {
    host.innerHTML = '<p class="hint">No comparable path at these inputs.</p>';
    return;
  }

  const minY = Math.min(...points) * 0.9;
  const maxY = Math.max(...points) * 1.05;
  const x = (m) =>
    pad.left +
    ((m - HORIZONS[0]) / (HORIZONS.at(-1) - HORIZONS[0])) *
      (width - pad.left - pad.right);
  const y = (v) =>
    height - pad.bottom - ((v - minY) / (maxY - minY)) * (height - pad.top - pad.bottom);

  const gridLines = [];
  const ticks = 4;
  for (let i = 0; i <= ticks; i += 1) {
    const value = minY + ((maxY - minY) * i) / ticks;
    gridLines.push(`
      <line x1="${pad.left}" x2="${width - pad.right}" y1="${y(value)}" y2="${y(value)}"
            stroke="#272e38" stroke-width="1" />
      <text x="${pad.left - 8}" y="${y(value) + 4}" fill="#9aa7b4" font-size="11"
            text-anchor="end">${money(value)}</text>
    `);
  }

  const xLabels = [12, 24, 36, 48, 60, 72].map(
    (m) => `
      <text x="${x(m)}" y="${height - pad.bottom + 18}" fill="#9aa7b4" font-size="11"
            text-anchor="middle">${m}</text>`,
  );

  const paths = [];
  for (const [key, entries] of byPath) {
    const sorted = [...entries].sort((a, b) => a.months - b.months);
    const d = sorted
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.months)},${y(p.result[state.basis])}`)
      .join(' ');
    paths.push(
      `<path d="${d}" fill="none" stroke="${seriesColor(key)}" stroke-width="2" />`,
    );
    for (const p of sorted) {
      const selected = p.months === state.horizonMonths;
      paths.push(
        `<circle cx="${x(p.months)}" cy="${y(p.result[state.basis])}"
                 r="${selected ? 5 : 3}" fill="${seriesColor(key)}"
                 stroke="${selected ? '#e6edf3' : 'none'}" stroke-width="1.5">
           <title>${seriesLabel(key)} at ${p.months} mo: ${money(p.result[state.basis])}/mo</title>
         </circle>`,
      );
    }
  }

  const marker = `<line x1="${x(state.horizonMonths)}" x2="${x(state.horizonMonths)}"
      y1="${pad.top}" y2="${height - pad.bottom}" stroke="#4f9cf9" stroke-dasharray="4 4"
      stroke-width="1" opacity="0.6" />`;

  host.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img"
         aria-label="Equivalent monthly ownership cost by holding period">
      ${gridLines.join('')}
      ${marker}
      ${paths.join('')}
      ${xLabels.join('')}
      <text x="${width / 2}" y="${height - 4}" fill="#9aa7b4" font-size="11"
            text-anchor="middle">Holding period (months)</text>
    </svg>
    <div class="legend">
      ${[...byPath.keys()]
        .map(
          (key) =>
            `<span style="color:${seriesColor(key)}"><em style="color:var(--muted);font-style:normal">${seriesLabel(key)}</em></span>`,
        )
        .join('')}
    </div>
  `;
}

function renderResults(scenario) {
  const host = document.getElementById('results');
  const described = describe(comparePaths(scenario, state.horizonMonths));
  const comparable = described.filter((d) => d.result.comparable);
  const excluded = described.filter((d) => !d.result.comparable);

  const affordable = comparable.filter((d) => d.result.affordable);
  const best = affordable.length
    ? Math.min(...affordable.map((d) => d.result[state.basis]))
    : null;

  const rows = comparable
    .map(({ label, result: r }) => {
      const isBest = r.affordable && r[state.basis] === best;
      return `
        <tr>
          <td>${label}${
            r.affordable
              ? isBest
                ? ' <span class="flag" style="background:#1d3a2a;color:#66d19e">lowest cost</span>'
                : ''
              : ' <span class="flag">exceeds capital</span>'
          }</td>
          <td>${money(r.monthlyOwnershipCost)}</td>
          <td>${money(r.investmentAdjustedMonthlyCost)}</td>
          <td>${money(r.timeZeroOutlay)}</td>
          <td>${signedMoney(r.costNpv)}</td>
          <td>${money(r.vehicleEquity)}</td>
          <td>${money(state.saving === 'spent' ? 0 : r.investmentBalance)}</td>
        </tr>`;
    })
    .join('');

  host.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Path</th>
          <th>Vehicle-only /mo</th>
          <th>Opp.-cost adj. /mo</th>
          <th>Time-zero outlay</th>
          <th>Cost NPV</th>
          <th>Vehicle equity</th>
          <th>Investment balance</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="7">No comparable path.</td></tr>'}</tbody>
    </table>
    ${
      excluded.length
        ? `<ul class="reasons">${excluded
            .map(
              ({ label, result }) =>
                `<li><strong>${label}</strong> excluded: ${result.reason}</li>`,
            )
            .join('')}</ul>`
        : ''
    }
  `;
}

function renderBasisHint() {
  const hints = {
    invested:
      'Opportunity-cost adjusted: also charges each path for the return its own time-zero outlay gave up. This charge does not depend on how much capital you actually hold.',
    cash: 'Opportunity cost is zero because unspent capital is held as cash rather than invested, so this matches the vehicle-only view.',
    spent:
      'Opportunity cost is zero because unspent capital is not saved at all, so this matches the vehicle-only view and no residual balance remains.',
  };
  document.getElementById('basis-hint').textContent =
    state.basis === 'monthlyOwnershipCost'
      ? 'Vehicle-only: what the vehicle itself costs per month, ignoring what the money could have earned elsewhere.'
      : hints[state.saving];
}

function render() {
  syncControlOutputs();
  const scenario = scenarioFromState();
  renderChart(buildSeries(scenario));
  renderResults(scenario);
  renderBasisHint();
}

function bindRadios(name, key) {
  for (const input of document.querySelectorAll(`input[name="${name}"]`)) {
    input.addEventListener('change', () => {
      if (!input.checked) return;
      state[key] = input.value;
      render();
    });
  }
}

renderControls();
bindRadios('saving', 'saving');
bindRadios('basis', 'basis');
render();
