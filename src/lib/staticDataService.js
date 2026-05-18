import { detectAnomaliesWithHistory, parseGeoJSON } from './anomalyDetection';

const AVAILABLE_DATASETS = [
  { id: '2026-02', name: 'February 2026', month_label: '2026-02', file: '2026-02.geojson' },
  { id: '2026-03', name: 'March 2026', month_label: '2026-03', file: '2026-03.geojson' },
  { id: '2026-04', name: 'April 2026', month_label: '2026-04', file: '2026-04.geojson' },
  { id: '2026-05', name: 'May 2026', month_label: '2026-05', file: '2026-05.geojson' },
];

const datasetStatus = 'completed';
const loadErrors = [];

async function fetchGeoJSONFile(fileName) {
  try {
    const response = await fetch(`/data/${fileName}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${fileName} (status ${response.status})`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching GeoJSON file ${fileName}:`, error);
    const err = { file: fileName, error: String(error?.message || error) };
    loadErrors.push(err);
    return { features: [], __error: err.error };
  }
}

async function loadDatasetAccounts(dataset) {
  const geojson = await fetchGeoJSONFile(dataset.file);
  const accounts = parseGeoJSON(geojson, dataset.month_label);

  return accounts
    .filter(a => a && a.account_id)
    .map(account => ({
      ...account,
      dataset_id: dataset.id,
    }));
}

async function loadAllAccounts() {
  const accountLists = await Promise.all(AVAILABLE_DATASETS.map(loadDatasetAccounts));
  return accountLists.flat();
}

function sortMonths(months) {
  return [...months].sort((a, b) => a.localeCompare(b));
}

export const staticDataService = {
    /**
     * Returns the last N months of consumption for an account as an array:
     * [ { month: '2026-03', consumption: ... }, ... ]
     */
    async getAccountHistory(account_id, months = 3) {
      // Load all accounts from all datasets
      const allAccounts = await loadAllAccounts();
      // Sort datasets by month ascending
      const sortedDatasets = sortMonths(AVAILABLE_DATASETS.map(d => d.id));
      // Build a map of dataset_id -> account record
      const accountMap = {};
      for (const acc of allAccounts) {
        if (acc.account_id === account_id) {
          accountMap[acc.dataset_id] = acc;
        }
      }
      // Use cumused as the monthly consumption directly (not cumulative)
      const trend = sortedDatasets.map(month => {
        const acc = accountMap[month];
        return {
          month,
          consumption: acc && acc.cum_used != null ? Number(acc.cum_used) : null,
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
        total_accounts: allAccounts.filter(account => account.dataset_id === dataset.id).length,
        anomalies_found: anomalies.filter(anomaly => anomaly.dataset_id === dataset.id).length,
        load_error: err ? err.error : null,
      };
    });
  },

  async getAnomalies() {
    const months = sortMonths(this.getAvailableMonths());

    const allAccounts = await loadAllAccounts();
    const historicalAccounts = [];
    const anomalies = [];

    for (const month of months) {
      const currentAccounts = allAccounts.filter(account => account.dataset_id === month);
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
