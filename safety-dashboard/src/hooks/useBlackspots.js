import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../firebase';

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------
function mapLighting(envLighting) {
  const val = (envLighting || '').toLowerCase();
  if (val === 'poor') return { isLowLight: true,  night_factor: 0.85 };
  if (val === 'fair') return { isLowLight: false,  night_factor: 0.5  };
  return                     { isLowLight: false,  night_factor: 0.2  };
}

function mapRoadClass(roadClass) {
  const cls = (roadClass || '').toLowerCase();
  return cls.includes('national highway') || cls.includes('state highway');
}

function mapJunctionType(junctionType) {
  const jt = (junctionType || '').toLowerCase();
  return jt.includes('junction') || jt.includes('intersection') || jt.includes('roundabout');
}

function normaliseRecord(key, data) {
  const lighting = mapLighting(data.env_lighting);
  const maxPcu = 6000;

  return {
    id:                      key,
    name:                    data.location_name || 'Unknown',
    latitude:                Number(data.lat)  || 0,
    longitude:               Number(data.lng)  || 0,

    // engine-compat fields
    accident_count:          Number(data.historical_accidents) || 0,
    traffic_weight:          Math.min(Number(data.pcu_per_hour) / maxPcu, 1.0),
    night_factor:            lighting.night_factor,
    isLowLight:              lighting.isLowLight,
    isHighway:               mapRoadClass(data.road_class),
    isJunctionArea:          mapJunctionType(data.junction_type),

    // AI model fields
    predicted_risk_score:    Number(data.predicted_risk_score) || 0,
    predicted_cause:         data.predicted_cause              || '',
    confidence_score:        Number(data.confidence_score)     || 0,
    suggested_fix:           data.suggested_fix                || '',
    irc_reference:           data.irc_reference                || '',
    is_top_10:               Boolean(data.is_top_10),
    future_trend:            data.future_trend                 ?? null,
    expert_relevance_rating: Number(data.expert_relevance_rating) || 0,

    // raw metadata
    road_class:              data.road_class     || '',
    junction_type:           data.junction_type  || '',
    pcu_per_hour:            Number(data.pcu_per_hour) || 0,
    env_lighting:            data.env_lighting   || '',
    road_surface:            data.road_surface   || '',
    render_priority:         Number(data.render_priority) || 2,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useBlackspots() {
  const [blackspots, setBlackspots] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    const blackspotsRef = ref(rtdb, 'blackspots');

    const unsubscribe = onValue(
      blackspotsRef,
      (snapshot) => {
        const raw = snapshot.val();
        if (!raw) {
          setBlackspots([]);
          setLoading(false);
          return;
        }

        // RTDB returns an object keyed by ID → convert to array
        const docs = Object.entries(raw)
          .map(([key, data]) => normaliseRecord(key, data))
          .sort((a, b) => b.predicted_risk_score - a.predicted_risk_score);

        setBlackspots(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[useBlackspots] RTDB error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { blackspots, loading, error };
}
