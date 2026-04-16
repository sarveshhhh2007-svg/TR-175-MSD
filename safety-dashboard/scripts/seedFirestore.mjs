/**
 * seedFirestore.mjs
 * One-time script: reads trichy_50.json and writes all 50 records
 * into the Firestore `blackspots` collection via the REST API.
 *
 * Usage (from the safety-dashboard directory):
 *   node scripts/seedFirestore.mjs
 *
 * No credentials required while Firestore rules allow open reads/writes.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'ai-safety-dashboard';
const COLLECTION  = 'blackspots';
const BASE_URL    = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}`;

// ── Load JSON ──────────────────────────────────────────────────────────────
const dataPath = join(__dirname, '..', 'src', 'data', 'trichy_50.json');
console.log(`📂 Reading: ${dataPath}`);
const records = JSON.parse(readFileSync(dataPath, 'utf-8'));
console.log(`✅ Loaded ${records.length} records.\n`);

// ── Firestore value helpers ────────────────────────────────────────────────
const str  = (v) => ({ stringValue:  String(v ?? '') });
const num  = (v) => ({ doubleValue:  Number(v  ?? 0)  });
const int  = (v) => ({ integerValue: String(Math.floor(Number(v ?? 0))) });
const bool = (v) => ({ booleanValue: Boolean(v) });

function toFirestoreFields(r) {
  return {
    id:                      str(r.id),
    location_name:           str(r.location_name),
    lat:                     num(r.lat),
    lng:                     num(r.lng),
    historical_accidents:    int(r.historical_accidents),
    road_class:              str(r.road_class),
    junction_type:           str(r.junction_type),
    pcu_per_hour:            int(r.pcu_per_hour),
    env_lighting:            str(r.env_lighting),
    road_surface:            str(r.road_surface),
    predicted_risk_score:    num(r.predicted_risk_score),
    predicted_cause:         str(r.predicted_cause),
    actual_historical_cause: str(r.actual_historical_cause),
    is_held_out:             bool(r.is_held_out),
    confidence_score:        num(r.confidence_score),
    is_top_10:               bool(r.is_top_10),
    suggested_fix:           str(r.suggested_fix),
    irc_reference:           str(r.irc_reference),
    expert_relevance_rating: num(r.expert_relevance_rating),
    last_audited:            str(r.last_audited),
    future_trend:            str(r.future_trend),
    render_priority:         int(r.render_priority),
  };
}

// ── Upload ─────────────────────────────────────────────────────────────────
async function seed() {
  let success = 0, failed = 0;

  for (const record of records) {
    const docId = String(record.id);
    const url   = `${BASE_URL}/${docId}`;

    const body = JSON.stringify({ fields: toFirestoreFields(record) });

    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (!res.ok) {
        const err = await res.json();
        console.error(`❌ Failed [${docId}]: ${err?.error?.message ?? res.statusText}`);
        failed++;
      } else {
        console.log(`✅ [${docId}] ${record.location_name} (risk: ${record.predicted_risk_score})`);
        success++;
      }
    } catch (e) {
      console.error(`❌ Network error [${docId}]:`, e.message);
      failed++;
    }
  }

  console.log(`\n──────────────────────────────────────────`);
  console.log(`🏁 Seed complete!  ✅ ${success} uploaded  ❌ ${failed} failed`);
  console.log(`──────────────────────────────────────────\n`);
  process.exit(failed > 0 ? 1 : 0);
}

seed();
