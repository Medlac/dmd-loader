import { parseXml, VtmXml, VtmRecord, ensureArray } from "../xml-parser";
import { batchInsert } from "../db";

/**
 * Transform VTM XML record to database format
 */
function transformVtm(record: VtmRecord) {
  return {
    vtmid: record.VTMID,
    vtmidprev: record.VTMIDPREV || null,
    vtmiddt: record.VTMIDDT || null,
    nm: record.NM,
    abbrevnm: record.ABBREVNM || null,
    invalid: record.INVALID || 0,
  };
}

/**
 * Load VTM (Virtual Therapeutic Moiety) data
 */
export async function loadVtm(xmlContent: Buffer | string): Promise<number> {
  console.log("Parsing VTM XML...");
  const parsed = parseXml<VtmXml>(xmlContent);

  const vtmRecords = ensureArray(parsed.VIRTUAL_THERAPEUTIC_MOIETIES?.VTM);

  if (vtmRecords.length === 0) {
    console.log("  No VTM records found");
    return 0;
  }

  console.log(`  Found ${vtmRecords.length} VTM records`);

  // Transform records
  const dbRecords = vtmRecords.map(transformVtm);

  // Insert into database
  console.log("  Inserting VTM records...");
  const { inserted, errors } = await batchInsert("vtm", dbRecords);

  if (errors > 0) {
    console.warn(`  ${errors} errors during VTM insert`);
  }

  console.log(`  Inserted ${inserted} VTM records`);
  return inserted;
}
