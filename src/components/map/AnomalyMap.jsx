import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
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

          {/* Marker rendering: use Canvas for large datasets, else cluster */}
          {validAnomalies.length > 1500 ? (
            <CanvasMarkersLayer anomalies={validAnomalies} />
          ) : (
            <MarkersClusterLayer anomalies={validAnomalies} />
          )}
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
  const map = useMap();

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

  React.useEffect(() => {
    if (!anomalies || anomalies.length === 0) return;
    if (!L || !L.markerClusterGroup) return;

    const leafletMap = map;

    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      maxClusterRadius: 60,
    });

    clusterGroup.options.iconCreateFunction = function (cluster) {
      const childMarkers = cluster.getAllChildMarkers();
      const counts = {};
      childMarkers.forEach(m => {
        const c = m.options.fillColor || '#6b7280';
        counts[c] = (counts[c] || 0) + 1;
      });
      let maxColor = '#6b7280';
      let maxCount = 0;
      for (const c in counts) {
        if (counts[c] > maxCount) { maxCount = counts[c]; maxColor = c; }
      }
      return createClusterIcon(cluster.getChildCount(), maxColor);
    };

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

    return () => {
      try { leafletMap.removeLayer(clusterGroup); } catch (e) {}
    };
  }, [anomalies, map]);

  return null;
}

function CanvasMarkersLayer({ anomalies }) {
  const map = useMap();
  React.useEffect(() => {
    if (!anomalies || anomalies.length === 0) return;
    const pane = map.getPanes().overlayPane;
    const canvas = L.DomUtil.create('canvas', 'leaflet-canvas-markers');
    canvas.style.position = 'absolute';
    canvas.style.pointerEvents = 'auto';
    const ctx = canvas.getContext('2d');
    const ratio = window.devicePixelRatio || 1;

    function resize() {
      const size = map.getSize();
      canvas.width = Math.max(1, Math.floor(size.x * ratio));
      canvas.height = Math.max(1, Math.floor(size.y * ratio));
      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
      const bounds = map.getBounds();
      for (const anomaly of anomalies) {
        if (!anomaly.latitude || !anomaly.longitude) continue;
        const latlng = L.latLng(anomaly.latitude, anomaly.longitude);
        if (!bounds.contains(latlng)) continue;
        const pt = map.latLngToContainerPoint(latlng);
        const radius = severityRadius[anomaly.severity] || 8;
        const color = ANOMALY_COLORS[anomaly.anomalyType] || '#6b7280';
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1;
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    function onViewChange() { draw(); }
    function onResize() { resize(); }

    pane.appendChild(canvas);
    map.on('move', onViewChange);
    map.on('zoomend', onViewChange);
    map.on('resize', onResize);
    resize();

    function onClick(e) {
      const clickPoint = e.containerPoint || map.latLngToContainerPoint(e.latlng);
      let minDist = Infinity, nearest = null;
      for (const anomaly of anomalies) {
        if (!anomaly.latitude || !anomaly.longitude) continue;
        const pt = map.latLngToContainerPoint([anomaly.latitude, anomaly.longitude]);
        const dx = pt.x - clickPoint.x;
        const dy = pt.y - clickPoint.y;
        const distSq = dx*dx + dy*dy;
        if (distSq < minDist) { minDist = distSq; nearest = anomaly; }
      }
      if (nearest && Math.sqrt(minDist) <= 20) {
        const html = `
          <div style="padding:14px 16px;font-family:Inter, sans-serif;">
           <p style="font-weight:700;font-size:13px;color:#f1f5f9;margin-bottom:8px;">${nearest.accountName || nearest.accountNumber}</p>
           ${nearest.address ? `<p style="font-size:11px;color:#64748b;margin-bottom:10px;">${nearest.address}</p>` : ''}
           <div style="display:flex;flex-direction:column;gap:5px;">
             <div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:11px;color:#64748b;">Type</span><span style="font-size:11px;color:${ANOMALY_COLORS[nearest.anomalyType]||'#6b7280'};font-weight:600;">${ANOMALY_LABELS[nearest.anomalyType]}</span></div>
             <div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:11px;color:#64748b;">Avg</span><span style="font-size:11px;color:#94a3b8;">${nearest.averageConsumption} cu.m.</span></div>
             <div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:11px;color:#64748b;">Current</span><span style="font-size:11px;color:#94a3b8;">${nearest.currentConsumption} cu.m.</span></div>
             <div style="display:flex;justify-content:space-between;align-items:center;"><span style="font-size:11px;color:#64748b;">Deviation</span><span style="font-size:11px;font-weight:700;color:${nearest.deviationPercent>0? '#f87171':'#38bdf8'};">${nearest.deviationPercent>0?'+':''}${nearest.deviationPercent}%</span></div>
           </div>
           <div style="margin-top:10px;padding:5px 10px;background:rgba(255,255,255,0.06);border-radius:8px;text-align:center;">
             <span style="font-size:10px;color:#94a3b8;text-transform:uppercase;">Severity: </span>
             <span style="font-size:10px;font-weight:700;color:${ANOMALY_COLORS[nearest.anomalyType]||'#6b7280'};text-transform:uppercase;">${nearest.severity}</span>
           </div>
          </div>
        `;
        const popup = L.popup({ maxWidth: 220 }).setLatLng([nearest.latitude, nearest.longitude]).setContent(html);
        map.openPopup(popup);
      }
    }

    map.on('click', onClick);

    return () => {
      map.off('move', onViewChange);
      map.off('zoomend', onViewChange);
      map.off('resize', onResize);
      map.off('click', onClick);
      try { pane.removeChild(canvas); } catch (e) {}
    };
  }, [anomalies, map]);

  return null;
}
