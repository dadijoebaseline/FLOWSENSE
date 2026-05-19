import { describe, it, expect } from 'vitest';
import { computeAnomalyDistribution } from '../AnomalyChart';

describe('computeAnomalyDistribution', () => {
  it('counts camelCase and snake_case keys correctly', () => {
    const anomalies = [
      { anomalyType: 'sudden_high' },
      { anomaly_type: 'sudden_high' },
      { anomalyType: 'zero_consumption' },
    ];

    const data = computeAnomalyDistribution(anomalies);
    const map = Object.fromEntries(data.map(d => [d.name, d.value]));

    expect(map['Sudden High']).toBe(2);
    expect(map['Zero Consumption']).toBe(1);
  });

  it('produces unknown for missing type', () => {
    const anomalies = [{}];
    const data = computeAnomalyDistribution(anomalies);
    expect(data.length).toBe(1);
    expect(data[0].name).toBe('unknown');
    expect(data[0].value).toBe(1);
  });
});
