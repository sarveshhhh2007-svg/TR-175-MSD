import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { calculateRisk, getCause, getFix } from '../utils/engine';

const createCustomIcon = (risk) => {
  const isHighRisk = risk > 0.7;
  const color = isHighRisk ? '#ef4444' : '#3b82f6';
  const shadowClass = isHighRisk ? 'drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]' : 'drop-shadow-md';
  
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 ${shadowClass}">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3" fill="white"></circle>
    </svg>
  `;

  return L.divIcon({
    className: 'custom-leaflet-icon bg-transparent border-none',
    html: svgIcon,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40]
  });
};

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

export default function MapComponent({ junctions, selectedJunction, onSelectJunction }) {
  const mapRef = useRef(null);

  // When a marker is clicked, we want to open its popup automatically.
  // React-leaflet handles this natively if we pass ref to Marker, but state is easier:
  // We don't actively force the popup open from sidebar right now, but flying to it is enough for the user to click it.

  return (
    <div className="flex-1 w-full h-full relative z-0">
      <MapContainer 
        center={[10.7905, 78.7047]} 
        zoom={13} 
        maxZoom={18}
        className="w-full h-full z-0"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapViewAdapter selectedJunction={selectedJunction} />

        {junctions.map(j => {
          const risk = calculateRisk(j);
          return (
             <Marker 
              key={j.id} 
              position={[j.latitude, j.longitude]}
              icon={createCustomIcon(risk)}
              eventHandlers={{
                click: () => onSelectJunction(j)
              }}
            >
              <Popup className="custom-white-popup">
                <div className="p-1 min-w-[220px] text-slate-800 font-sans">
                  <h3 className="font-bold text-lg border-b border-slate-200 pb-2 mb-3 text-slate-900 flex items-center gap-2">
                    📍 {j.name}
                  </h3>
                  
                  <div className="flex flex-col gap-2.5 text-sm">
                    <div className="flex items-start">
                      <span className="font-semibold text-slate-500 w-28 shrink-0">Density:</span> 
                      <span className="font-bold text-slate-800">{j.density}</span>
                    </div>
                    
                    <div className="flex items-start">
                      <span className="font-semibold text-slate-500 w-28 shrink-0">Collision Type:</span> 
                      <span className="font-bold text-slate-800">{j.collisionType}</span>
                    </div>
                    
                    <div className="flex items-start">
                      <span className="font-semibold text-slate-500 w-28 shrink-0">Severity:</span> 
                      <span className={`font-bold ${
                        j.severity === 'Fatal' ? 'text-red-600' : 
                        j.severity === 'Minor' ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {j.severity}
                      </span>
                    </div>

                    <div className="mt-2 pt-3 border-t border-slate-200">
                      <span className="font-semibold text-indigo-700 block mb-1.5 text-xs uppercase tracking-wider">Recommended Fix:</span>
                      <div className="bg-indigo-50 text-indigo-900 p-2.5 rounded-md border border-indigo-200 text-xs font-bold leading-relaxed shadow-sm">
                        {getFix(getCause(j))}
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  );
}
