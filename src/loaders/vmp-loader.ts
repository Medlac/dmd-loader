import {
  parseXml,
  VmpXml,
  VmpRecord,
  VpiRecord,
  OntDrugFormRecord,
  DrugFormRecord,
  DrugRouteRecord,
  ControlDrugInfoRecord,
  ensureArray,
} from "../xml-parser";
import { batchInsert } from "../db";

/**
 * Transform VMP XML record to database format
 */
function transformVmp(record: VmpRecord) {
  return {
    vpid: record.VPID,
    vpidprev: record.VPIDPREV || null,
    vpiddt: record.VPIDDT || null,
    vtmid: record.VTMID || null,
    nm: record.NM,
    abbrevnm: record.ABBREVNM || null,
    basiscd: record.BASISCD,
    nmdt: record.NMDT || null,
    nmprev: record.NMPREV || null,
    basis_prevcd: record.BASIS_PREVCD || null,
    nmchangecd: record.NMCHANGECD || null,
    combprodcd: record.COMBPRODCD || null,
    pres_statcd: record.PRES_STATCD,
    sug_f: record.SUG_F || null,
    glu_f: record.GLU_F || null,
    pres_f: record.PRES_F || null,
    cfc_f: record.CFC_F || null,
    non_availcd: record.NON_AVAILCD || null,
    non_availdt: record.NON_AVAILDT || null,
    df_indcd: record.DF_INDCD || null,
    udfs: record.UDFS || null,
    udfs_uomcd: record.UDFS_UOMCD || null,
    unit_dose_uomcd: record.UNIT_DOSE_UOMCD || null,
    invalid: record.INVALID || 0,
  };
}

function transformVpi(record: VpiRecord) {
  return {
    vpid: record.VPID,
    isid: record.ISID,
    basis_strntcd: record.BASIS_STRNTCD || null,
    bs_subid: record.BS_SUBID || null,
    strnt_nmrtr_val: record.STRNT_NMRTR_VAL || null,
    strnt_nmrtr_uomcd: record.STRNT_NMRTR_UOMCD || null,
    strnt_dnmtr_val: record.STRNT_DNMTR_VAL || null,
    strnt_dnmtr_uomcd: record.STRNT_DNMTR_UOMCD || null,
  };
}

function transformOntDrugForm(record: OntDrugFormRecord) {
  return {
    vpid: record.VPID,
    formcd: record.FORMCD,
  };
}

function transformDrugForm(record: DrugFormRecord) {
  return {
    vpid: record.VPID,
    formcd: record.FORMCD,
  };
}

function transformDrugRoute(record: DrugRouteRecord) {
  return {
    vpid: record.VPID,
    routecd: record.ROUTECD,
  };
}

function transformControlDrugInfo(record: ControlDrugInfoRecord) {
  return {
    vpid: record.VPID,
    catcd: record.CATCD,
    catdt: record.CATDT || null,
    cat_prevcd: record.CAT_PREVCD || null,
  };
}

/**
 * Load VMP (Virtual Medicinal Product) data and sub-tables
 */
export async function loadVmp(
  xmlContent: Buffer | string
): Promise<Record<string, number>> {
  console.log("Parsing VMP XML...");
  const parsed = parseXml<VmpXml>(xmlContent);

  const results: Record<string, number> = {};
  const data = parsed.VIRTUAL_MED_PRODUCTS;

  // 1. Load main VMP table
  const vmpRecords = ensureArray(data?.VMPS?.VMP);
  console.log(`  Found ${vmpRecords.length} VMP records`);

  if (vmpRecords.length > 0) {
    const dbRecords = vmpRecords.map(transformVmp);
    const { inserted } = await batchInsert("vmp", dbRecords);
    results.vmp = inserted;
    console.log(`  Inserted ${inserted} VMP records`);
  }

  // 2. Load VMP Ingredients (VPI)
  const vpiRecords = ensureArray(data?.VIRTUAL_PRODUCT_INGREDIENT?.VPI);
  console.log(`  Found ${vpiRecords.length} VPI records`);

  if (vpiRecords.length > 0) {
    const dbRecords = vpiRecords.map(transformVpi);
    const { inserted } = await batchInsert("vmp_ingredient", dbRecords);
    results.vmp_ingredient = inserted;
    console.log(`  Inserted ${inserted} VMP Ingredient records`);
  }

  // 3. Load Ontology Drug Forms
  const ontFormRecords = ensureArray(data?.ONT_DRUG_FORM?.ONT);
  console.log(`  Found ${ontFormRecords.length} ONT Drug Form records`);

  if (ontFormRecords.length > 0) {
    const dbRecords = ontFormRecords.map(transformOntDrugForm);
    const { inserted } = await batchInsert("vmp_ont_drug_form", dbRecords);
    results.vmp_ont_drug_form = inserted;
  }

  // 4. Load Drug Forms
  const formRecords = ensureArray(data?.DRUG_FORM?.DFORM);
  console.log(`  Found ${formRecords.length} Drug Form records`);

  if (formRecords.length > 0) {
    const dbRecords = formRecords.map(transformDrugForm);
    const { inserted } = await batchInsert("vmp_drug_form", dbRecords);
    results.vmp_drug_form = inserted;
  }

  // 5. Load Drug Routes
  const routeRecords = ensureArray(data?.DRUG_ROUTE?.DROUTE);
  console.log(`  Found ${routeRecords.length} Drug Route records`);

  if (routeRecords.length > 0) {
    const dbRecords = routeRecords.map(transformDrugRoute);
    const { inserted } = await batchInsert("vmp_drug_route", dbRecords);
    results.vmp_drug_route = inserted;
  }

  // 6. Load Control Drug Info
  const controlRecords = ensureArray(data?.CONTROL_DRUG_INFO?.CONTROL_INFO);
  console.log(`  Found ${controlRecords.length} Control Drug Info records`);

  if (controlRecords.length > 0) {
    const dbRecords = controlRecords.map(transformControlDrugInfo);
    const { inserted } = await batchInsert("vmp_control_drug_info", dbRecords);
    results.vmp_control_drug_info = inserted;
  }

  return results;
}
