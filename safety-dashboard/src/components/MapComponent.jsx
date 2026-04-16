import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import UserReportLayer from '../reporting/UserReportLayer';
import MapClickCapture from '../reporting/MapClickCapture';

// ---------------------------------------------------------------------------
// Helper: pick risk score from Firestore field OR fall back to engine
// ---------------------------------------------------------------------------
function getRisk(j) {
  // Prefer the AI-predicted score from Firestore
  if (typeof j.predicted_risk_score === 'number' && j.predicted_risk_score > 0) {
    return j.predicted_risk_score;
  }
  // Legacy engine fallback (for any locally-sourced data still in use)
  const score =
    (j.accident_count / 10) * 0.5 +
    (j.traffic_weight || 0) * 0.3 +
    (j.night_factor || 0) * 0.2;
  return Math.min(score, 1.0);
}

// ---------------------------------------------------------------------------
// Marker icon — colour-coded by risk tier
// ---------------------------------------------------------------------------
function createCustomIcon(risk) {
  let color, glowColor, label;
  if (risk >= 0.8) {
    color = '#ef4444'; glowColor = 'rgba(239,68,68,0.85)'; label = 'CRITICAL';
  } else if (risk >= 0.6) {
    color = '#f97316'; glowColor = 'rgba(249,115,22,0.75)'; label = 'HIGH';
  } else if (risk >= 0.4) {
    color = '#eab308'; glowColor = 'rgba(234,179,8,0.65)'; label = 'MED';
  } else {
    color = '#22c55e'; glowColor = 'rgba(34,197,94,0.6)'; label = 'LOW';
  }

  const svgIcon = `
    <div style="position:relative;width:34px;height:42px;filter:drop-shadow(0 0 8px ${glowColor})">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 42" width="34" height="42">
        <path d="M17 0C8.716 0 2 6.716 2 15c0 9.627 13.2 24.5 14.1 25.5a1.2 1.2 0 0 0 1.8 0C18.8 39.5 32 24.627 32 15 32 6.716 25.284 0 17 0z"
              fill="${color}" stroke="white" stroke-width="1.5"/>
        <circle cx="17" cy="15" r="6" fill="white"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-icon bg-transparent border-none',
    html: svgIcon,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -44]
  });
}

// ---------------------------------------------------------------------------
// Fly-to adapter
// ---------------------------------------------------------------------------
function MapViewAdapter({ selectedJunction }) {
  const map = useMap();
  useEffect(() => {
    if (selectedJunction) {
      map.flyTo([selectedJunction.latitude, selectedJunction.longitude], 17, {
        animate: true,
        duration: 1.5
      });
    }
  }, [selectedJunction, map]);
  return null;
}

// ---------------------------------------------------------------------------
// Risk badge helper
// ---------------------------------------------------------------------------
function RiskBadge({ risk }) {
  let cls, label;
  if (risk >= 0.8)      { cls = 'bg-red-100 text-red-700 border-red-300';     label = 'CRITICAL'; }
  else if (risk >= 0.6) { cls = 'bg-orange-100 text-orange-700 border-orange-300'; label = 'HIGH'; }
  else if (risk >= 0.4) { cls = 'bg-yellow-100 text-yellow-700 border-yellow-300'; label = 'MEDIUM'; }
  else                  { cls = 'bg-green-100 text-green-700 border-green-300'; label = 'LOW'; }
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {label} · {risk.toFixed(2)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Confidence bar helper
// ---------------------------------------------------------------------------
function ConfidenceBar({ score }) {
  const pct = Math.round(score * 100);
  const color = pct >= 90 ? '#22c55e' : pct >= 75 ? '#eab308' : '#f97316';
  return (
    <div className="flex items-center gap-2">
      <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 99 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.5s' }} />
      </div>
      <span className="text-xs font-bold text-slate-600">{pct}%</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function MapComponent({ junctions, selectedJunction, onSelectJunction }) {
  const mapRef = useRef(null);

  return (
    <div className="flex-1 w-full h-full relative z-0">
      <MapContainer
        center={[10.7905, 78.7047]}
        zoom={12}
        maxZoom={19}
        className="w-full h-full z-0"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewAdapter selectedJunction={selectedJunction} />

        {/* ── Citizen report layer (orange pulsing hazard markers) ── */}
        <UserReportLayer />

        {/* ── Map-click location picker for report form ── */}
        <MapClickCapture />

        {junctions.map(j => {
          const risk = getRisk(j);
          return (
            <Marker
              key={j.id}
              position={[j.latitude, j.longitude]}
              icon={createCustomIcon(risk)}
              eventHandlers={{ click: () => onSelectJunction(j) }}
            >
              <Popup className="custom-white-popup" minWidth={260}>
                <div className="p-1 min-w-[260px] text-slate-800 font-sans text-sm">

                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-2 mb-3">
                    <h3 className="font-bold text-slate-900 leading-tight">
                      📍 {j.name}
                    </h3>
                    {j.is_top_10 && (
                      <span className="shrink-0 text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-300 px-1.5 py-0.5 rounded-full">
                        TOP 10
                      </span>
                    )}
                  </div>

                  {/* Risk row */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-slate-500 text-xs font-semibold w-28 shrink-0">AI Risk Score</span>
                    <RiskBadge risk={risk} />
                  </div>

                  {/* Confidence */}
                  <div className="mb-3">
                    <span className="text-slate-500 text-xs font-semibold block mb-1">Model Confidence</span>
                    <ConfidenceBar score={j.confidence_score} />
                  </div>

                  {/* Info grid */}
                  <div className="flex flex-col gap-1.5 text-xs mb-3">
                    {[
                      ['Cause', j.predicted_cause],
                      ['Road Class', j.road_class],
                      ['Junction Type', j.junction_type],
                      ['Traffic (PCU/hr)', j.pcu_per_hour?.toLocaleString()],
                      ['Lighting', j.env_lighting],
                      ['Surface', j.road_surface],
                      ['Accidents (hist.)', j.accident_count],
                    ].map(([label, value]) => value ? (
                      <div key={label} className="flex items-start">
                        <span className="font-semibold text-slate-500 w-32 shrink-0">{label}:</span>
                        <span className="font-medium text-slate-800">{value}</span>
                      </div>
                    ) : null)}
                  </div>

                  {/* Fix box */}
                  {j.suggested_fix && (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <span className="font-semibold text-indigo-700 block mb-1 text-xs uppercase tracking-wider">
                        Recommended Fix
                      </span>
                      <div className="bg-indigo-50 text-indigo-900 p-2 rounded border border-indigo-200 text-xs font-semibold leading-relaxed">
                        {j.suggested_fix}
                      </div>
                      {j.irc_reference && (
                        <p className="text-[10px] text-slate-400 mt-1 text-right font-mono">{j.irc_reference}</p>
                      )}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
