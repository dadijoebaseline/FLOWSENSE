import { detectAnomaliesWithHistory, parseGeoJSON } from './anomalyDetection';

// Will be populated by loadAvailableDatasets()
let AVAILABLE_DATASETS = [];

const datasetStatus = 'completed';

/**
 * Auto-discover available GeoJSON files from public/data folder
 * Generates AVAILABLE_DATASETS dynamically based on what files exist
 */
async function loadAvailableDatasets() {
  if (AVAILABLE_DATASETS.length > 0) {
    return AVAILABLE_DATASETS; // Already loaded
  }

  // Try to load manifest file first (if it exists)
  try {
    const manifestResponse = await fetch('/data/available-datasets.json');
    if (manifestResponse.ok) {
      AVAILABLE_DATASETS = await manifestResponse.json();
      console.log('[staticDataService] Loaded datasets from manifest:', AVAILABLE_DATASETS.map(d => d.id));
      return AVAILABLE_DATASETS;
    }
  } catch (e) {
    // Manifest not found, auto-discover instead
  }

  // Auto-discover: try loading GeoJSON files for common months (Jan-Dec, 2 years)
  const potentialDatasets = [];
  const years = [2025, 2026];
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  for (const year of years) {
    for (let i = 0; i < months.length; i++) {
      const monthId = `${year}-${months[i]}`;
      const fileName = `${monthId}.geojson`;
      
      // Check if file exists by attempting to fetch with HEAD
      try {
        const headResponse = await fetch(`/data/${fileName}`, { method: 'HEAD' });
        if (headResponse.ok) {
          potentialDatasets.push({
            id: monthId,
            name: `${monthNames[i]} ${year}`,
            month_label: monthId,
            file: fileName,
          });
        }
      } catch (e) {
        // File doesn't exist, skip
      }
    }
  }

  if (potentialDatasets.length > 0) {
    AVAILABLE_DATASETS = potentialDatasets;
    console.log('[staticDataService] Auto-discovered datasets:', AVAILABLE_DATASETS.map(d => d.id));
  } else {
    // Fallback to hardcoded if auto-discovery fails
    // Note: System maintains a rolling 4-month window; oldest month is deleted when new month is added
    console.warn('[staticDataService] Auto-discovery failed, using fallback datasets');
    AVAILABLE_DATASETS = [
      { id: '2026-03', name: 'March 2026', month_label: '2026-03', file: '2026-03.geojson' },
      { id: '2026-04', name: 'April 2026', month_label: '2026-04', file: '2026-04.geojson' },
      { id: '2026-05', name: 'May 2026', month_label: '2026-05', file: '2026-05.geojson' },
      { id: '2026-06', name: 'June 2026', month_label: '2026-06', file: '2026-06.geojson' },
    ];
  }

  return AVAILABLE_DATASETS;
}
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
    // Ensure datasets are discovered first
    await loadAvailableDatasets();
    
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

export async function filterLatestMonthAnomalies(anomalies, allAccounts) {
  await loadAvailableDatasets();
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
      const sortedDatasets = sortMonths(await this.getAvailableMonths());

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
    await loadAvailableDatasets();
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
    const months = sortMonths(await this.getAvailableMonths());

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
    await loadAvailableDatasets();
    const dataset = AVAILABLE_DATASETS.find(item => item.id === month);
    if (!dataset) {
      console.warn(`GeoJSON request for unknown month: ${month}`);
      return { features: [] };
    }
    return fetchGeoJSONFile(dataset.file);
  },

  async getAvailableMonths() {
    await loadAvailableDatasets();
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
   * Get consumption aggregated by area for a specific month or all months
   * Returns: { area: { total, avg, count, min, max } } if month specified
   * Returns: { area: { month: { total, avg, count, min, max } } } if month not specified
   * @param {string} [month] - Optional specific month to filter by
   * @returns {Promise<Object>}
   */
  async getConsumptionByAreaPerMonth(month = null) {
    const allAccounts = await loadAllAccounts();
    
    // Filter by month if provided
    const accountsToAnalyze = month
      ? allAccounts.filter(a => a.datasetId === month)
      : allAccounts;

    if (month) {
      // Return data for single month
      const result = {};
      for (const account of accountsToAnalyze) {
        if (!account.area || account.cumUsed === undefined) continue;
        const area = account.area;
        const consumption = Number(account.cumUsed) || 0;
        if (!result[area]) {
          result[area] = { total: 0, count: 0, values: [] };
        }
        result[area].total += consumption;
        result[area].count += 1;
        result[area].values.push(consumption);
      }
      // Calculate avg, min, max
      for (const area in result) {
        const data = result[area];
        data.avg = data.total / data.count;
        data.min = Math.min(...data.values);
        data.max = Math.max(...data.values);
        delete data.values;
      }
      return result;
    } else {
      // Return data grouped by month (original behavior)
      const result = {};
      for (const account of allAccounts) {
        if (!account.area || account.cumUsed === undefined) continue;
        const area = account.area;
        const monthData = account.datasetId;
        const consumption = Number(account.cumUsed) || 0;
        if (!result[area]) result[area] = {};
        if (!result[area][monthData]) {
          result[area][monthData] = { total: 0, count: 0, values: [] };
        }
        result[area][monthData].total += consumption;
        result[area][monthData].count += 1;
        result[area][monthData].values.push(consumption);
      }
      // Calculate avg, min, max
      for (const area in result) {
        for (const monthData in result[area]) {
          const data = result[area][monthData];
          data.avg = data.total / data.count;
          data.min = Math.min(...data.values);
          data.max = Math.max(...data.values);
          delete data.values;
        }
      }
      return result;
    }
  },

  /**
   * Get revenue aggregated by route (bookNo) for a specific month or all months
   * Returns: { route: { total, avg, count, min, max } } if month specified
   * Returns: { route: { month: { total, avg, count, min, max } } } if month not specified
   * @param {string} [month] - Optional specific month to filter by
   * @returns {Promise<Object>}
   */
  async getRevenueByRoutePerMonth(month = null) {
    const allAccounts = await loadAllAccounts();
    
    // Filter by month if provided
    const accountsToAnalyze = month
      ? allAccounts.filter(a => a.datasetId === month)
      : allAccounts;

    if (month) {
      // Return data for single month
      const result = {};
      for (const account of accountsToAnalyze) {
        if (!account.bookNo || account.billAmount === undefined) continue;
        const route = account.bookNo;
        const revenue = Number(account.billAmount) || 0;
        if (!result[route]) {
          result[route] = { total: 0, count: 0, values: [] };
        }
        result[route].total += revenue;
        result[route].count += 1;
        result[route].values.push(revenue);
      }
      // Calculate avg, min, max
      for (const route in result) {
        const data = result[route];
        data.avg = data.total / data.count;
        data.min = Math.min(...data.values);
        data.max = Math.max(...data.values);
        delete data.values;
      }
      return result;
    } else {
      // Return data grouped by month (original behavior)
      const result = {};
      for (const account of allAccounts) {
        if (!account.bookNo || account.billAmount === undefined) continue;
        const route = account.bookNo;
        const monthData = account.datasetId;
        const revenue = Number(account.billAmount) || 0;
        if (!result[route]) result[route] = {};
        if (!result[route][monthData]) {
          result[route][monthData] = { total: 0, count: 0, values: [] };
        }
        result[route][monthData].total += revenue;
        result[route][monthData].count += 1;
        result[route][monthData].values.push(revenue);
      }
      // Calculate avg, min, max
      for (const route in result) {
        for (const monthData in result[route]) {
          const data = result[route][monthData];
          data.avg = data.total / data.count;
          data.min = Math.min(...data.values);
          data.max = Math.max(...data.values);
          delete data.values;
        }
      }
      return result;
    }
  },

  /**
   * Get account counts aggregated by status for a specific month or all months
   * Returns: { status: { count } } if month specified
   * Returns: { status: { month: { count } } } if month not specified
   * @param {string} [month] - Optional specific month to filter by
   * @returns {Promise<Object>}
   */
  async getAccountsByStatusPerMonth(month = null) {
    const allAccounts = await loadAllAccounts();
    
    // Filter by month if provided
    const accountsToAnalyze = month
      ? allAccounts.filter(a => a.datasetId === month)
      : allAccounts;

    if (month) {
      // Return data for single month
      const result = {};
      for (const account of accountsToAnalyze) {
        if (!account.status) continue;
        const status = account.status;
        if (!result[status]) result[status] = { count: 0 };
        result[status].count += 1;
      }
      return result;
    } else {
      // Return data grouped by month (original behavior)
      const result = {};
      for (const account of allAccounts) {
        if (!account.status) continue;
        const status = account.status;
        const monthData = account.datasetId;
        if (!result[status]) result[status] = {};
        if (!result[status][monthData]) {
          result[status][monthData] = { count: 0 };
        }
        result[status][monthData].count += 1;
      }
      return result;
    }
  },

  /**
   * Get metrics aggregated by classification (rateCode) for a specific month or all months
   * Returns: { rateCode: { consumption: { total, avg }, revenue: { total, avg }, count } } if month specified
   * Returns: { rateCode: { month: { consumption: { total, avg }, revenue: { total, avg }, count } } } if month not specified
   * @param {string} [month] - Optional specific month to filter by
   * @returns {Promise<Object>}
   */
  async getMetricsByClassificationPerMonth(month = null) {
    const allAccounts = await loadAllAccounts();
    
    // Filter by month if provided
    const accountsToAnalyze = month
      ? allAccounts.filter(a => a.datasetId === month)
      : allAccounts;

    if (month) {
      // Return data for single month
      const result = {};
      for (const account of accountsToAnalyze) {
        if (!account.rateCode) continue;
        const rateCode = account.rateCode;
        const consumption = Number(account.cumUsed) || 0;
        const revenue = Number(account.billAmount) || 0;
        if (!result[rateCode]) {
          result[rateCode] = {
            consumption: { total: 0, values: [] },
            revenue: { total: 0, values: [] },
            count: 0,
          };
        }
        result[rateCode].consumption.total += consumption;
        result[rateCode].consumption.values.push(consumption);
        result[rateCode].revenue.total += revenue;
        result[rateCode].revenue.values.push(revenue);
        result[rateCode].count += 1;
      }
      // Calculate averages
      for (const rateCode in result) {
        const data = result[rateCode];
        data.consumption.avg = data.consumption.total / data.count;
        data.revenue.avg = data.revenue.total / data.count;
        delete data.consumption.values;
        delete data.revenue.values;
      }
      return result;
    } else {
      // Return data grouped by month (original behavior)
      const result = {};
      for (const account of allAccounts) {
        if (!account.rateCode) continue;
        const rateCode = account.rateCode;
        const monthData = account.datasetId;
        const consumption = Number(account.cumUsed) || 0;
        const revenue = Number(account.billAmount) || 0;
        if (!result[rateCode]) result[rateCode] = {};
        if (!result[rateCode][monthData]) {
          result[rateCode][monthData] = {
            consumption: { total: 0, values: [] },
            revenue: { total: 0, values: [] },
            count: 0,
          };
        }
        result[rateCode][monthData].consumption.total += consumption;
        result[rateCode][monthData].consumption.values.push(consumption);
        result[rateCode][monthData].revenue.total += revenue;
        result[rateCode][monthData].revenue.values.push(revenue);
        result[rateCode][monthData].count += 1;
      }
      // Calculate averages
      for (const rateCode in result) {
        for (const monthData in result[rateCode]) {
          const data = result[rateCode][monthData];
          data.consumption.avg = data.consumption.total / data.count;
          data.revenue.avg = data.revenue.total / data.count;
          delete data.consumption.values;
          delete data.revenue.values;
        }
      }
      return result;
    }
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
   * Get KPI metrics for all data or a specific month
   * @param {string} [month] - Optional month filter (e.g., '2026-05'). If omitted, returns all-months total
   * @returns {Promise<Object>}
   */
  async getKPIMetrics(month = null) {
    const allAccounts = await loadAllAccounts();
    
    // Filter by month if provided
    const accountsToAnalyze = month 
      ? allAccounts.filter(a => a.datasetId === month)
      : allAccounts;

    let totalConsumption = 0;
    let totalRevenue = 0;
    let totalAccounts = accountsToAnalyze.length;
    let activeCount = 0;
    let disconnectedCount = 0;

    for (const account of accountsToAnalyze) {
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
      month: month || 'all',
    };
  },

  /**
   * Get all water accounts across all datasets
   * @returns {Promise<Array>} Array of all account objects
   */
  async getAllAccounts() {
    return loadAllAccounts();
  },

  /**
   * Calculate statistical insights from filtered accounts
   * Generates rank-based, trend, anomaly, and comparative observations
   * @param {Array} accounts - Filtered account list
   * @param {Object} filters - Active filters for context
   * @param {string} selectedMonth - Currently selected month
   * @returns {Promise<Array>} Array of insight objects
   */
  async generateInsights(accounts, filters = {}, selectedMonth = '2026-05') {
    if (!accounts || accounts.length === 0) {
      return [];
    }

    const insights = [];

    // 1. RANK-BASED INSIGHTS
    const rankInsights = await this._generateRankInsights(accounts, selectedMonth);
    insights.push(...rankInsights);

    // 2. TREND INSIGHTS (if multiple months available)
    const allAccounts = await loadAllAccounts();
    const trendInsights = await this._generateTrendInsights(accounts, selectedMonth, allAccounts);
    insights.push(...trendInsights);

    // 3. ANOMALY INSIGHTS
    const anomalyInsights = await this._generateAnomalyInsights(accounts);
    insights.push(...anomalyInsights);

    // 4. COMPARATIVE INSIGHTS
    const comparativeInsights = await this._generateComparativeInsights(accounts);
    insights.push(...comparativeInsights);

    // Return top 3 insights by relevance
    return insights
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, 3);
  },

  /**
   * Generate rank-based insights (top performers)
   * @private
   */
  async _generateRankInsights(accounts, selectedMonth) {
    const insights = [];
    if (accounts.length === 0) return insights;

    // Top consumer by area
    const byArea = {};
    const avgConsumption = accounts.reduce((sum, a) => sum + (Number(a.cumUsed) || 0), 0) / accounts.length;
    
    for (const account of accounts) {
      if (!account.area) continue;
      if (!byArea[account.area]) {
        byArea[account.area] = { total: 0, count: 0, name: account.area };
      }
      byArea[account.area].total += Number(account.cumUsed) || 0;
      byArea[account.area].count += 1;
    }

    const areaRanks = Object.values(byArea)
      .map(a => ({ ...a, avg: a.total / a.count }))
      .sort((a, b) => b.total - a.total);

    if (areaRanks.length > 0) {
      const top = areaRanks[0];
      let varianceStr = '0';
      if (avgConsumption > 0 && !isNaN(avgConsumption)) {
        const variance = ((top.total / avgConsumption - 1) * 100);
        if (!isNaN(variance) && isFinite(variance)) {
          varianceStr = variance.toFixed(0);
        }
      }
      insights.push({
        type: 'rank',
        icon: '📊',
        title: `${top.name} leads consumption`,
        description: `Area ${top.name} ranks #1 with ${Math.round(top.total).toLocaleString()} cu.m. (${varianceStr > 0 ? '↑' : ''}${varianceStr}% vs avg)`,
        confidence: 0.95,
        color: 'bg-blue-50',
      });
    }

    // Top revenue generator
    const byRoute = {};
    const avgRevenue = accounts.reduce((sum, a) => sum + (Number(a.billAmount) || 0), 0) / accounts.length;
    
    for (const account of accounts) {
      if (!account.bookNo) continue;
      if (!byRoute[account.bookNo]) {
        byRoute[account.bookNo] = { total: 0, count: 0, name: account.bookNo };
      }
      byRoute[account.bookNo].total += Number(account.billAmount) || 0;
      byRoute[account.bookNo].count += 1;
    }

    const routeRanks = Object.values(byRoute)
      .map(r => ({ ...r, avg: r.total / r.count }))
      .sort((a, b) => b.total - a.total);

    if (routeRanks.length > 0) {
      const top = routeRanks[0];
      let varianceStr = '0';
      if (avgRevenue > 0 && !isNaN(avgRevenue)) {
        const variance = ((top.total / avgRevenue - 1) * 100);
        if (!isNaN(variance) && isFinite(variance)) {
          varianceStr = variance.toFixed(0);
        }
      }
      insights.push({
        type: 'rank',
        icon: '💰',
        title: `Route ${top.name} revenue leader`,
        description: `Route ${top.name} generates ₱${Math.round(top.total).toLocaleString()} (${varianceStr > 0 ? '↑' : ''}${varianceStr}% vs avg)`,
        confidence: 0.9,
        color: 'bg-green-50',
      });
    }

    return insights;
  },

  /**
   * Generate trend insights (month-over-month comparisons)
   * @private
   */
  async _generateTrendInsights(accounts, selectedMonth, allAccounts) {
    const insights = [];
    const months = (await this.getAvailableMonths()).sort();
    
    if (months.length < 2) return insights;

    // Get previous month
    const selectedIdx = months.indexOf(selectedMonth);
    if (selectedIdx <= 0) return insights;

    const prevMonth = months[selectedIdx - 1];

    // Calculate current and previous consumption
    const currentConsumption = accounts.reduce((sum, a) => sum + (Number(a.cumUsed) || 0), 0);
    const prevAccounts = allAccounts.filter(a => a.datasetId === prevMonth);
    const prevConsumption = prevAccounts.reduce((sum, a) => sum + (Number(a.cumUsed) || 0), 0);

    if (prevConsumption > 0) {
      const change = ((currentConsumption / prevConsumption - 1) * 100).toFixed(1);
      const changeNum = parseFloat(change);
      
      if (Math.abs(changeNum) > 5) {
        insights.push({
          type: 'trend',
          icon: changeNum > 0 ? '📈' : '📉',
          title: `Consumption ${changeNum > 0 ? 'increased' : 'decreased'} MoM`,
          description: `Total consumption ${changeNum > 0 ? 'increased' : 'decreased'} by ${Math.abs(change)}% (${Math.round(currentConsumption)} vs ${Math.round(prevConsumption)} cu.m.)`,
          confidence: 0.85,
          color: changeNum > 0 ? 'bg-amber-50' : 'bg-blue-50',
        });
      }
    }

    return insights;
  },

  /**
   * Generate anomaly insights (statistical outliers)
   * @private
   */
  async _generateAnomalyInsights(accounts) {
    const insights = [];
    if (accounts.length < 3) return insights;

    // Calculate consumption statistics
    const consumptions = accounts
      .map(a => Number(a.cumUsed) || 0)
      .sort((a, b) => a - b);

    const mean = consumptions.reduce((a, b) => a + b, 0) / consumptions.length;
    const variance = consumptions.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / consumptions.length;
    const stdDev = Math.sqrt(variance);

    // Find outliers (>1.5 sigma)
    const highOutliers = accounts.filter(a => {
      const consumption = Number(a.cumUsed) || 0;
      return consumption > mean + 1.5 * stdDev && consumption !== mean;
    });

    const lowOutliers = accounts.filter(a => {
      const consumption = Number(a.cumUsed) || 0;
      return consumption < mean - 1.5 * stdDev && consumption > 0;
    });

    if (highOutliers.length > 0) {
      insights.push({
        type: 'anomaly',
        icon: '⚠️',
        title: `${highOutliers.length} high consumption outliers`,
        description: `${highOutliers.length} account(s) consuming significantly above average (>${(mean + 1.5 * stdDev).toFixed(0)} cu.m.)`,
        confidence: 0.8,
        color: 'bg-red-50',
      });
    }

    return insights;
  },

  /**
   * Generate comparative insights (category comparisons)
   * @private
   */
  async _generateComparativeInsights(accounts) {
    const insights = [];
    if (accounts.length < 5) return insights;

    // Compare ACTIVE vs DISCONNECTED consumption
    const byStatus = {};
    for (const account of accounts) {
      const status = account.status || 'UNKNOWN';
      if (!byStatus[status]) {
        byStatus[status] = { consumption: 0, count: 0, revenue: 0 };
      }
      byStatus[status].consumption += Number(account.cumUsed) || 0;
      byStatus[status].count += 1;
      byStatus[status].revenue += Number(account.billAmount) || 0;
    }

    if (byStatus.ACTIVE && byStatus.DISCONNECTED) {
      const activeAvg = byStatus.ACTIVE.consumption / byStatus.ACTIVE.count;
      const disconnectedAvg = byStatus.DISCONNECTED.consumption / byStatus.DISCONNECTED.count;
      let ratioStr = '0';
      if (disconnectedAvg > 0 && !isNaN(disconnectedAvg)) {
        const ratio = activeAvg / disconnectedAvg;
        if (!isNaN(ratio) && isFinite(ratio)) {
          ratioStr = ratio.toFixed(2);
        }
      }

      insights.push({
        type: 'comparative',
        icon: '📋',
        title: `Active accounts use ${ratioStr}x more water`,
        description: `ACTIVE accounts average ${activeAvg.toFixed(0)} cu.m., DISCONNECTED average ${disconnectedAvg.toFixed(0)} cu.m.`,
        confidence: 0.75,
        color: 'bg-indigo-50',
      });
    }

    return insights;
  },

  /**
   * Get per-month account metrics (NOT summed across months)
   * Follows Analytics checklist: count accounts per month only
   * @returns {Promise<Array>} Array of monthly metrics
   */
  async getMonthlyAccountMetrics() {
    const months = (await this.getAvailableMonths()).sort();
    await loadAvailableDatasets();
    const monthlyMetrics = [];
    const accountIds = {};

    for (const month of months) {
      const dataset = AVAILABLE_DATASETS.find(item => item.id === month);
      if (!dataset) continue;
      
      // Use loadDatasetAccounts to get properly parsed accounts with normalized field names
      const accounts = await loadDatasetAccounts(dataset);

      // Count unique accounts in THIS month (not cumulative)
      const uniqueInMonth = new Set(accounts.map(a => a.accountId).filter(id => id));
      
      // Count new accounts (not seen in previous months)
      let newAccounts = 0;
      for (const accountId of uniqueInMonth) {
        if (!accountIds[accountId]) {
          newAccounts += 1;
          accountIds[accountId] = true;
        }
      }

      const totalConsumption = accounts.reduce((sum, a) => sum + (Number(a.cumUsed) || 0), 0);
      const totalRevenue = accounts.reduce((sum, a) => sum + (Number(a.billAmount) || 0), 0);
      const activeCount = accounts.filter(a => a.status === 'ACTIVE').length;
      const disconnectedCount = accounts.filter(a => a.status === 'DISCONNECTED').length;

      monthlyMetrics.push({
        month,
        totalAccounts: uniqueInMonth.size,
        newAccounts,
        recurringAccounts: uniqueInMonth.size - newAccounts,
        totalConsumption: Math.round(totalConsumption * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        activeCount,
        disconnectedCount,
        avgConsumptionPerAccount: uniqueInMonth.size > 0 ? Math.round((totalConsumption / uniqueInMonth.size) * 100) / 100 : 0,
        avgRevenuePerAccount: uniqueInMonth.size > 0 ? Math.round((totalRevenue / uniqueInMonth.size) * 100) / 100 : 0,
      });
    }

    return monthlyMetrics;
  },

  /**
   * Get single-month metrics (for selected month only)
   * @param {string} month - Month identifier (e.g., '2026-05')
   * @returns {Promise<Object>} Metrics for that month
   */
  async getMonthMetrics(month) {
    const data = await this.getGeoJSONData(month);
    const accounts = data.features
      ? data.features.map(f => ({ ...f.properties, datasetId: month }))
      : [];

    const totalConsumption = accounts.reduce((sum, a) => sum + (Number(a.cumUsed) || 0), 0);
    const totalRevenue = accounts.reduce((sum, a) => sum + (Number(a.billAmount) || 0), 0);
    const totalAccounts = accounts.length;
    const activeCount = accounts.filter(a => a.status === 'ACTIVE').length;
    const disconnectedCount = accounts.filter(a => a.status === 'DISCONNECTED').length;

    return {
      month,
      totalAccounts,
      totalConsumption: Math.round(totalConsumption * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      activeCount,
      disconnectedCount,
      avgConsumptionPerAccount: totalAccounts > 0 ? Math.round((totalConsumption / totalAccounts) * 100) / 100 : 0,
      avgRevenuePerAccount: totalAccounts > 0 ? Math.round((totalRevenue / totalAccounts) * 100) / 100 : 0,
    };
  },

  /**
   * Comparative Analysis: Dataset vs Anomalies - FILTERED BY MONTH
   * Calculates anomaly impact metrics for the selected month
   * Affected by filter selection (month selection)
   * Returns metrics comparing normal accounts to anomalous accounts
   * Per Master Prompt requirement: "% of accounts affected, consumption %, revenue %"
   * @param {string} month - The selected month (datasetId) to filter by
   * @returns {Promise<Object>} Comparative metrics for the selected month
   */
  async getAnomalyComparativeAnalysis(month) {
    // Load accounts for the selected month only
    await loadAvailableDatasets();
    let monthAccounts = [];
    if (month) {
      const dataset = AVAILABLE_DATASETS.find(d => d.id === month);
      if (dataset) {
        monthAccounts = await loadDatasetAccounts(dataset);
      }
    }

    const anomalies = await this.getAnomalies();

    // Build set of anomalous account IDs (accounts with anomalies in the selected month)
    const anomalousIds = new Set(anomalies.map(a => a.accountNumber || a.accountId));

    let totalConsumption = 0;
    let anomalousConsumption = 0;
    let totalRevenue = 0;
    let anomalousRevenue = 0;
    let totalAccounts = 0;
    let anomalousAccounts = 0;

    // Aggregate metrics for the selected month only
    for (const account of monthAccounts) {
      if (!account.accountId) continue;

      const consumption = Number(account.cumUsed) || 0;
      const revenue = Number(account.billAmount) || 0;

      totalConsumption += consumption;
      totalRevenue += revenue;
      totalAccounts += 1;

      if (anomalousIds.has(account.accountId)) {
        anomalousConsumption += consumption;
        anomalousRevenue += revenue;
        anomalousAccounts += 1;
      }
    }

    const normalConsumption = totalConsumption - anomalousConsumption;
    const normalRevenue = totalRevenue - anomalousRevenue;
    const normalAccounts = totalAccounts - anomalousAccounts;

    return {
      // Account Impact (for selected month)
      totalAccounts,
      anomalousAccounts,
      normalAccounts,
      anomalyAccountPercentage: totalAccounts > 0 ? Math.round((anomalousAccounts / totalAccounts) * 10000) / 100 : 0,
      normalAccountPercentage: totalAccounts > 0 ? Math.round((normalAccounts / totalAccounts) * 10000) / 100 : 0,

      // Consumption Impact (for selected month)
      totalConsumption: Math.round(totalConsumption * 100) / 100,
      anomalousConsumption: Math.round(anomalousConsumption * 100) / 100,
      normalConsumption: Math.round(normalConsumption * 100) / 100,
      anomalyConsumptionPercentage: totalConsumption > 0 ? Math.round((anomalousConsumption / totalConsumption) * 10000) / 100 : 0,
      normalConsumptionPercentage: totalConsumption > 0 ? Math.round((normalConsumption / totalConsumption) * 10000) / 100 : 0,

      // Revenue Impact (for selected month)
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      anomalousRevenue: Math.round(anomalousRevenue * 100) / 100,
      normalRevenue: Math.round(normalRevenue * 100) / 100,
      anomalyRevenuePercentage: totalRevenue > 0 ? Math.round((anomalousRevenue / totalRevenue) * 10000) / 100 : 0,
      normalRevenuePercentage: totalRevenue > 0 ? Math.round((normalRevenue / totalRevenue) * 10000) / 100 : 0,

      // Status Breakdown (Anomaly prevalence by status - for selected month)
      anomalyRateByStatus: await this._getAnomalyRateByStatus(monthAccounts, anomalousIds),

      // Classification Breakdown (Anomaly prevalence by classification - for selected month)
      anomalyRateByClassification: await this._getAnomalyRateByClassification(monthAccounts, anomalousIds),
    };
  },

  /**
   * Calculate anomaly prevalence by status (ACTIVE, DISCONNECTED, etc)
   * @private
   */
  async _getAnomalyRateByStatus(allAccounts, anomalousIds) {
    const statuses = {};

    for (const account of allAccounts) {
      if (!account.accountId || !account.status) continue;

      const status = account.status;
      if (!statuses[status]) {
        statuses[status] = { total: 0, anomalous: 0 };
      }

      statuses[status].total += 1;
      if (anomalousIds.has(account.accountId)) {
        statuses[status].anomalous += 1;
      }
    }

    const result = {};
    for (const status in statuses) {
      const data = statuses[status];
      result[status] = {
        total: data.total,
        anomalous: data.anomalous,
        normal: data.total - data.anomalous,
        anomalyRate: data.total > 0 ? Math.round((data.anomalous / data.total) * 10000) / 100 : 0,
      };
    }

    return result;
  },

  /**
   * Calculate anomaly prevalence by classification (rateCode)
   * @private
   */
  async _getAnomalyRateByClassification(allAccounts, anomalousIds) {
    const classifications = {};

    for (const account of allAccounts) {
      if (!account.accountId || !account.rateCode) continue;

      const rateCode = account.rateCode;
      if (!classifications[rateCode]) {
        classifications[rateCode] = { total: 0, anomalous: 0 };
      }

      classifications[rateCode].total += 1;
      if (anomalousIds.has(account.accountId)) {
        classifications[rateCode].anomalous += 1;
      }
    }

    const result = {};
    for (const rateCode in classifications) {
      const data = classifications[rateCode];
      result[rateCode] = {
        total: data.total,
        anomalous: data.anomalous,
        normal: data.total - data.anomalous,
        anomalyRate: data.total > 0 ? Math.round((data.anomalous / data.total) * 10000) / 100 : 0,
      };
    }

    return result;
  },

  /**
   * Get comprehensive data distribution analysis
   * Includes status distribution, classification distribution, consumption ranges
   * @param {string} [month] - Optional specific month to filter by
   * @returns {Promise<Object>} Distribution metrics
   */
  async getDataDistribution(month = null) {
    const allAccounts = await loadAllAccounts();
    
    // Filter by month if provided
    const accountsToAnalyze = month
      ? allAccounts.filter(a => a.datasetId === month)
      : allAccounts;

    // Status distribution
    const statusCounts = {};
    const statusConsumption = {};
    const statusRevenue = {};

    // Classification distribution
    const classificationCounts = {};
    const classificationConsumption = {};
    const classificationRevenue = {};

    // Consumption distribution (for quartiles)
    const consumptionValues = [];
    const revenueValues = [];

    for (const account of accountsToAnalyze) {
      if (!account.accountId) continue;

      const consumption = Number(account.cumUsed) || 0;
      const revenue = Number(account.billAmount) || 0;

      // Track for quartiles
      consumptionValues.push(consumption);
      revenueValues.push(revenue);

      // Status tracking
      if (account.status) {
        statusCounts[account.status] = (statusCounts[account.status] || 0) + 1;
        statusConsumption[account.status] = (statusConsumption[account.status] || 0) + consumption;
        statusRevenue[account.status] = (statusRevenue[account.status] || 0) + revenue;
      }

      // Classification tracking
      if (account.rateCode) {
        classificationCounts[account.rateCode] = (classificationCounts[account.rateCode] || 0) + 1;
        classificationConsumption[account.rateCode] = (classificationConsumption[account.rateCode] || 0) + consumption;
        classificationRevenue[account.rateCode] = (classificationRevenue[account.rateCode] || 0) + revenue;
      }
    }

    // Calculate quartiles
    const sortedConsumption = consumptionValues.sort((a, b) => a - b);
    const sortedRevenue = revenueValues.sort((a, b) => a - b);

    const getQuartile = (sorted, q) => {
      const idx = Math.floor(sorted.length * q);
      return sorted[idx] || 0;
    };

    return {
      // Status Distribution
      statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        percentage: (count / accountsToAnalyze.length) * 100,
        totalConsumption: Math.round(statusConsumption[status] * 100) / 100,
        totalRevenue: Math.round(statusRevenue[status] * 100) / 100,
        avgConsumption: count > 0 ? Math.round((statusConsumption[status] / count) * 100) / 100 : 0,
        avgRevenue: count > 0 ? Math.round((statusRevenue[status] / count) * 100) / 100 : 0,
      })),

      // Classification Distribution
      classificationDistribution: Object.entries(classificationCounts).map(([rateCode, count]) => ({
        rateCode,
        count,
        percentage: (count / accountsToAnalyze.length) * 100,
        totalConsumption: Math.round(classificationConsumption[rateCode] * 100) / 100,
        totalRevenue: Math.round(classificationRevenue[rateCode] * 100) / 100,
        avgConsumption: count > 0 ? Math.round((classificationConsumption[rateCode] / count) * 100) / 100 : 0,
        avgRevenue: count > 0 ? Math.round((classificationRevenue[rateCode] / count) * 100) / 100 : 0,
      })),

      // Consumption Distribution (Quartiles)
      consumptionDistribution: {
        min: sortedConsumption[0] || 0,
        q1: getQuartile(sortedConsumption, 0.25),
        median: getQuartile(sortedConsumption, 0.5),
        q3: getQuartile(sortedConsumption, 0.75),
        max: sortedConsumption[sortedConsumption.length - 1] || 0,
        mean: sortedConsumption.reduce((a, b) => a + b, 0) / sortedConsumption.length,
      },

      // Revenue Distribution (Quartiles)
      revenueDistribution: {
        min: sortedRevenue[0] || 0,
        q1: getQuartile(sortedRevenue, 0.25),
        median: getQuartile(sortedRevenue, 0.5),
        q3: getQuartile(sortedRevenue, 0.75),
        max: sortedRevenue[sortedRevenue.length - 1] || 0,
        mean: sortedRevenue.reduce((a, b) => a + b, 0) / sortedRevenue.length,
      },

      totalAccounts: accountsToAnalyze.length,
    };
  },
};
