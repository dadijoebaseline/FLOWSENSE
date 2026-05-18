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

async function loadAllAccounts() {
  const accountLists = await Promise.all(AVAILABLE_DATASETS.map(loadDatasetAccounts));
  return accountLists.flat();
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
      // Load all accounts from all datasets
      const allAccounts = await loadAllAccounts();
      // Sort datasets by month ascending
      const sortedDatasets = sortMonths(AVAILABLE_DATASETS.map(d => d.id));
      // Build a map of datasetId -> account record
      /** @type {Record<string, any>} */
      const accountMap = {};
      for (const acc of allAccounts) {
        if (acc.accountId === accountId) {
          accountMap[acc.datasetId] = acc;
        }
      }
      // Use cumUsed as the monthly consumption directly (not cumulative)
      const trend = sortedDatasets.map(month => {
        const acc = accountMap[month];
        return {
          month,
          consumption: acc && acc.cumUsed != null ? Number(acc.cumUsed) : null,
        };
      });
      // If not enough data, pad with nulls at the start
      while (trend.length < months) {
        trend.unshift({ month: sortedDatasets[trend.length], consumption: null });
      }
      // Return only the last N months
      return trend.slice(-months);
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

    // Explicit runtime log for confirmation
    console.log('[getAnomalies] Total calculated anomalies:', anomalies.length);
    if (anomalies.length > 0) {
      console.log('[getAnomalies] Sample anomalies:', anomalies.slice(0, 3));
    }

    return anomalies;
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
