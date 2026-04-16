import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, Wifi, ChevronDown, ChevronUp } from 'lucide-react';

function getRisk(j) {
  if (typeof j.predicted_risk_score === 'number' && j.predicted_risk_score > 0) {
    return j.predicted_risk_score;
  }
  const score =
    (j.accident_count / 10) * 0.5 +
    (j.traffic_weight || 0) * 0.3 +
    (j.night_factor || 0) * 0.2;
  return Math.min(score, 1.0);
}

function getRiskTier(risk) {
  if (risk >= 0.8) return { label: 'CRITICAL', cls: 'bg-red-500/20 text-red-400 border-red-500/50' };
  if (risk >= 0.6) return { label: 'HIGH',     cls: 'bg-orange-500/20 text-orange-400 border-orange-500/50' };
  if (risk >= 0.4) return { label: 'MED',      cls: 'bg-amber-500/20 text-amber-400 border-amber-500/50' };
  return             { label: 'LOW',      cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' };
}

function ExpandedCard({ j, risk }) {
  const tier = getRiskTier(risk);
  return (
    <div className="mt-3 pt-3 border-t border-slate-700/60 flex flex-col gap-2 text-xs text-slate-400">
      {j.predicted_cause && (
        <div><span className="text-slate-500 font-semibold">Cause: </span>{j.predicted_cause}</div>
      )}
      {j.road_class && (
        <div><span className="text-slate-500 font-semibold">Road: </span>{j.road_class} · {j.junction_type}</div>
      )}
      {j.pcu_per_hour > 0 && (
        <div><span className="text-slate-500 font-semibold">Traffic: </span>{j.pcu_per_hour.toLocaleString()} PCU/hr</div>
      )}
      {j.suggested_fix && (
        <div className="mt-1 bg-indigo-500/10 border border-indigo-500/25 rounded-lg p-2 text-indigo-300 font-semibold leading-relaxed">
          🔧 {j.suggested_fix}
          {j.irc_reference && (
            <span className="block text-indigo-400/60 font-mono text-[10px] mt-0.5">{j.irc_reference}</span>
          )}
        </div>
      )}
      {j.confidence_score > 0 && (
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-slate-500 font-semibold">Confidence:</span>
          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
              style={{ width: `${Math.round(j.confidence_score * 100)}%` }}
            />
          </div>
          <span className="text-slate-400 font-bold">{Math.round(j.confidence_score * 100)}%</span>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ junctions, onSelectJunction }) {
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'top10' | 'critical'

  const ranked = junctions
    .map(j => ({ ...j, risk: getRisk(j) }))
    .sort((a, b) => b.risk - a.risk);

  const filtered = ranked.filter(j => {
    if (filter === 'top10') return j.is_top_10;
    if (filter === 'critical') return j.risk >= 0.8;
    return true;
  });

  const criticalCount = ranked.filter(j => j.risk >= 0.8).length;
  const top10Count    = ranked.filter(j => j.is_top_10).length;

  return (
    <div className="w-full md:w-80 bg-slate-900 border-r border-slate-800 h-full flex flex-col z-20 shadow-2xl shrink-0">

      {/* ── Header ── */}
      <div className="p-5 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            GeoAI Safety
          </h1>
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </div>
        </div>
        <p className="text-slate-500 text-xs flex items-center gap-1.5">
          <Wifi className="w-3 h-3" />
          Firebase Realtime DB · {junctions.length} locations
        </p>

        {/* Stats row */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Total', value: junctions.length, color: 'text-slate-300' },
            { label: 'Critical', value: criticalCount, color: 'text-red-400' },
            { label: 'Top 10', value: top10Count, color: 'text-indigo-400' },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/60 rounded-lg py-2">
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
              <div className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="mt-3 flex gap-1.5">
          {[['all', 'All'], ['top10', 'Top 10'], ['critical', 'Critical']].map(([key, lbl]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 py-1 rounded-md text-xs font-semibold transition-all ${
                filter === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>

        {/* Shield note */}
        <div className="mt-3 p-2.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-200/80 leading-relaxed">
            Sorted by descending AI risk score in real-time.
          </p>
        </div>
      </div>

      {/* ── List ── */}
      <div className="p-3 flex flex-col gap-2 overflow-y-auto flex-1 pb-6">
        {filtered.length === 0 && (
          <p className="text-slate-500 text-sm text-center mt-8">No locations match this filter.</p>
        )}
        {filtered.map((j, index) => {
          const tier = getRiskTier(j.risk);
          const isExpanded = expandedId === j.id;
          return (
            <div
              key={j.id}
              className={`bg-slate-800/40 hover:bg-slate-800 border rounded-xl p-3.5 cursor-pointer transition-all
                hover:shadow-lg group
                ${isExpanded ? 'border-indigo-500/50 bg-slate-800' : 'border-slate-700/50 hover:border-slate-600'}`}
              onClick={() => {
                onSelectJunction(j);
                setExpandedId(isExpanded ? null : j.id);
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-2 min-w-0">
                  <span className="text-slate-500 font-mono text-xs font-bold pt-0.5 shrink-0">#{index + 1}</span>
                  <div className="min-w-0">
                    <h3 className="text-slate-200 font-semibold text-sm leading-snug group-hover:text-white transition-colors truncate">
                      {j.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      {j.is_top_10 && (
                        <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 px-1.5 py-0.5 rounded-full">
                          TOP 10
                        </span>
                      )}
                      {j.predicted_cause && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-300/70">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {j.predicted_cause}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                  <div className={`px-2 py-0.5 rounded-md text-xs font-bold border ${tier.cls}`}>
                    {j.risk.toFixed(2)}
                  </div>
                  <div className={`p-0.5 rounded text-slate-500 hover:text-slate-300 transition-colors`}>
                    {isExpanded
                      ? <ChevronUp className="w-3.5 h-3.5" />
                      : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>

              {isExpanded && <ExpandedCard j={j} risk={j.risk} />}
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/80">
        <p className="text-[10px] text-slate-500/80 text-center italic font-medium leading-relaxed">
          "Scalable to any city by swapping the geospatial input."
        </p>
      </div>
    </div>
  );
}
