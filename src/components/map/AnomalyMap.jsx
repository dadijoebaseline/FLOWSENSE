import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
// Marker clustering
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import L from 'leaflet';
import { ANOMALY_COLORS, ANOMALY_LABELS } from '@/lib/anomalyDetection';


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

          {/* MarkerClusterGroup using leaflet.markercluster */}
          <MarkersClusterLayer anomalies={validAnomalies} />
        </MapContainer>
      </div>
    </>
  );
}

/**
 * Marker cluster layer component that integrates with react-leaflet via the Leaflet API.
 * Renders CircleMarker instances into clusters for better performance with many markers.
 */
function MarkersClusterLayer({ anomalies }) {
  // Create custom icons for cluster markers using a simple colored circle SVG
  const createClusterIcon = (count, color) => {
    const size = Math.min(60, 30 + Math.floor(Math.log10(count + 1) * 8));
    const svg = `data:image/svg+xml;utf8,` + encodeURIComponent(`
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" fill-opacity="0.95" stroke="#000" stroke-opacity="0.25" stroke-width="2" />
        <text x="50%" y="50%" dy=".3em" font-family="Arial, Helvetica, sans-serif" font-size="${Math.max(10, Math.floor(size/3))}" fill="#fff" text-anchor="middle">${count}</text>
      </svg>
    `);
    return L.divIcon({ html: `<img src="${svg}" style="display:block; width: ${size}px; height: ${size}px;"/>`, className: 'custom-cluster-icon', iconSize: [size, size] });
  };

  // This component uses imperative Leaflet APIs to add clustering because react-leaflet support for markercluster is minimal
  React.useEffect(() => {
    if (!anomalies || anomalies.length === 0) return;
    // Access global L (leaflet) which has markerCluster plugin attached
    if (!L || !L.markerClusterGroup) return;

    const map = document.querySelector('.leaflet-container')?.__reactLeaflet_map;
    // Fallback: find the first active map instance from window
    // But react-leaflet exposes map via context; this is a pragmatic approach in a static demo
    const leafletMap = window._leaflet_map_instance || (map || null);
    // If map not yet available, wait briefly
    if (!leafletMap) return;

    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      maxClusterRadius: 60,
    });

    anomalies.forEach(anomaly => {
      if (!anomaly.latitude || !anomaly.longitude) return;
      const color = ANOMALY_COLORS[anomaly.anomalyType] || '#6b7280';
      const radius = { low: 6, medium: 9, high: 12, critical: 16 }[anomaly.severity] || 8;
      const marker = L.circleMarker([anomaly.latitude, anomaly.longitude], {
        radius,
        color,
        fillColor: color,
        fillOpacity: 0.85,
        weight: 1,
      });
      const popupContent = document.createElement('div');
      popupContent.style.padding = '14px 16px';
      popupContent.style.fontFamily = 'Inter, sans-serif';
      popupContent.innerHTML = `
        <p style="font-weight:700;font-size:13px;color:#f1f5f9;margin-bottom:8px;">${anomaly.accountName || anomaly.accountNumber}</p>
        ${anomaly.address ? `<p style="font-size:11px;color:#64748b;margin-bottom:10px;">${anomaly.address}</p>` : ''}
        <div style="display:flex;flex-direction:column;gap:5px;">
          <div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:11px;color:#64748b;">Type</span><span style="font-size:11px;color:${color};font-weight:600;">${ANOMALY_LABELS[anomaly.anomalyType]}</span></div>
          <div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:11px;color:#64748b;">Avg</span><span style="font-size:11px;color:#94a3b8;">${anomaly.averageConsumption} cu.m.</span></div>
          <div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:11px;color:#64748b;">Current</span><span style="font-size:11px;color:#94a3b8;">${anomaly.currentConsumption} cu.m.</span></div>
          <div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:11px;color:#64748b;">Deviation</span><span style="font-size:11px;font-weight:700;color:${anomaly.deviationPercent > 0 ? '#f87171' : '#38bdf8'};">${anomaly.deviationPercent > 0 ? '+' : ''}${anomaly.deviationPercent}%</span></div>
        </div>
        <div style="margin-top:10px;padding:5px 10px;background:rgba(255,255,255,0.06);border-radius:8px;text-align:center;"><span style="font-size:10px;color:#94a3b8;text-transform:uppercase;">Severity: </span><span style="font-size:10px;font-weight:700;color:${color};text-transform:uppercase;">${anomaly.severity}</span></div>
      `;
      marker.bindPopup(popupContent);
      clusterGroup.addLayer(marker);
    });

    leafletMap.addLayer(clusterGroup);

    // Create a custom cluster icon callback to style clusters by dominant anomaly type
    clusterGroup.options.iconCreateFunction = function (cluster) {
      const childMarkers = cluster.getAllChildMarkers();
      // Count types and pick the most common
      const counts = {};
      childMarkers.forEach(m => {
        const c = m.options.fillColor || '#6b7280';
        counts[c] = (counts[c] || 0) + 1;
      });
      // pick color with highest count
      let maxColor = '#6b7280';
      let maxCount = 0;
      for (const c in counts) {
        if (counts[c] > maxCount) { maxCount = counts[c]; maxColor = c; }
      }
      return createClusterIcon(cluster.getChildCount(), maxColor);
    };

    // Cleanup on effect rerun
    return () => {
      try { leafletMap.removeLayer(clusterGroup); } catch (e) {}
    };
  }, [anomalies]);

  return null;
}
