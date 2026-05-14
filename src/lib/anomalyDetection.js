/**
 * Anomaly detection logic for water consumption data.
 * 
 * Rules:
 * - Sudden High: current >= avg_prev * 1.30
 * - Sudden Down: current <= avg_prev * 0.70
 * - Zero Consumption: current === 0 and avg_prev > 0
 */

export function detectAnomalies(accounts) {
  const anomalies = [];

  for (const account of accounts) {
    const m1 = account.month_1_consumption || 0;
    const m2 = account.month_2_consumption || 0;
    const m3 = account.month_3_consumption || 0;

    // Average of first two months, current is month 3
    const prevMonths = [m1, m2].filter(v => v > 0);
    const avgPrev = prevMonths.length > 0 ? prevMonths.reduce((a, b) => a + b, 0) / prevMonths.length : 0;
    const current = m3;

    // Zero Consumption
    if (current === 0 && avgPrev > 0) {
      anomalies.push({
        account_id: account.account_id,
        account_name: account.account_name || '',
        address: account.address || '',
        anomaly_type: 'zero_consumption',
        severity: 'critical',
        average_consumption: Math.round(avgPrev * 100) / 100,
        current_consumption: 0,
        deviation_percent: -100,
        latitude: account.latitude,
        longitude: account.longitude,
        dataset_id: account.dataset_id,
      });
      continue;
    }

    if (avgPrev === 0) continue;

    const deviationPercent = ((current - avgPrev) / avgPrev) * 100;

    // Sudden High
    if (current >= avgPrev * 1.30) {
      anomalies.push({
        account_id: account.account_id,
        account_name: account.account_name || '',
        address: account.address || '',
        anomaly_type: 'sudden_high',
        severity: deviationPercent >= 100 ? 'critical' : deviationPercent >= 50 ? 'high' : 'medium',
        average_consumption: Math.round(avgPrev * 100) / 100,
        current_consumption: current,
        deviation_percent: Math.round(deviationPercent * 100) / 100,
        latitude: account.latitude,
        longitude: account.longitude,
        dataset_id: account.dataset_id,
      });
    }
    // Sudden Down
    else if (current <= avgPrev * 0.70) {
      anomalies.push({
        account_id: account.account_id,
        account_name: account.account_name || '',
        address: account.address || '',
        anomaly_type: 'sudden_down',
        severity: deviationPercent <= -70 ? 'critical' : deviationPercent <= -50 ? 'high' : 'medium',
        average_consumption: Math.round(avgPrev * 100) / 100,
        current_consumption: current,
        deviation_percent: Math.round(deviationPercent * 100) / 100,
        latitude: account.latitude,
        longitude: account.longitude,
        dataset_id: account.dataset_id,
      });
    }
  }

  return anomalies;
}

export function parseGeoJSON(geojsonData) {
  const features = geojsonData.features || [];

  return features.map(feature => {
    const props = feature.properties || {};
    const coords = feature.geometry?.coordinates || [0, 0];

    return {
      account_id: String(props.AccountNumber || props.account_id || props.ogc_fid || Math.random().toString(36).slice(2, 10)),
      account_name: props.Name || props.account_name || '',
      address: props.Address || props.address || '',
      area: props.AREA || '',
      meter_no: props.MeterNo || '',
      book_no: props.BookNo || '',
      rate_code: props.RateCode || '',
      status: props.Status || '',
      prv_reading: Number(props.PRVReading) || 0,
      prs_reading: Number(props.PRSReading) || 0,
      cum_used: Number(props.CumUsed) || 0,
      bill_amount: Number(props.BillAmount) || 0,
      year: props.Year || null,
      month: props.Month || '',
      remarks: props.Remarks || '',
      type: props.Type || '',
      longitude: coords[0],
      latitude: coords[1],
    };
  });
}

/**
 * Detect anomalies from a new dataset by comparing against historical records
 * for the same accounts from previous datasets.
 * 
 * @param {Array} currentAccounts - Accounts parsed from the current upload
 * @param {Array} historicalAccounts - All previously stored WaterAccount records (other datasets)
 */
export function detectAnomaliesWithHistory(currentAccounts, historicalAccounts) {
  const anomalies = [];

  // Build a lookup: accountId -> array of historical cum_used values
  const historyMap = {};
  for (const acc of historicalAccounts) {
    if (!acc.account_id) continue;
    if (!historyMap[acc.account_id]) historyMap[acc.account_id] = [];
    historyMap[acc.account_id].push(acc.cum_used || 0);
  }

  for (const account of currentAccounts) {
    const current = account.cum_used || 0;
    const history = historyMap[account.account_id] || [];

    // Need at least 1 historical reading to compare
    const prevReadings = history.filter(v => v > 0);
    const avgPrev = prevReadings.length > 0
      ? prevReadings.reduce((a, b) => a + b, 0) / prevReadings.length
      : 0;

    // Zero Consumption: had history but now zero
    if (current === 0 && avgPrev > 0) {
      anomalies.push({
        account_id: account.account_id,
        account_name: account.account_name || '',
        address: account.address || '',
        anomaly_type: 'zero_consumption',
        severity: 'critical',
        average_consumption: Math.round(avgPrev * 100) / 100,
        current_consumption: 0,
        deviation_percent: -100,
        latitude: account.latitude,
        longitude: account.longitude,
        dataset_id: account.dataset_id,
      });
      continue;
    }

    if (avgPrev === 0) continue;

    const deviationPercent = ((current - avgPrev) / avgPrev) * 100;

    // Sudden High: ≥ 30% above average
    if (current >= avgPrev * 1.30) {
      anomalies.push({
        account_id: account.account_id,
        account_name: account.account_name || '',
        address: account.address || '',
        anomaly_type: 'sudden_high',
        severity: deviationPercent >= 100 ? 'critical' : deviationPercent >= 50 ? 'high' : 'medium',
        average_consumption: Math.round(avgPrev * 100) / 100,
        current_consumption: current,
        deviation_percent: Math.round(deviationPercent * 100) / 100,
        latitude: account.latitude,
        longitude: account.longitude,
        dataset_id: account.dataset_id,
      });
    }
    // Sudden Down: ≥ 30% below average
    else if (current <= avgPrev * 0.70) {
      anomalies.push({
        account_id: account.account_id,
        account_name: account.account_name || '',
        address: account.address || '',
        anomaly_type: 'sudden_down',
        severity: deviationPercent <= -70 ? 'critical' : deviationPercent <= -50 ? 'high' : 'medium',
        average_consumption: Math.round(avgPrev * 100) / 100,
        current_consumption: current,
        deviation_percent: Math.round(deviationPercent * 100) / 100,
        latitude: account.latitude,
        longitude: account.longitude,
        dataset_id: account.dataset_id,
      });
    }
  }

  return anomalies;
}

export const ANOMALY_COLORS = {
  sudden_high: '#ef4444',
  zero_consumption: '#f59e0b',
  sudden_down: '#3b82f6',
};

export const ANOMALY_LABELS = {
  sudden_high: 'Sudden High',
  zero_consumption: 'Zero Consumption',
  sudden_down: 'Sudden Down',
};

export const SEVERITY_COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};