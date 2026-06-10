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

export function filterLatestMonthAnomalies(anomalies, allAccounts) {
  const months = sortMonths(AVAILABLE_DATASETS.map(d => d.id));
  const monthIndex = {};
  months.forEach((month, i) => { monthIndex[month] = i; });

  const latestByAccount = {};
  for (const acc of allAccounts) {
    if (!acc.accountId) continue;
    const idx = monthIndex[acc.datasetId] ?? -1;
    if (idx === -1) continue;
    if (!latestByAccount[acc.accountId] || idx > latestByAccount[acc.accountId].index) {
      latestByAccount[acc.accountId] = { acc, index: idx };
    }
  }

  return anomalies.filter(a => {
    const accountKey = a.accountNumber || a.accountId;
    const latest = latestByAccount[accountKey];
    const anomalyIdx = monthIndex[a.datasetId] ?? -1;
    if (latest && anomalyIdx !== latest.index) {
      return false;
    }
    return true;
  });
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

    return filterLatestMonthAnomalies(anomalies, allAccounts);
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

  /**
   * Extract year from month label (e.g., '2026-02' -> 2026)
   * @param {string} month - Month in format 'YYYY-MM'
   * @returns {number} Year as number
   */
  _getYear(month) {
    return parseInt(month.split('-')[0], 10);
  },

  /**
   * Extract month number from month label (e.g., '2026-02' -> 2)
   * @param {string} month - Month in format 'YYYY-MM'
   * @returns {number} Month as number (1-12)
   */
  _getMonthNumber(month) {
    return parseInt(month.split('-')[1], 10);
  },

  /**
   * Get consumption aggregated by area per month
   * Returns: { area: { month: { total, avg, count, min, max } } }
   * @returns {Promise<Object>}
   */
  async getConsumptionByAreaPerMonth() {
    const allAccounts = await loadAllAccounts();
    const result = {};

    for (const account of allAccounts) {
      if (!account.area || account.cumUsed === undefined) continue;

      const area = account.area;
      const month = account.datasetId;
      const consumption = Number(account.cumUsed) || 0;

      if (!result[area]) result[area] = {};
      if (!result[area][month]) {
        result[area][month] = {
          total: 0,
          count: 0,
          values: [],
        };
      }

      result[area][month].total += consumption;
      result[area][month].count += 1;
      result[area][month].values.push(consumption);
    }

    // Calculate avg, min, max
    for (const area in result) {
      for (const month in result[area]) {
        const data = result[area][month];
        data.avg = data.total / data.count;
        data.min = Math.min(...data.values);
        data.max = Math.max(...data.values);
        delete data.values; // Remove raw values
      }
    }

    return result;
  },

  /**
   * Get revenue aggregated by route (bookNo) per month
   * Returns: { route: { month: { total, avg, count, min, max } } }
   * @returns {Promise<Object>}
   */
  async getRevenueByRoutePerMonth() {
    const allAccounts = await loadAllAccounts();
    const result = {};

    for (const account of allAccounts) {
      if (!account.bookNo || account.billAmount === undefined) continue;

      const route = account.bookNo;
      const month = account.datasetId;
      const revenue = Number(account.billAmount) || 0;

      if (!result[route]) result[route] = {};
      if (!result[route][month]) {
        result[route][month] = {
          total: 0,
          count: 0,
          values: [],
        };
      }

      result[route][month].total += revenue;
      result[route][month].count += 1;
      result[route][month].values.push(revenue);
    }

    // Calculate avg, min, max
    for (const route in result) {
      for (const month in result[route]) {
        const data = result[route][month];
        data.avg = data.total / data.count;
        data.min = Math.min(...data.values);
        data.max = Math.max(...data.values);
        delete data.values;
      }
    }

    return result;
  },

  /**
   * Get account counts aggregated by status per month
   * Returns: { status: { month: { count } } }
   * @returns {Promise<Object>}
   */
  async getAccountsByStatusPerMonth() {
    const allAccounts = await loadAllAccounts();
    const result = {};

    for (const account of allAccounts) {
      if (!account.status) continue;

      const status = account.status;
      const month = account.datasetId;

      if (!result[status]) result[status] = {};
      if (!result[status][month]) {
        result[status][month] = { count: 0 };
      }

      result[status][month].count += 1;
    }

    return result;
  },

  /**
   * Get metrics aggregated by classification (rateCode) per month
   * Returns: { rateCode: { month: { consumption: { total, avg }, revenue: { total, avg }, count } } }
   * @returns {Promise<Object>}
   */
  async getMetricsByClassificationPerMonth() {
    const allAccounts = await loadAllAccounts();
    const result = {};

    for (const account of allAccounts) {
      if (!account.rateCode) continue;

      const rateCode = account.rateCode;
      const month = account.datasetId;
      const consumption = Number(account.cumUsed) || 0;
      const revenue = Number(account.billAmount) || 0;

      if (!result[rateCode]) result[rateCode] = {};
      if (!result[rateCode][month]) {
        result[rateCode][month] = {
          consumption: { total: 0, values: [] },
          revenue: { total: 0, values: [] },
          count: 0,
        };
      }

      result[rateCode][month].consumption.total += consumption;
      result[rateCode][month].consumption.values.push(consumption);
      result[rateCode][month].revenue.total += revenue;
      result[rateCode][month].revenue.values.push(revenue);
      result[rateCode][month].count += 1;
    }

    // Calculate averages
    for (const rateCode in result) {
      for (const month in result[rateCode]) {
        const data = result[rateCode][month];
        data.consumption.avg = data.consumption.total / data.count;
        data.revenue.avg = data.revenue.total / data.count;
        delete data.consumption.values;
        delete data.revenue.values;
      }
    }

    return result;
  },

  /**
   * Get consumption trend by year and month
   * Returns: { year: { month: { total, avg, count } } }
   * @returns {Promise<Object>}
   */
  async getConsumptionTrendByYear() {
    const allAccounts = await loadAllAccounts();
    const result = {};

    for (const account of allAccounts) {
      if (account.cumUsed === undefined) continue;

      const month = account.datasetId;
      const year = this._getYear(month);
      const monthNum = this._getMonthNumber(month);
      const consumption = Number(account.cumUsed) || 0;

      const yearKey = `${year}`;
      const monthKey = `${monthNum.toString().padStart(2, '0')}`;

      if (!result[yearKey]) result[yearKey] = {};
      if (!result[yearKey][monthKey]) {
        result[yearKey][monthKey] = {
          total: 0,
          count: 0,
          values: [],
        };
      }

      result[yearKey][monthKey].total += consumption;
      result[yearKey][monthKey].count += 1;
      result[yearKey][monthKey].values.push(consumption);
    }

    // Calculate avg
    for (const year in result) {
      for (const month in result[year]) {
        const data = result[year][month];
        data.avg = data.total / data.count;
        data.min = Math.min(...data.values);
        data.max = Math.max(...data.values);
        delete data.values;
      }
    }

    return result;
  },

  /**
   * Get all unique values for filtering
   * @returns {Promise<Object>} Object with unique areas, routes, statuses, rateCodes
   */
  async getFilterOptions() {
    const allAccounts = await loadAllAccounts();
    const areas = new Set();
    const routes = new Set();
    const statuses = new Set();
    const rateCodes = new Set();

    for (const account of allAccounts) {
      if (account.area) areas.add(account.area);
      if (account.bookNo) routes.add(account.bookNo);
      if (account.status) statuses.add(account.status);
      if (account.rateCode) rateCodes.add(account.rateCode);
    }

    return {
      areas: Array.from(areas).sort(),
      routes: Array.from(routes).sort(),
      statuses: Array.from(statuses).sort(),
      rateCodes: Array.from(rateCodes).sort(),
    };
  },

  /**
   * Get KPI metrics for all data
   * @returns {Promise<Object>}
   */
  async getKPIMetrics() {
    const allAccounts = await loadAllAccounts();

    let totalConsumption = 0;
    let totalRevenue = 0;
    let totalAccounts = allAccounts.length;
    let activeCount = 0;
    let disconnectedCount = 0;

    for (const account of allAccounts) {
      totalConsumption += Number(account.cumUsed) || 0;
      totalRevenue += Number(account.billAmount) || 0;
      if (account.status === 'ACTIVE') activeCount += 1;
      if (account.status === 'DISCONNECTED') disconnectedCount += 1;
    }

    return {
      totalConsumption: Math.round(totalConsumption * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalAccounts,
      activeCount,
      disconnectedCount,
      avgConsumptionPerAccount: totalAccounts > 0 ? Math.round((totalConsumption / totalAccounts) * 100) / 100 : 0,
      avgRevenuePerAccount: totalAccounts > 0 ? Math.round((totalRevenue / totalAccounts) * 100) / 100 : 0,
    };
  },
};
