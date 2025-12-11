import {
  parseXml,
  AmpXml,
  AmpRecord,
  ApIngredientRecord,
  LicRouteRecord,
  ApInfoRecord,
  ensureArray,
} from "../xml-parser";
import { batchInsert } from "../db";

/**
 * Transform AMP XML record to database format
 */
function transformAmp(record: AmpRecord) {
  return {
    apid: record.APID,
    vpid: record.VPID,
    nm: record.NM,
    abbrevnm: record.ABBREVNM || null,
    desc: record.DESC, // Note: will be quoted in SQL as "desc"
    nmdt: record.NMDT || null,
    nm_prev: record.NM_PREV || null,
    suppcd: record.SUPPCD || null,
    lic_authcd: record.LIC_AUTHCD,
    lic_auth_prevcd: record.LIC_AUTH_PREVCD || null,
    lic_authchangecd: record.LIC_AUTHCHANGECD || null,
    lic_authchangedt: record.LIC_AUTHCHANGEDT || null,
    combprodcd: record.COMBPRODCD || null,
    flavourcd: record.FLAVOURCD || null,
    ema: record.EMA || null,
    parallel_import: record.PARALLEL_IMPORT || null,
    avail_restrictcd: record.AVAIL_RESTRICTCD,
    invalid: record.INVALID || 0,
  };
}

function transformApIngredient(record: ApIngredientRecord) {
  return {
    apid: record.APID,
    isid: record.ISID,
    strnth: record.STRNTH || null,
    uomcd: record.UOMCD || null,
  };
}

function transformLicRoute(record: LicRouteRecord) {
  return {
    apid: record.APID,
    routecd: record.ROUTECD,
  };
}

function transformApInfo(record: ApInfoRecord) {
  return {
    apid: record.APID,
    sz_weight: record.SZ_WEIGHT || null,
    colourcd: record.COLOURCD || null,
    prod_order_no: record.PROD_ORDER_NO || null,
  };
}

/**
 * Load AMP (Actual Medicinal Product) data and sub-tables
 */
export async function loadAmp(
  xmlContent: Buffer | string
): Promise<Record<string, number>> {
  console.log("Parsing AMP XML...");
  const parsed = parseXml<AmpXml>(xmlContent);

  const results: Record<string, number> = {};
  const data = parsed.ACTUAL_MEDICINAL_PRODUCTS;

  // 1. Load main AMP table
  const ampRecords = ensureArray(data?.AMPS?.AMP);
  console.log(`  Found ${ampRecords.length} AMP records`);

  if (ampRecords.length > 0) {
    const dbRecords = ampRecords.map(transformAmp);
    const { inserted } = await batchInsert("amp", dbRecords);
    results.amp = inserted;
    console.log(`  Inserted ${inserted} AMP records`);
  }

  // 2. Load AMP Ingredients
  const apIngRecords = ensureArray(data?.AP_INGREDIENT?.AP_ING);
  console.log(`  Found ${apIngRecords.length} AP Ingredient records`);

  if (apIngRecords.length > 0) {
    const dbRecords = apIngRecords.map(transformApIngredient);
    const { inserted } = await batchInsert("amp_ingredient", dbRecords);
    results.amp_ingredient = inserted;
    console.log(`  Inserted ${inserted} AMP Ingredient records`);
  }

  // 3. Load Licensed Routes
  const licRouteRecords = ensureArray(data?.LICENSED_ROUTE?.LIC_ROUTE);
  console.log(`  Found ${licRouteRecords.length} Licensed Route records`);

  if (licRouteRecords.length > 0) {
    const dbRecords = licRouteRecords.map(transformLicRoute);
    const { inserted } = await batchInsert("amp_licensed_route", dbRecords);
    results.amp_licensed_route = inserted;
    console.log(`  Inserted ${inserted} Licensed Route records`);
  }

  // 4. Load AP Information (appliance info)
  const apInfoRecords = ensureArray(data?.AP_INFORMATION?.AP_INFO);
  console.log(`  Found ${apInfoRecords.length} AP Info records`);

  if (apInfoRecords.length > 0) {
    const dbRecords = apInfoRecords.map(transformApInfo);
    const { inserted } = await batchInsert("amp_info", dbRecords);
    results.amp_info = inserted;
    console.log(`  Inserted ${inserted} AP Info records`);
  }

  return results;
}
