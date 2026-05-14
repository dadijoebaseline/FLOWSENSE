import { detectAnomaliesWithHistory, parseGeoJSON } from './anomalyDetection';

const AVAILABLE_DATASETS = [
  { id: '2024-01', name: 'January 2024', month_label: '2024-01', file: '2024-01.geojson' },
  { id: '2024-02', name: 'February 2024', month_label: '2024-02', file: '2024-02.geojson' },
  { id: '2024-03', name: 'March 2024', month_label: '2024-03', file: '2024-03.geojson' },
  { id: '2026-03', name: 'March 2026', month_label: '2026-03', file: '2026-03.geojson' },
  { id: '2026-04', name: 'April 2026', month_label: '2026-04', file: '2026-04.geojson' },
  { id: '2026-05', name: 'May 2026', month_label: '2026-05', file: '2026-05.geojson' },
];

const datasetStatus = 'completed';

async function fetchGeoJSONFile(fileName) {
  try {
    const response = await fetch(`/data/${fileName}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${fileName}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching GeoJSON file ${fileName}:`, error);
    return { features: [] };
  }
}

async function loadDatasetAccounts(dataset) {
  const geojson = await fetchGeoJSONFile(dataset.file);
  const accounts = parseGeoJSON(geojson);

  return accounts.map(account => ({
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
  async getDatasets() {
    const allAccounts = await loadAllAccounts();
    const anomalies = await this.getAnomalies();

    return AVAILABLE_DATASETS.map(dataset => ({
      ...dataset,
      status: datasetStatus,
      total_accounts: allAccounts.filter(account => account.dataset_id === dataset.id).length,
      anomalies_found: anomalies.filter(anomaly => anomaly.dataset_id === dataset.id).length,
    }));
  },

  async getAnomalies() {
    const months = sortMonths(this.getAvailableMonths());

    const allAccounts = await loadAllAccounts();
    const historicalAccounts = [];
    const anomalies = [];

    for (const month of months) {
      const currentAccounts = allAccounts.filter(account => account.dataset_id === month);
      const monthAnomalies = detectAnomaliesWithHistory(currentAccounts, historicalAccounts);
      anomalies.push(...monthAnomalies);
      historicalAccounts.push(...currentAccounts);
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
};
