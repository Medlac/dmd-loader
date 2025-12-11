import {
  parseXml,
  AmppXml,
  AmppRecord,
  PackInfoRecord,
  PrescribInfoRecord,
  PriceInfoRecord,
  ReimbInfoRecord,
  CombContentRecord,
  ensureArray,
} from "../xml-parser";
import { batchInsert } from "../db";

/**
 * Transform AMPP XML record to database format
 */
function transformAmpp(record: AmppRecord) {
  return {
    appid: record.APPID,
    vppid: record.VPPID,
    apid: record.APID,
    nm: record.NM,
    abbrevnm: record.ABBREVNM || null,
    combpackcd: record.COMBPACKCD || null,
    legal_catcd: record.LEGAL_CATCD,
    subp: record.SUBP || null,
    disccd: record.DISCCD || null,
    discdt: record.DISCDT || null,
    invalid: record.INVALID || 0,
  };
}

function transformPackInfo(record: PackInfoRecord) {
  return {
    appid: record.APPID,
    reimb_statcd: record.REIMB_STATCD,
    reimb_statdt: record.REIMB_STATDT || null,
    reimb_statprevcd: record.REIMB_STATPREVCD || null,
    pack_order_no: record.PACK_ORDER_NO || null,
  };
}

function transformPrescribInfo(record: PrescribInfoRecord) {
  return {
    appid: record.APPID,
    sched_2: record.SCHED_2 || null,
    acbs: record.ACBS || null,
    padm: record.PADM || null,
    fp10_mda: record.FP10_MDA || null,
    sched_1: record.SCHED_1 || null,
    hosp: record.HOSP || null,
    nurse_f: record.NURSE_F || null,
    enurse_f: record.ENURSE_F || null,
    dent_f: record.DENT_F || null,
  };
}

function transformPriceInfo(record: PriceInfoRecord) {
  return {
    appid: record.APPID,
    price: record.PRICE || null,
    pricedt: record.PRICEDT || null,
    price_prev: record.PRICE_PREV || null,
    price_basiscd: record.PRICE_BASISCD,
  };
}

function transformReimbInfo(record: ReimbInfoRecord) {
  return {
    appid: record.APPID,
    px_chrgs: record.PX_CHRGS || null,
    disp_fees: record.DISP_FEES || null,
    bb: record.BB || null,
    ltd_stab: record.LTD_STAB || null,
    cal_pack: record.CAL_PACK || null,
    spec_contcd: record.SPEC_CONTCD || null,
    dnd: record.DND || null,
    fp34d: record.FP34D || null,
  };
}

function transformCombContent(record: CombContentRecord) {
  return {
    prntappid: record.PRNTAPPID,
    chldappid: record.CHLDAPPID,
  };
}

/**
 * Load AMPP (Actual Medicinal Product Pack) data and all sub-tables
 */
export async function loadAmpp(
  xmlContent: Buffer | string
): Promise<Record<string, number>> {
  console.log("Parsing AMPP XML...");
  const parsed = parseXml<AmppXml>(xmlContent);

  const results: Record<string, number> = {};
  const data = parsed.ACTUAL_MEDICINAL_PROD_PACKS;

  // 1. Load main AMPP table
  const amppRecords = ensureArray(data?.AMPPS?.AMPP);
  console.log(`  Found ${amppRecords.length} AMPP records`);

  if (amppRecords.length > 0) {
    const dbRecords = amppRecords.map(transformAmpp);
    const { inserted } = await batchInsert("ampp", dbRecords);
    results.ampp = inserted;
    console.log(`  Inserted ${inserted} AMPP records`);
  }

  // 2. Load Pack Info (appliance pack info)
  const packInfoRecords = ensureArray(data?.APPLIANCE_PACK_INFO?.PACK_INFO);
  console.log(`  Found ${packInfoRecords.length} Pack Info records`);

  if (packInfoRecords.length > 0) {
    const dbRecords = packInfoRecords.map(transformPackInfo);
    const { inserted } = await batchInsert("ampp_pack_info", dbRecords);
    results.ampp_pack_info = inserted;
  }

  // 3. Load Prescribing Info
  const prescribInfoRecords = ensureArray(
    data?.DRUG_PRODUCT_PRESCRIB_INFO?.PRESCRIB_INFO
  );
  console.log(`  Found ${prescribInfoRecords.length} Prescribing Info records`);

  if (prescribInfoRecords.length > 0) {
    const dbRecords = prescribInfoRecords.map(transformPrescribInfo);
    const { inserted } = await batchInsert("ampp_prescrib_info", dbRecords);
    results.ampp_prescrib_info = inserted;
  }

  // 4. Load Price Info
  const priceInfoRecords = ensureArray(
    data?.MEDICINAL_PRODUCT_PRICE?.PRICE_INFO
  );
  console.log(`  Found ${priceInfoRecords.length} Price Info records`);

  if (priceInfoRecords.length > 0) {
    const dbRecords = priceInfoRecords.map(transformPriceInfo);
    const { inserted } = await batchInsert("ampp_price_info", dbRecords);
    results.ampp_price_info = inserted;
  }

  // 5. Load Reimbursement Info
  const reimbInfoRecords = ensureArray(data?.REIMBURSEMENT_INFO?.REIMB_INFO);
  console.log(`  Found ${reimbInfoRecords.length} Reimbursement Info records`);

  if (reimbInfoRecords.length > 0) {
    const dbRecords = reimbInfoRecords.map(transformReimbInfo);
    const { inserted } = await batchInsert("ampp_reimb_info", dbRecords);
    results.ampp_reimb_info = inserted;
  }

  // 6. Load Combination Content (parent-child pack relationships)
  const combContentRecords = ensureArray(data?.COMB_CONTENT?.CCONTENT);
  console.log(
    `  Found ${combContentRecords.length} Combination Content records`
  );

  if (combContentRecords.length > 0) {
    const dbRecords = combContentRecords.map(transformCombContent);
    const { inserted } = await batchInsert("ampp_comb_content", dbRecords);
    results.ampp_comb_content = inserted;
  }

  return results;
}
