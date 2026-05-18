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

    const rawId = props.accountnumber || props.AccountNumber || props.account_id || props.ogc_fid || props.meterno || props.MeterNo || '';
    const accountId = rawId ? String(rawId).trim().replace(/\s+/g, '').replace(/[^A-Za-z0-9_-]/g, '').toUpperCase() : null;

    // Always use cumused as the cumulative usage for this month
    const cum_used = Number(props.cumused ?? props.CumUsed ?? props.cum_used ?? props.Cum_Used) || 0;
    // Optionally, keep readings for reference
    const prv_reading = Number(props.prvreading ?? props.PRVReading ?? props.prv_reading) || 0;
    const prs_reading = Number(props.prsreading ?? props.PRSReading ?? props.prs_reading) || 0;

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
      account_name: props.name || props.Name || props.account_name || '',
      address: props.address || props.Address || '',
      area: props.area || props.AREA || '',
      meter_no: props.meterno || props.MeterNo || '',
      book_no: props.bookno || props.BookNo || '',
      rate_code: props.ratecode || props.RateCode || '',
      status: props.status || props.Status || '',
      prv_reading: prv_reading,
      prs_reading: prs_reading,
      cum_used,  // Now represents: cumulative usage for this month
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

  // Build a lookup: accountId -> array of cum_used values (chronological)
  const historyMap = {};
  for (const acc of historicalAccounts) {
    if (!acc.account_id) continue;
    if (!historyMap[acc.account_id]) historyMap[acc.account_id] = [];
    historyMap[acc.account_id].push(Number(acc.cum_used || 0));
  }

  let skipped_no_history = 0;
  let skipped_zero_avg = 0;
  let skipped_zero_current = 0;
  let flagged_anomalies = 0;

  for (const account of currentAccounts) {
    if (!account.account_id) continue;
    // If cum_used is null or undefined, handle special cases
    let currentCumUsed = account.cum_used;
    const isCumUsedNull = currentCumUsed === null || currentCumUsed === undefined || isNaN(Number(currentCumUsed));
    const status = (account.status || '').toLowerCase();
    const history = historyMap[account.account_id] || [];

    if (history.length === 0) {
      skipped_no_history++;
      continue;
    }

    // Compute monthly consumptions from historical cum_used values
    // e.g., [100, 150, 200] => [50, 50] (differences between months)
    const monthlyConsumptions = [];
    for (let i = 1; i < history.length; i++) {
      const diff = history[i] - history[i - 1];
      if (diff >= 0) monthlyConsumptions.push(diff);
    }
    const avgPrev = monthlyConsumptions.length > 0 ? monthlyConsumptions.reduce((a, b) => a + b, 0) / monthlyConsumptions.length : 0;

    // If we can't compute an average or all history is zero, skip
    if (avgPrev === 0) {
      skipped_zero_avg++;
      continue;
    }

    let currentConsumption;
    if (isCumUsedNull) {
      // If disconnected, skip anomaly detection for this account
      if (status === 'disconnected') {
        skipped_zero_current++;
        continue;
      }
      // If status is 'new', 'new status', or 'ni-renew', treat as not yet read
      const isNewOrNotYetRead = status.includes('new') || status.includes('ni-renew');
      if (isNewOrNotYetRead || status === '' || status === 'active' || status === 'ni') {
        // Not yet read: estimate using last 3 months' average consumption
        const last3 = monthlyConsumptions.slice(-3);
        currentConsumption = last3.length > 0 ? last3.reduce((a, b) => a + b, 0) / last3.length : 0;
      } else {
        // Unknown status, skip
        skipped_zero_current++;
        continue;
      }
    } else {
      // Compute this month's consumption as difference from last month's cum_used
      const lastCumUsed = history.length > 0 ? history[history.length - 1] : 0;
      currentConsumption = Number(currentCumUsed) - lastCumUsed;
    }

    if (currentConsumption === 0 && avgPrev > 0) {
      anomalies.push({
        accountnumber: account.account_id,
        name: account.account_name || '',
        meterno: account.meter_no || '',
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
      flagged_anomalies++;
      continue;
    }

    if (currentConsumption === 0) {
      skipped_zero_current++;
      continue;
    }

    const deviationPercent = ((currentConsumption - avgPrev) / avgPrev) * 100;

    // Sudden High: consumption ≥ 30% above average
    if (currentConsumption >= avgPrev * 1.30) {
      anomalies.push({
        accountnumber: account.account_id,
        name: account.account_name || '',
        meterno: account.meter_no || '',
        address: account.address || '',
        anomaly_type: 'sudden_high',
        severity: deviationPercent >= 100 ? 'critical' : deviationPercent >= 50 ? 'high' : 'medium',
        average_consumption: Math.round(avgPrev * 100) / 100,
        current_consumption: Math.round(currentConsumption * 100) / 100,
        deviation_percent: Math.round(deviationPercent * 100) / 100,
        latitude: account.latitude,
        longitude: account.longitude,
        dataset_id: account.dataset_id,
      });
      flagged_anomalies++;
    }
    // Sudden Down: consumption ≤ 30% below average
    else if (currentConsumption <= avgPrev * 0.70) {
      anomalies.push({
        accountnumber: account.account_id,
        name: account.account_name || '',
        meterno: account.meter_no || '',
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
      flagged_anomalies++;
    }
  }

  console.log(`[detectAnomaliesWithHistory] Processed ${currentAccounts.length} accounts. Flagged: ${flagged_anomalies}, Skipped (no history): ${skipped_no_history}, Skipped (zero avg): ${skipped_zero_avg}, Skipped (zero current): ${skipped_zero_current}`);

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