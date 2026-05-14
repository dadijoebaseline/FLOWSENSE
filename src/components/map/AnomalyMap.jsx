import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { ANOMALY_COLORS, ANOMALY_LABELS } from '@/lib/anomalyDetection';
import 'leaflet/dist/leaflet.css';

const severityRadius = { low: 6, medium: 9, high: 12, critical: 16 };

const popupStyle = `
  .leaflet-popup-content-wrapper {
    background: rgba(15,17,26,0.96) !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    border-radius: 14px !important;
    box-shadow: 0 16px 48px rgba(0,0,0,0.6) !important;
    color: #e2e8f0 !important;
    backdrop-filter: blur(20px);
    padding: 0;
  }
  .leaflet-popup-tip { background: rgba(15,17,26,0.96) !important; }
  .leaflet-popup-content { margin: 0 !important; }
  .leaflet-container { background: #0d1117; }
`;

export default function AnomalyMap({ anomalies, height = '500px' }) {
  const validAnomalies = useMemo(
    () => anomalies.filter(a => a.latitude && a.longitude && a.latitude !== 0 && a.longitude !== 0),
    [anomalies]
  );

  const center = useMemo(() => {
    if (validAnomalies.length === 0) return [13.75, 100.5];
    const avgLat = validAnomalies.reduce((s, a) => s + a.latitude, 0) / validAnomalies.length;
    const avgLng = validAnomalies.reduce((s, a) => s + a.longitude, 0) / validAnomalies.length;
    return [avgLat, avgLng];
  }, [validAnomalies]);

  const containerStyleBase = { border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' };
  const useClassHeight = typeof height === 'string' && height.includes('h-');
  const containerClassName = `rounded-2xl overflow-hidden w-full ${useClassHeight ? height : ''}`.trim();
  const containerStyle = useClassHeight ? containerStyleBase : { ...containerStyleBase, height };

  return (
    <>
      <style>{popupStyle}</style>
      <div className={containerClassName} style={containerStyle}>
        <MapContainer center={center} zoom={11} className="w-full h-full" scrollWheelZoom={true} zoomControl={true}>
          {/* Dark map tiles from CartoDB */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {validAnomalies.map((anomaly, i) => {
            const color = ANOMALY_COLORS[anomaly.anomaly_type] || '#6b7280';
            const radius = severityRadius[anomaly.severity] || 8;
            return (
              <CircleMarker
                key={anomaly.id || i}
                center={[anomaly.latitude, anomaly.longitude]}
                radius={radius}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.75,
                  weight: 1.5,
                  opacity: 0.9,
                }}
              >
                <Popup maxWidth={220}>
                  <div style={{ padding: '14px 16px', fontFamily: 'Inter, sans-serif' }}>
                    <p style={{ fontWeight: 700, fontSize: 13, color: '#f1f5f9', marginBottom: 8, fontFamily: 'Space Grotesk, sans-serif' }}>
                      {anomaly.account_name || anomaly.account_id}
                    </p>
                    {anomaly.address && (
                      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>{anomaly.address}</p>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>Type</span>
                        <span style={{ fontSize: 11, color: color, fontWeight: 600 }}>{ANOMALY_LABELS[anomaly.anomaly_type]}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>Avg</span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{anomaly.average_consumption} cu.m.</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>Current</span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{anomaly.current_consumption} cu.m.</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>Deviation</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: anomaly.deviation_percent > 0 ? '#f87171' : '#38bdf8' }}>
                          {anomaly.deviation_percent > 0 ? '+' : ''}{anomaly.deviation_percent}%
                        </span>
                      </div>
                    </div>
                    <div style={{ marginTop: 10, padding: '5px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, textAlign: 'center' }}>
                      <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Severity: </span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{anomaly.severity}</span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </>
  );
}