import React from 'react';
import { TriangleAlert } from 'lucide-react';
import { useReporting } from './ReportingContext';

export default function ReportFAB() {
  const { openPanel, isCapturingLocation } = useReporting();

  return (
    <button
      id="report-fab"
      onClick={openPanel}
      title="Report a road hazard"
      disabled={isCapturingLocation}
      className="
        fixed bottom-6 right-6 z-[1000]
        w-14 h-14 rounded-full
        bg-gradient-to-br from-orange-500 to-orange-600
        text-white shadow-2xl
        flex items-center justify-center
        transition-all duration-200
        hover:from-orange-400 hover:to-orange-500 hover:scale-110 hover:shadow-orange-500/50
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-4 focus:ring-orange-400/50
      "
      style={{ boxShadow: '0 0 24px rgba(249,115,22,0.5)' }}
    >
      <TriangleAlert className="w-6 h-6" strokeWidth={2.5} />
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full animate-ping bg-orange-400 opacity-20 pointer-events-none" />
    </button>
  );
}
