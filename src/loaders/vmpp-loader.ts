import { parseXml, VmppXml, VmppRecord, ensureArray } from "../xml-parser";
import { batchInsert } from "../db";

/**
 * Transform VMPP XML record to database format
 */
function transformVmpp(record: VmppRecord) {
  return {
    vppid: record.VPPID,
    vpid: record.VPID,
    nm: record.NM,
    qtyval: record.QTYVAL || null,
    qty_uomcd: record.QTY_UOMCD || null,
    combpackcd: record.COMBPACKCD || null,
    invalid: record.INVALID || 0,
  };
}

/**
 * Load VMPP (Virtual Medicinal Product Pack) data
 */
export async function loadVmpp(xmlContent: Buffer | string): Promise<number> {
  console.log("Parsing VMPP XML...");
  const parsed = parseXml<VmppXml>(xmlContent);

  const records = ensureArray(parsed.VIRTUAL_MED_PRODUCT_PACK?.VMPPS?.VMPP);

  if (records.length === 0) {
    console.log("  No VMPP records found");
    return 0;
  }

  console.log(`  Found ${records.length} VMPP records`);

  // Transform records
  const dbRecords = records.map(transformVmpp);

  // Insert into database
  console.log("  Inserting VMPP records...");
  const { inserted, errors } = await batchInsert("vmpp", dbRecords);

  if (errors > 0) {
    console.warn(`  ${errors} errors during VMPP insert`);
  }

  console.log(`  Inserted ${inserted} VMPP records`);
  return inserted;
}
