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

export function parseGeoJSON(geojsonData, datasetLabel = '') {
  const features = geojsonData.features || [];
  const accounts = [];

  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    const props = feature.properties || {};
    const coords = feature.geometry?.coordinates || [];
    const lng = Number(coords[0]);
    const lat = Number(coords[1]);

    const rawId = props.AccountNumber || props.account_id || props.ogc_fid || props.MeterNo || '';
    const accountId = rawId ? String(rawId).trim().replace(/\s+/g, '').replace(/[^A-Za-z0-9_-]/g, '').toUpperCase() : null;

    const cum_used = Number(props.CumUsed ?? props.cum_used ?? props.Cum_Used) || 0;

    const warnings = [];

    const featureMonth = String(props.Month || props.month || '');
    if (datasetLabel && featureMonth) {
      // If datasetLabel looks like '2026-05' and featureMonth like 'MAY' or '05', do a best-effort check
      const ds = String(datasetLabel).toUpperCase();
      const fm = featureMonth.toUpperCase();
      if (!ds.includes(fm) && !ds.includes(String(props.Year || '')) && fm.length > 0) {
        warnings.push(`Month mismatch: feature Month='${featureMonth}' vs dataset='${datasetLabel}'`);
      }
    }

    if (!accountId) {
      console.warn(`parseGeoJSON: skipping feature at index ${i} — missing stable id (AccountNumber/MeterNo/ogc_fid)`);
      continue;
    }

    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      warnings.push('Invalid coordinates');
    }

    accounts.push({
      account_id: accountId,
      account_name: props.Name || props.account_name || '',
      address: props.Address || props.address || '',
      area: props.AREA || '',
      meter_no: props.MeterNo || '',
      book_no: props.BookNo || '',
      rate_code: props.RateCode || '',
      status: props.Status || '',
      prv_reading: Number(props.PRVReading) || 0,
      prs_reading: Number(props.PRSReading) || 0,
      cum_used,
      bill_amount: Number(props.BillAmount) || 0,
      year: props.Year || null,
      month: props.Month || '',
      remarks: props.Remarks || '',
      type: props.Type || '',
      longitude: lng,
      latitude: lat,
      _warnings: warnings.length ? warnings : undefined,
    });
  }

  return accounts;
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

  // Build a lookup: accountId -> array of historical cum_used values (chronological)
  const historyMap = {};
  for (const acc of historicalAccounts) {
    if (!acc.account_id) continue;
    if (!historyMap[acc.account_id]) historyMap[acc.account_id] = [];
    historyMap[acc.account_id].push(Number(acc.cum_used || 0));
  }

  for (const account of currentAccounts) {
    if (!account.account_id) continue;
    const currentReading = Number(account.cum_used || 0);
    const history = historyMap[account.account_id] || [];

    if (history.length === 0) continue; // no history to compare

    const prevReading = history[history.length - 1];

    // Compute current consumption as delta from last historical cumulative reading
    let currentConsumption = currentReading - prevReading;
    let usedFallback = false;
    if (currentConsumption < 0) {
      // Possible meter rollover or data issue; fallback to using currentReading as consumption
      usedFallback = true;
      currentConsumption = currentReading;
    }

    // Compute average previous consumption from historical diffs if available
    const diffs = [];
    for (let i = 1; i < history.length; i++) {
      const d = history[i] - history[i - 1];
      if (d > 0) diffs.push(d);
    }
    const avgPrev = diffs.length > 0 ? diffs.reduce((a, b) => a + b, 0) / diffs.length : null;

    // If we can't compute an average previous consumption, skip anomaly detection for now
    if (avgPrev === null || avgPrev === 0) continue;

    // Zero Consumption: had history but now zero consumption
    if (currentConsumption === 0 && avgPrev > 0) {
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

    const deviationPercent = ((currentConsumption - avgPrev) / avgPrev) * 100;

    // Sudden High: consumption ≥ 30% above average
    if (currentConsumption >= avgPrev * 1.30) {
      anomalies.push({
        account_id: account.account_id,
        account_name: account.account_name || '',
        address: account.address || '',
        anomaly_type: 'sudden_high',
        severity: deviationPercent >= 100 ? 'critical' : deviationPercent >= 50 ? 'high' : 'medium',
        average_consumption: Math.round(avgPrev * 100) / 100,
        current_consumption: Math.round(currentConsumption * 100) / 100,
        deviation_percent: Math.round(deviationPercent * 100) / 100,
        latitude: account.latitude,
        longitude: account.longitude,
        dataset_id: account.dataset_id,
        _meta: usedFallback ? { note: 'used fallback consumption (possible meter reset)' } : undefined,
      });
    }
    // Sudden Down: consumption ≤ 30% below average
    else if (currentConsumption <= avgPrev * 0.70) {
      anomalies.push({
        account_id: account.account_id,
        account_name: account.account_name || '',
        address: account.address || '',
        anomaly_type: 'sudden_down',
        severity: deviationPercent <= -70 ? 'critical' : deviationPercent <= -50 ? 'high' : 'medium',
        average_consumption: Math.round(avgPrev * 100) / 100,
        current_consumption: Math.round(currentConsumption * 100) / 100,
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