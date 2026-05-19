import { describe, it, expect } from 'vitest';
import { parseGeoJSON, detectAnomaliesWithHistory } from '../anomalyDetection';

describe('parseGeoJSON', () => {
  it('normalizes account IDs and skips missing ids', () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [1,2]}, properties: { AccountNumber: ' abc 123 ' , CumUsed: '5' } },
        { type: 'Feature', geometry: { type: 'Point', coordinates: [1,2]}, properties: { CumUsed: '3' } },
      ]
    };
    const accounts = parseGeoJSON(geojson, '2026-05');
    expect(accounts.length).toBe(1);
    expect(accounts[0].accountId).toBe('ABC123');
    expect(accounts[0].cumUsed).toBe(5);
  });
});

describe('detectAnomaliesWithHistory', () => {
  it('detects sudden high when current >> avg historical (using cumulative readings)', () => {
    // historical cumulative readings across two months: 10 -> 12 (monthly consumption = 2)
    const historical = [
      { accountId: 'A1', cumUsed: 10 },
      { accountId: 'A1', cumUsed: 12 },
    ];
    // current cumulative reading indicates current monthly consumption = 30 - 12 = 18
    const current = [{ accountId: 'A1', cumUsed: 30, datasetId: '2026-05' }];
    const anomalies = detectAnomaliesWithHistory(current, historical);
    expect(anomalies.length).toBe(1);
    expect(anomalies[0].anomalyType).toBe('sudden_high');
    expect(anomalies[0].severity).toBe('critical');
  });
});