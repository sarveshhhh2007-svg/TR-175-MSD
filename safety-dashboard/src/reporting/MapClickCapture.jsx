import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useReporting } from './ReportingContext';

/**
 * Mounts inside <MapContainer>. When isCapturingLocation is true,
 * the next map click fires onMapClick() and restores normal cursor.
 * In normal mode it's completely invisible and non-interfering.
 */
export default function MapClickCapture() {
  const map = useMap();
  const { isCapturingLocation, onMapClick } = useReporting();

  useEffect(() => {
    const container = map.getContainer();

    if (isCapturingLocation) {
      container.style.cursor = 'crosshair';

      const handler = (e) => {
        onMapClick(e.latlng);
      };
      map.once('click', handler);   // one-shot: fires once then removes itself

      return () => {
        map.off('click', handler);
        container.style.cursor = '';
      };
    } else {
      container.style.cursor = '';
    }
  }, [isCapturingLocation, map, onMapClick]);

  return null;
}
