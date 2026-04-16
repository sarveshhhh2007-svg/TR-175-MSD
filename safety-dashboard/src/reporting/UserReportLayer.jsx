import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useUserReports } from './useUserReports';

// ---------------------------------------------------------------------------
// Time-ago helper
// ---------------------------------------------------------------------------
function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Custom orange hazard icon with CSS pulse
// ---------------------------------------------------------------------------
const pulseStyle = `
  @keyframes rpt-pulse {
    0%, 100% { transform: scale(1);   opacity: 1; }
    50%       { transform: scale(1.25); opacity: 0.75; }
  }
  .rpt-icon { animation: rpt-pulse 1.8s ease-in-out infinite; }
`;

// Inject once
if (typeof document !== 'undefined' && !document.getElementById('rpt-pulse-style')) {
  const s = document.createElement('style');
  s.id = 'rpt-pulse-style';
  s.textContent = pulseStyle;
  document.head.appendChild(s);
}

const hazardIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: `
    <div class="rpt-icon" style="width:36px;height:36px;filter:drop-shadow(0 0 8px rgba(251,146,60,0.9))">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">
        <!-- Outer circle -->
        <circle cx="18" cy="18" r="17" fill="#f97316" stroke="white" stroke-width="2"/>
        <!-- Warning triangle -->
        <path d="M18 9 L28 27 H8 Z" fill="white" stroke="#f97316" stroke-width="1.5" stroke-linejoin="round"/>
        <!-- Exclamation mark -->
        <rect x="16.5" y="15" width="3" height="7" rx="1.5" fill="#f97316"/>
        <circle cx="18" cy="24.5" r="1.5" fill="#f97316"/>
      </svg>
    </div>
  `,
  iconSize:    [36, 36],
  iconAnchor:  [18, 18],
  popupAnchor: [0, -20],
});

// ---------------------------------------------------------------------------
// Component — mounts INSIDE the existing <MapContainer>
// ---------------------------------------------------------------------------
export default function UserReportLayer() {
  const { reports } = useUserReports();

  return (
    <>
      {reports.map((r) => (
        <Marker
          key={r.reportId}
          position={[r.lat, r.lng]}
          icon={hazardIcon}
        >
          <Popup className="custom-white-popup" minWidth={240} maxWidth={280}>
            <div className="font-sans text-slate-800 text-sm">

              {/* Header */}
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                <span className="font-bold text-orange-600 flex items-center gap-1">
                  ⚠ Citizen Report
                </span>
                <span className="text-xs text-slate-400">{timeAgo(r.timestamp)}</span>
              </div>

              {/* Image */}
              {r.imageUrl && (
                <div className="mb-2 rounded-lg overflow-hidden border border-slate-200">
                  <img
                    src={r.imageUrl}
                    alt="Report"
                    className="w-full object-cover"
                    style={{ maxHeight: 140 }}
                  />
                </div>
              )}

              {/* Category tags */}
              {r.categories?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {r.categories.map(cat => (
                    <span
                      key={cat}
                      className="text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-300 px-1.5 py-0.5 rounded-full"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              {r.description && (
                <p className="text-xs text-slate-600 leading-relaxed">{r.description}</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
