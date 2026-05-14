// Static data service for FlowSense
// Replaces Base44 SDK calls with local GeoJSON fetching

const AVAILABLE_DATASETS = [
  { id: '2024-01', name: 'January 2024', month_label: '2024-01', status: 'completed', total_accounts: 3, anomalies_found: 0 },
  { id: '2024-02', name: 'February 2024', month_label: '2024-02', status: 'completed', total_accounts: 3, anomalies_found: 0 },
  { id: '2024-03', name: 'March 2024', month_label: '2024-03', status: 'completed', total_accounts: 3, anomalies_found: 2 }
];

const ANOMALIES_DATA = [
  {
    id: 'anom-1',
    account_id: 'ACC001',
    account_name: 'John Smith',
    address: '123 Main St',
    anomaly_type: 'sudden_high',
    severity: 'critical',
    average_consumption: 148.4,
    current_consumption: 450.0,
    deviation_percent: 203.23,
    latitude: 34.0522,
    longitude: -118.2437,
    dataset_id: '2024-03'
  },
  {
    id: 'anom-2',
    account_id: 'ACC002',
    account_name: 'Jane Doe',
    address: '456 Oak Ave',
    anomaly_type: 'zero_consumption',
    severity: 'critical',
    average_consumption: 197.65,
    current_consumption: 0.0,
    deviation_percent: -100.0,
    latitude: 34.0622,
    longitude: -118.2537,
    dataset_id: '2024-03'
  }
];

export const staticDataService = {
  // Fetch all datasets
  async getDatasets() {
    return AVAILABLE_DATASETS;
  },

  // Fetch all anomalies
  async getAnomalies() {
    return ANOMALIES_DATA;
  },

  // Fetch GeoJSON data for a specific month
  async getGeoJSONData(month) {
    try {
      const response = await fetch(`/data/${month}.geojson`);
      if (!response.ok) {
        throw new Error(`Failed to fetch data for ${month}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching GeoJSON for ${month}:`, error);
      return { features: [] };
    }
  },

  // Get all available months
  getAvailableMonths() {
    return ['2024-01', '2024-02', '2024-03'];
  }
};