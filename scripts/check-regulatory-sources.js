// ABOUTME: Monitors Singapore mortgage regulatory sources for changes.
// ABOUTME: Logs fetch metadata and content hashes for compliance tracking.

const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const sources = [
  {
    id: 'mas_macroprudential_20250226',
    authority: 'MAS',
    url: 'https://www.mas.gov.sg/publications/macroprudential-policies-in-singapore',
    description: 'Macroprudential Policies in Singapore (26 Feb 2025)',
  },
  {
    id: 'mas_ltv_explainer_20180705',
    authority: 'MAS',
    url: 'https://www.mas.gov.sg/regulation/explainers/new-housing-loans/loan-tenure-and-loan-to-value-limits',
    description: 'Loan Tenure and Loan-to-Value Limits explainer (5 Jul 2018)',
  },
  {
    id: 'mas_tdsr_calculation_20180705',
    authority: 'MAS',
    url: 'https://www.mas.gov.sg/regulation/explainers/tdsr-for-property-loans/calculating-tdsr',
    description: 'Calculating TDSR for Property Loans explainer (5 Jul 2018)',
  },
  {
    id: 'mas_tdsr_thresholds_20211216',
    authority: 'MAS',
    url: 'https://www.mas.gov.sg/regulation/explainers/tdsr-for-property-loans/calculating-tdsr-thresholds',
    description: 'TDSR Thresholds for Property Loans explainer (16 Dec 2021)',
  },
  {
    id: 'mas_msr_tdsr_rules_20211216',
    authority: 'MAS',
    url: 'https://www.mas.gov.sg/regulation/explainers/new-housing-loans/msr-and-tdsr-rules',
    description: 'Mortgage Servicing Ratio and Total Debt Servicing Ratio rules (16 Dec 2021)',
  },
  {
    id: 'iras_bsd_20250109',
    authority: 'IRAS',
    url: 'https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/buyer\'s-stamp-duty-(bsd)',
    description: 'Buyer’s Stamp Duty guidance (9 Jan 2025)',
  },
  {
    id: 'iras_absd_20250109',
    authority: 'IRAS',
    url: 'https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer\'s-stamp-duty-(absd)',
    description: 'Additional Buyer’s Stamp Duty guidance (9 Jan 2025)',
  },
  {
    id: 'iras_ssd_residential',
    authority: 'IRAS',
    url: 'https://www.iras.gov.sg/taxes/stamp-duty/for-property/selling-or-disposing-property/seller\'s-stamp-duty-(ssd)-for-residential-property',
    description: 'Seller’s Stamp Duty for residential property guidance',
  },
  {
    id: 'hdb_housing_loan_20250428',
    authority: 'HDB',
    url: 'https://www.hdb.gov.sg/residential/buying-a-flat/understanding-your-eligibility-and-housing-loan-options/housing-loan-from-hdb',
    description: 'Housing Loan from HDB eligibility and tenure guidance (28 Apr 2025)',
  },
  {
    id: 'sla_foreign_ownership_20250820',
    authority: 'SLA',
    url: 'https://www.sla.gov.sg/regulatory/foreign-ownership-of-property/',
    description: 'Foreign ownership of property guidance (20 Aug 2025)',
  },
];

const LOG_DIR = path.resolve(__dirname, '..', 'logs', 'regulatory');
const STATE_PATH = path.join(LOG_DIR, 'latest.json');

function getRunLogPath() {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  return path.join(LOG_DIR, `regulatory-check-${yyyy}${mm}${dd}.jsonl`);
}

async function ensureLogDir() {
  await fs.mkdir(LOG_DIR, { recursive: true });
}

async function loadState() {
  try {
    const raw = await fs.readFile(STATE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

async function saveState(state) {
  const serialized = JSON.stringify(state, null, 2);
  await fs.writeFile(STATE_PATH, serialized, 'utf8');
}

function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function fetchSource(source, previous) {
  const timestamp = new Date().toISOString();
  const result = {
    timestamp,
    sourceId: source.id,
    authority: source.authority,
    url: source.url,
    description: source.description,
    status: 'unknown',
    httpStatus: null,
    contentHash: null,
    lastModifiedHeader: null,
    etagHeader: null,
    changeDetected: false,
    firstObservation: !previous,
    error: null,
  };

  try {
    const response = await fetch(source.url, {
      method: 'GET',
      headers: {
        'user-agent': 'NextNest-Regulatory-Monitor/1.0 (+https://nextnest)',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    result.httpStatus = response.status;
    result.statusText = response.statusText;

    if (!response.ok) {
      result.status = 'http_error';
      result.error = `HTTP ${response.status} ${response.statusText || ''}`.trim();
      return result;
    }

    const body = await response.text();
    const contentHash = hashContent(body);

    result.status = 'success';
    result.contentHash = contentHash;
    result.lastModifiedHeader = response.headers.get('last-modified');
    result.etagHeader = response.headers.get('etag');

    if (previous && previous.contentHash && previous.contentHash !== contentHash) {
      result.changeDetected = true;
    } else if (!previous) {
      result.changeDetected = true;
    }

    return result;
  } catch (error) {
    result.status = 'network_error';
    result.error = error.message;
    return result;
  }
}

async function appendLogEntries(logPath, entries) {
  if (!entries.length) {
    return;
  }
  const payload = entries.map((entry) => JSON.stringify(entry)).join('\n') + '\n';
  await fs.appendFile(logPath, payload, 'utf8');
}

async function main() {
  await ensureLogDir();
  const state = await loadState();
  const nextState = { ...state };
  const logPath = getRunLogPath();
  const results = [];

  for (const source of sources) {
    const previous = state[source.id] || null;
    const outcome = await fetchSource(source, previous);
    results.push(outcome);

    if (outcome.status === 'success') {
      nextState[source.id] = {
        contentHash: outcome.contentHash,
        lastCheckedAt: outcome.timestamp,
        lastModifiedHeader: outcome.lastModifiedHeader,
        etagHeader: outcome.etagHeader,
      };
    }
  }

  await appendLogEntries(logPath, results);
  await saveState(nextState);

  const summary = results.map((entry) => ({
    source: entry.sourceId,
    status: entry.status,
    httpStatus: entry.httpStatus,
    changeDetected: entry.changeDetected,
    error: entry.error,
  }));

  console.table(summary);

  const failureCount = results.filter((entry) => entry.status !== 'success').length;
  if (failureCount > 0) {
    console.error(`Completed with ${failureCount} fetch failure(s). See ${logPath} for details.`);
    process.exitCode = 1;
  } else {
    console.log(`Completed successfully. Results logged to ${logPath}.`);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Unexpected failure:', error);
    process.exitCode = 1;
  });
}
