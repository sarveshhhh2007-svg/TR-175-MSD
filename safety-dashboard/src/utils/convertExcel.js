import fs from 'fs';
import * as xlsx from 'xlsx';

try {
  const fileBuffer = fs.readFileSync('../trichy_original_50_with_srm.xlsx');
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const records = xlsx.utils.sheet_to_json(sheet);

  fs.writeFileSync('./src/data/trichy_50.json', JSON.stringify(records, null, 2));
  console.log('✅ Successfully converted Excel to JSON!');
} catch (e) {
  console.error(e);
}
