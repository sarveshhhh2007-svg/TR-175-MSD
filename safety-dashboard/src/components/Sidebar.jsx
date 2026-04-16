import React from 'react';
import { calculateRisk, getCause, getFix } from '../utils/engine';
import { MapPin, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Sidebar({ junctions, onSelectJunction }) {
  const ranked = junctions
    .map(j => ({
      ...j,
      risk: calculateRisk(j)
    }))
    .sort((a, b) => b.risk - a.risk);

  const getBadgeColor = (risk) => {
    if (risk > 0.7) return 'bg-red-500/20 text-red-400 border-red-500/50';
    if (risk >= 0.4) return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
  };

  return (
    <div className="w-full md:w-96 bg-slate-900 border-r border-slate-800 h-full flex flex-col z-20 shadow-2xl overflow-y-auto shrink-0 transition-all">
      <div className="p-6 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          GeoAI Safety
        </h1>
        <p className="text-slate-400 text-sm mt-2 font-medium flex items-center gap-2">
          Top 10 Black Spots
        </p>
        <div className="mt-4 p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-200/80 leading-relaxed">
            We prioritize intervention locations based on descending risk scores.
          </p>
        </div>
      </div>
      
      <div className="p-4 flex flex-col gap-3">
        {ranked.map((j, index) => {
          const badgeClass = getBadgeColor(j.risk);
          return (
            <div 
              key={j.id}
              onClick={() => onSelectJunction(j)}
              className="bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:border-slate-600 group"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono text-sm font-bold">#{index + 1}</span>
                  <h3 className="text-slate-200 font-semibold group-hover:text-white transition-colors">{j.name}</h3>
                </div>
                <div className={`px-2 py-1 rounded-md text-xs font-bold border ${badgeClass}`}>
                  {j.risk.toFixed(2)}
                </div>
              </div>
              <div className="text-sm text-slate-400 flex flex-col gap-1.5 mt-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500/70" />
                  <span className="text-xs text-amber-200/70">{getCause(j)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="p-4 mt-auto border-t border-slate-800 bg-slate-900/80">
        <p className="text-xs text-slate-400/80 text-center italic font-medium leading-relaxed">
          "This system is scalable to any city by simply changing the geospatial input."
        </p>
      </div>
    </div>
  );
}
