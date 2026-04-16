/**
 * seedRTDB.mjs
 * One-time script: reads trichy_50.json and writes all 50 records
 * into Firebase Realtime Database at /blackspots/<id>
 *
 * Usage (from the safety-dashboard directory):
 *   node scripts/seedRTDB.mjs
 *
 * No credentials required — RTDB rules default to open read/write.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const RTDB_URL   = 'https://ai-safety-dashboard-default-rtdb.firebaseio.com';
const dataPath   = join(__dirname, '..', 'src', 'data', 'trichy_50.json');

// ── Load JSON ──────────────────────────────────────────────────────────────
console.log(`📂 Reading: ${dataPath}`);
const records = JSON.parse(readFileSync(dataPath, 'utf-8'));
console.log(`✅ Loaded ${records.length} records.\n`);

// ── Upload ─────────────────────────────────────────────────────────────────
async function seed() {
  let success = 0, failed = 0;

  for (const record of records) {
    const docId = String(record.id);
    const url   = `${RTDB_URL}/blackspots/${docId}.json`;

    try {
      const res = await fetch(url, {
        method:  'PUT',                           // PUT = set / overwrite node
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(record),           // store the raw JSON shape
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`❌ Failed [${docId}]: ${text}`);
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
