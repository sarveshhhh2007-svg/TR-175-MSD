import fs from 'fs';
import * as xlsx from 'xlsx';

async function uploadData() {
  const filePath = '../trichy_original_50_with_srm.xlsx';
  console.log(`Loading Excel file from: ${filePath}`);

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Parse XLSX to JSON
    const records = xlsx.utils.sheet_to_json(sheet);
    console.log(`Found ${records.length} records. Beginning Google Firestore REST upload...`);

    let count = 0;
    for (const record of records) {
      const docId = String(record.id || count);
      const url = `https://firestore.googleapis.com/v1/projects/ai-safety-dashboard/databases/(default)/documents/blackspots/${docId}`;
      
      const payload = {
        fields: {
          id: { stringValue: String(record.id || count) },
          location_name: { stringValue: String(record.location_name || 'Unknown Location') },
          lat: { doubleValue: Number(record.lat || 0) },
          lng: { doubleValue: Number(record.lng || 0) },
          historical_accidents: { integerValue: String(Math.floor(Number(record.historical_accidents) || 0)) },
          road_class: { stringValue: String(record.road_class || '') },
          junction_type: { stringValue: String(record.junction_type || '') },
          pcu_per_hour: { integerValue: String(Math.floor(Number(record.pcu_per_hour) || 0)) },
          env_lighting: { stringValue: String(record.env_lighting || '') },
          road_surface: { stringValue: String(record.road_surface || '') },
          predicted_risk_score: { doubleValue: Number(record.predicted_risk_score || 0) },
          predicted_cause: { stringValue: String(record.predicted_cause || '') },
          actual_historical_cause: { stringValue: String(record.actual_historical_cause || '') },
          is_held_out: { booleanValue: Boolean(record.is_held_out || false) },
          confidence_score: { doubleValue: Number(record.confidence_score || 0) },
          is_top_10: { booleanValue: Boolean(record.is_top_10 || false) },
          suggested_fix: { stringValue: String(record.suggested_fix || '') },
          irc_reference: { stringValue: String(record.irc_reference || '') },
          expert_relevance_rating: { doubleValue: Number(record.expert_relevance_rating || 0) },
          last_audited: { stringValue: String(record.last_audited || '') },
          future_trend: { stringValue: String(record.future_trend || '') },
          render_priority: { integerValue: String(Math.floor(Number(record.render_priority) || 0)) }
        }
      };

      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const err = await res.json();
        console.error(`Failed to upload ${docId}:`, err.error.message);
      } else {
        console.log(`Uploaded Doc -> Location: ${record.location_name} | Risk: ${record.predicted_risk_score}`);
        count++;
      }
    }

    console.log(`\n✅ Migration Complete! Uploaded ${count} locations securely to Firebase REST!`);
    process.exit(0);

  } catch (error) {
    console.error("❌ Migration failed!", error);
    process.exit(1);
  }
}

// Initiate Script
uploadData();
