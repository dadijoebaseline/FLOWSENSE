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

    const rawId = props.accountNumber ?? props.accountnumber ?? props.AccountNumber ?? props.account_id ?? props.ogcFid ?? props.ogc_fid ?? props.meterNo ?? props.meterno ?? props.MeterNo ?? '';
    const accountId = rawId ? String(rawId).trim().replace(/\s+/g, '').replace(/[^A-Za-z0-9_-]/g, '').toUpperCase() : null;

    // Always use cumUsed as the monthly usage for this month
    let cumUsedRaw = props.cumUsed ?? props.cumused ?? props.CumUsed ?? props.cum_used ?? props.Cum_Used;
    let status = (props.status ?? props.Status ?? '').toString().toUpperCase();
    // Preserve original raw value (if present) for precise zero-detection.
    const rawCumUsed = Number.isFinite(Number(cumUsedRaw)) ? Number(cumUsedRaw) : null;
    let cumUsed = Number(cumUsedRaw);
    if (cumUsedRaw === null || cumUsedRaw === undefined || isNaN(cumUsed) || ["DISCONNECTED", "NEW", "RENEWED"].includes(status)) {
      cumUsed = 0;
    }
    // Optionally, keep readings for reference
    const prvReading = Number(props.prvReading ?? props.prvreading ?? props.PRVReading ?? props.prv_reading) || 0;
    const prsReading = Number(props.prsReading ?? props.prsreading ?? props.PRSReading ?? props.prs_reading) || 0;

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
      accountId,
      accountName: props.name ?? props.Name ?? props.account_name ?? '',
      address: props.address ?? props.Address ?? '',
      area: props.area ?? props.AREA ?? '',
      meterNo: props.meterNo ?? props.meterno ?? props.MeterNo ?? '',
      bookNo: props.bookNo ?? props.bookno ?? props.BookNo ?? '',
      rateCode: props.rateCode ?? props.ratecode ?? props.RateCode ?? '',
      status: props.status ?? props.Status ?? '',
      prvReading,
      prsReading,
      cumUsed, rawCumUsed, // Canonical field for monthly usage (rawCumUsed preserves original provided reading, or null)
      billAmount: Number(props.billAmount ?? props.BillAmount) || 0,
      year: props.year ?? props.Year ?? null,
      month: props.month ?? props.Month ?? '',
      remarks: props.remarks ?? props.Remarks ?? '',
      type: props.type ?? props.Type ?? '',
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

  // Build a lookup: accountId -> array of monthly consumption values (chronological)
  // cumUsed is already the monthly consumption (prsReading - prvReading), not cumulative
  const historyMap = {};
  for (const acc of historicalAccounts) {
    if (!acc.accountId) continue;
    if (!historyMap[acc.accountId]) historyMap[acc.accountId] = [];
    historyMap[acc.accountId].push(Number(acc.cumUsed) || 0);
  }

  let skipped_no_history = 0;
  let skipped_zero_avg = 0;
  let skipped_zero_current = 0;
  let flagged_anomalies = 0;

  for (const account of currentAccounts) {
    if (!account.accountId) continue;
    const history = historyMap[account.accountId] || [];

    // Prefer rawCumUsed when present; fallback to cumUsed for reading detection
    const rawReading = (account.rawCumUsed !== undefined && account.rawCumUsed !== null) ? Number(account.rawCumUsed)
                      : (account.cumUsed !== undefined && account.cumUsed !== null) ? Number(account.cumUsed)
                      : null;
    const hasReading = rawReading !== null && !isNaN(rawReading);
    const status = (account.status || '').toLowerCase();

    if (history.length === 0) {
      skipped_no_history++;
      continue;
    }

    // Build numeric history array
    const numericHistory = history.map(h => Number(h)).filter(v => !isNaN(v) && isFinite(v));
    // Default: treat historical values as monthly consumption
    let monthlyHistory = numericHistory.filter(v => v > 0);

    // If historical values look like cumulative readings, convert to monthly diffs
    if (numericHistory.length >= 2) {
      const diffs = [];
      for (let i = 1; i < numericHistory.length; i++) {
        const d = numericHistory[i] - numericHistory[i - 1];
        if (!isNaN(d) && isFinite(d)) diffs.push(d);
      }
      const positiveDiffs = diffs.filter(d => d > 0);
      if (positiveDiffs.length > 0) {
        monthlyHistory = positiveDiffs;
      }
    }

    const avgPrev = monthlyHistory.length > 0
      ? monthlyHistory.reduce((a, b) => a + b, 0) / monthlyHistory.length
      : 0;

    if (avgPrev === 0) {
      skipped_zero_avg++;
      continue;
    }

    let currentConsumption;
    if (!hasReading) {
      if (status === 'disconnected') {
        skipped_zero_current++;
        continue;
      }
      const isKnownStatus = status === '' || status === 'active' || status === 'new' || status === 'ni-renew';
      if (isKnownStatus) {
        // Not yet read: estimate using historical average
        currentConsumption = avgPrev;
      } else {
        skipped_zero_current++;
        continue;
      }
    } else {
      currentConsumption = rawReading;
    }

    // Only treat as zero_consumption anomaly when the provided reading was explicitly zero and account status is ACTIVE
    if (hasReading && Number(rawReading) === 0 && avgPrev > 0 && status === 'active') {
      anomalies.push({
        accountNumber: account.accountId,
        name: account.accountName || '',
        meterNo: account.meterNo || '',
        address: account.address || '',
        anomalyType: 'zero_consumption',
        severity: 'critical',
        averageConsumption: Math.round(avgPrev * 100) / 100,
        currentConsumption: 0,
        reportedReading: Number(rawReading),
        deviationPercent: -100,
        latitude: account.latitude,
        longitude: account.longitude,
        status: account.status || '',
        datasetId: account.datasetId,
      });
      flagged_anomalies++;
      continue;
    }

    if (currentConsumption === 0) {
      skipped_zero_current++;
      continue;
    }

    const deviationPercent = ((currentConsumption - avgPrev) / avgPrev) * 100;

    const difference = currentConsumption - avgPrev;

    // Sudden High: consumption ≥ 30% above average and absolute increase > 30
    if (currentConsumption >= avgPrev * 1.30 && difference > 30) {
      anomalies.push({
        accountNumber: account.accountId,
        name: account.accountName || '',
        meterNo: account.meterNo || '',
        address: account.address || '',
        anomalyType: 'sudden_high',
        severity: deviationPercent >= 100 ? 'critical' : deviationPercent >= 50 ? 'high' : 'medium',
        averageConsumption: Math.round(avgPrev * 100) / 100,
        currentConsumption: Math.round(currentConsumption * 100) / 100,
        reportedReading: hasReading ? Number(rawReading) : null,
        deviationPercent: Math.round(deviationPercent * 100) / 100,
        latitude: account.latitude,
        longitude: account.longitude,
        status: account.status || '',
        datasetId: account.datasetId,
      });
      flagged_anomalies++;
    }
    // Sudden Down: consumption ≤ 30% below average, only for active accounts, and absolute drop > 30
    else if (status === 'active' && currentConsumption <= avgPrev * 0.70 && -difference > 30) {
      anomalies.push({
        accountNumber: account.accountId,
        name: account.accountName || '',
        meterNo: account.meterNo || '',
        address: account.address || '',
        anomalyType: 'sudden_down',
        severity: deviationPercent <= -70 ? 'critical' : deviationPercent <= -50 ? 'high' : 'medium',
        averageConsumption: Math.round(avgPrev * 100) / 100,
        currentConsumption: Math.round(currentConsumption * 100) / 100,
        reportedReading: hasReading ? Number(rawReading) : null,
        deviationPercent: Math.round(deviationPercent * 100) / 100,
        latitude: account.latitude,
        longitude: account.longitude,
        status: account.status || '',
        datasetId: account.datasetId,
      });
      flagged_anomalies++;
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