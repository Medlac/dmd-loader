import {
  parseXml,
  GtinXml,
  GtinAmppRecord,
  GtinDataRecord,
  ensureArray,
} from "../xml-parser";
import { batchInsert } from "../db";

interface DbGtinRecord extends Record<string, unknown> {
  appid: number;
  gtin: string;
  startdt: string | null;
  enddt: string | null;
}

/**
 * Flatten the nested GTIN structure
 * Each AMPP can have multiple GTINDATA entries
 */
function flattenGtinRecords(amppRecords: GtinAmppRecord[]): DbGtinRecord[] {
  const dbRecords: DbGtinRecord[] = [];

  for (const ampp of amppRecords) {
    const gtinDataList = ensureArray(ampp.GTINDATA);

    for (const gtinData of gtinDataList) {
      dbRecords.push({
        appid: ampp.AMPPID,
        gtin: gtinData.GTIN,
        startdt: gtinData.STARTDT || null,
        enddt: gtinData.ENDDT || null,
      });
    }
  }

  return dbRecords;
}

/**
 * Load GTIN (Global Trade Item Number) data
 */
export async function loadGtin(xmlContent: Buffer | string): Promise<number> {
  console.log("Parsing GTIN XML...");
  const parsed = parseXml<GtinXml>(xmlContent);

  const amppRecords = ensureArray(parsed.GTIN_DETAILS?.AMPPS?.AMPP);

  if (amppRecords.length === 0) {
    console.log("  No GTIN records found");
    return 0;
  }

  console.log(`  Found ${amppRecords.length} AMPPs with GTIN data`);

  // Flatten the nested structure
  const dbRecords = flattenGtinRecords(amppRecords);
  console.log(`  Flattened to ${dbRecords.length} GTIN records`);

  // Insert into database
  console.log("  Inserting GTIN records...");
  const { inserted, errors } = await batchInsert("ampp_gtin", dbRecords);

  if (errors > 0) {
    console.warn(`  ${errors} errors during GTIN insert`);
  }

  console.log(`  Inserted ${inserted} GTIN records`);
  return inserted;
}
