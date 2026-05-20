import { detectAnomaliesWithHistory, parseGeoJSON } from './anomalyDetection';

const AVAILABLE_DATASETS = [
  { id: '2026-02', name: 'February 2026', month_label: '2026-02', file: '2026-02.geojson' },
  { id: '2026-03', name: 'March 2026', month_label: '2026-03', file: '2026-03.geojson' },
  { id: '2026-04', name: 'April 2026', month_label: '2026-04', file: '2026-04.geojson' },
  { id: '2026-05', name: 'May 2026', month_label: '2026-05', file: '2026-05.geojson' },
];

const datasetStatus = 'completed';
/** @type {{file: string, error: string}[]} */
const loadErrors = [];

/**
 * @param {string} fileName
 */
async function fetchGeoJSONFile(fileName) {
  try {
    const response = await fetch(`/data/${fileName}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${fileName} (status ${response.status})`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching GeoJSON file ${fileName}:`, error);
    let errorMsg = '';
    if (error && typeof error === 'object' && 'message' in error) {
      errorMsg = String(error.message);
    } else {
      errorMsg = String(error);
    }
    const err = { file: fileName, error: errorMsg };
    loadErrors.push(err);
    return { features: [], __error: err.error };
  }
}

/**
 * @param {{id: string, name: string, month_label: string, file: string}} dataset
 */
async function loadDatasetAccounts(dataset) {
  const geojson = await fetchGeoJSONFile(dataset.file);
  const accounts = parseGeoJSON(geojson, dataset.month_label);

  return accounts
    .filter(a => a && a.accountId)
    .map(account => ({
      ...account,
      datasetId: dataset.id,
    }));
}

/** @type {Promise<any[]> | null} */
let _allAccountsPromise = null;

async function loadAllAccounts() {
  if (!_allAccountsPromise) {
    _allAccountsPromise = Promise.all(AVAILABLE_DATASETS.map(loadDatasetAccounts))
      .then(lists => lists.flat())
      .catch(err => {
        _allAccountsPromise = null; // allow retry on failure
        throw err;
      });
  }
  return _allAccountsPromise;
}

/** Force a fresh reload of all account data (e.g. after dataset files are updated) */
export function invalidateAccountsCache() {
  _allAccountsPromise = null;
}

/**
 * @param {string[]} months
 */
function sortMonths(months) {
  return [...months].sort((a, b) => a.localeCompare(b));
}

export const staticDataService = {
    /**
     * Returns the last N months of consumption for an account as an array:
     * [ { month: '2026-03', consumption: ... }, ... ]
     */
    /**
     * @param {string} accountId
     * @param {number} [months=3]
     */
    async getAccountHistory(accountId, months = 3) {
      const allAccounts = await loadAllAccounts();
      const sortedDatasets = sortMonths(AVAILABLE_DATASETS.map(d => d.id));

      /** @type {Record<string, any>} */
      const accountMap = {};
      for (const acc of allAccounts) {
        if (acc.accountId === accountId) {
          accountMap[acc.datasetId] = acc;
        }
      }

      const matchedMonths = Object.keys(accountMap);
      if (matchedMonths.length === 0) {
        console.warn(`[getAccountHistory] No data found for accountId="${accountId}". Total accounts loaded: ${allAccounts.length}`);
      }

      // cumUsed is already monthly consumption (prsReading - prvReading), use it directly
      // Find the index of the latest month with data for this account
      const lastMonthIdx = sortedDatasets.reduce((idx, month, i) => accountMap[month] ? i : idx, -1);
      // Get previous 3 months (including current if present)
      const trendMonths = lastMonthIdx >= 2 ? sortedDatasets.slice(lastMonthIdx - 2, lastMonthIdx + 1) : sortedDatasets.slice(0, 3);
      // Build an aligned array of raw values for the trend window
      const rawValues = trendMonths.map(month => {
        const acc = accountMap[month];
        return acc && acc.cumUsed !== undefined && acc.cumUsed !== null ? Number(acc.cumUsed) : null;
      });

      const numericValues = rawValues.map(v => (v === null ? null : Number(v)));

      const trend = trendMonths.map((month, i) => {
        const val = numericValues[i];
        if (val === null || isNaN(val)) return { month, consumption: null };
        return { month, consumption: Math.round(val * 100) / 100 };
      });
      // Pad with nulls at the start if fewer than 3 months
      while (trend.length < 3) {
        trend.unshift({ month: null, consumption: null });
      }
      return trend;
    },
  async getDatasets() {
    const allAccounts = await loadAllAccounts();
    const anomalies = await this.getAnomalies();

    return AVAILABLE_DATASETS.map(dataset => {
      const err = loadErrors.find(e => e.file === dataset.file);
      return {
        ...dataset,
        status: datasetStatus,
        totalAccounts: allAccounts.filter(account => account.datasetId === dataset.id).length,
        anomaliesFound: anomalies.filter(anomaly => anomaly.datasetId === dataset.id).length,
        loadError: err ? err.error : null,
      };
    });
  },

  async getAnomalies() {
    const months = sortMonths(this.getAvailableMonths());

    const allAccounts = await loadAllAccounts();
    const historicalAccounts = [];
    const anomalies = [];

    for (const month of months) {
      const currentAccounts = allAccounts.filter(account => account.datasetId === month);
      console.log(`[getAnomalies] Month ${month}: ${currentAccounts.length} current accounts, ${historicalAccounts.length} historical accounts`);
      const monthAnomalies = detectAnomaliesWithHistory(currentAccounts, historicalAccounts);
      console.log(`[getAnomalies] Month ${month}: Detected ${monthAnomalies.length} anomalies`);
      anomalies.push(...monthAnomalies);
      historicalAccounts.push(...currentAccounts);
    }

    // Remove zero_consumption anomalies that are superseded by later non-zero readings for the same account
    const monthIndex = {};
    months.forEach((m, i) => { monthIndex[m] = i; });

    const latestByAccount = {};
    for (const acc of allAccounts) {
      if (!acc.accountId) continue;
      const idx = monthIndex[acc.datasetId] ?? -1;
      if (idx === -1) continue;
      if (!latestByAccount[acc.accountId] || idx > latestByAccount[acc.accountId].index) {
        latestByAccount[acc.accountId] = { acc, index: idx };
      }
    }

    const filtered = anomalies.filter(a => {
      if (a.anomalyType !== 'zero_consumption') return true;
      const latest = latestByAccount[a.accountNumber];
      if (!latest) return true;
      const anomalyIdx = monthIndex[a.datasetId] ?? -1;
      // If there is a later dataset for this account, and that later dataset shows positive consumption, drop the earlier zero flag
      if (latest.index > anomalyIdx) {
        const la = latest.acc;
        let latestConsumption = null;
        const hasPrv = la.prvReading !== undefined && la.prvReading !== null && !isNaN(Number(la.prvReading));
        const hasPrs = la.prsReading !== undefined && la.prsReading !== null && !isNaN(Number(la.prsReading));
        if (hasPrv && hasPrs) {
          latestConsumption = Number(la.prsReading) - Number(la.prvReading);
        } else if (la.rawCumUsed !== undefined && la.rawCumUsed !== null) {
          latestConsumption = Number(la.rawCumUsed);
        } else {
          latestConsumption = Number(la.cumUsed);
        }
        if (isNaN(latestConsumption)) latestConsumption = 0;
        if (latestConsumption > 0) {
          return false;
        }
      }
      return true;
    });

    return filtered;
  },

  /**
   * @param {string} month
   */
  async getGeoJSONData(month) {
    const dataset = AVAILABLE_DATASETS.find(item => item.id === month);
    if (!dataset) {
      console.warn(`GeoJSON request for unknown month: ${month}`);
      return { features: [] };
    }
    return fetchGeoJSONFile(dataset.file);
  },

  getAvailableMonths() {
    return AVAILABLE_DATASETS.map(dataset => dataset.id);
  },

  getLoadErrors() {
    return loadErrors.slice();
  },
};
