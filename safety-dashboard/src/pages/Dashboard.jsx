import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import MapComponent from '../components/MapComponent';
import { useBlackspots } from '../hooks/useBlackspots';
import { ReportingProvider } from '../reporting/ReportingContext';
import ReportFAB from '../reporting/ReportFAB';
import ReportPanel from '../reporting/ReportPanel';

export default function Dashboard() {
  const [selectedJunction, setSelectedJunction] = useState(null);
  const { blackspots, loading, error } = useBlackspots();

  if (loading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin" />
          </div>
          <p className="text-slate-400 text-sm font-medium tracking-wide animate-pulse">
            Loading live data from Firebase…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-slate-950">
        <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-8 max-w-md text-center">
          <p className="text-red-400 font-bold text-lg mb-2">⚠ Firebase Connection Error</p>
          <p className="text-slate-400 text-sm leading-relaxed">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    // ReportingProvider wraps everything but is fully isolated from blackspot state
    <ReportingProvider>
      <div className="flex flex-col md:flex-row w-screen h-screen overflow-hidden bg-slate-950">
        <Sidebar
          junctions={blackspots}
          onSelectJunction={setSelectedJunction}
        />
        <main className="flex-1 h-full w-full relative">
          <MapComponent
            junctions={blackspots}
            selectedJunction={selectedJunction}
            onSelectJunction={setSelectedJunction}
          />
        </main>
      </div>

      {/* Citizen Reporting UI — rendered outside map layout to avoid z-index conflicts */}
      <ReportFAB />
      <ReportPanel />
    </ReportingProvider>
  );
}
