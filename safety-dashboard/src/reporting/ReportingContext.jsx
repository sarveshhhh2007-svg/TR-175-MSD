import React, { createContext, useContext, useState, useCallback } from 'react';

const ReportingContext = createContext(null);

export function ReportingProvider({ children }) {
  // Panel visibility
  const [isPanelOpen,       setIsPanelOpen]       = useState(false);
  // When true, next map click captures location instead of selecting a blackspot
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  // The lat/lng the user has chosen (GPS or map-click)
  const [pickedLocation,    setPickedLocation]    = useState(null);

  const openPanel  = useCallback(() => setIsPanelOpen(true),  []);
  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
    setIsCapturingLocation(false);
  }, []);

  /** Called by MapClickCapture when the user taps the map in pick-mode */
  const onMapClick = useCallback((latlng) => {
    if (!isCapturingLocation) return;
    setPickedLocation({ lat: latlng.lat, lng: latlng.lng });
    setIsCapturingLocation(false);
    setIsPanelOpen(true);   // re-open slide-over after picking
  }, [isCapturingLocation]);

  /** Start the map-click flow: close the panel, wait for a click */
  const startLocationPick = useCallback(() => {
    setIsPanelOpen(false);
    setIsCapturingLocation(true);
  }, []);

  return (
    <ReportingContext.Provider value={{
      isPanelOpen,    openPanel,    closePanel,
      isCapturingLocation, startLocationPick,
      pickedLocation, setPickedLocation,
      onMapClick,
    }}>
      {children}
    </ReportingContext.Provider>
  );
}

export function useReporting() {
  const ctx = useContext(ReportingContext);
  if (!ctx) throw new Error('useReporting must be used inside <ReportingProvider>');
  return ctx;
}
