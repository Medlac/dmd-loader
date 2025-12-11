import {
  parseXml,
  LookupXml,
  LookupInfoRecord,
  ensureArray,
} from "../xml-parser";
import { batchInsert } from "../db";

// Mapping of lookup XML keys to database table names
const lookupTableMap: Record<string, string> = {
  COMBINATION_PACK_IND: "lookup_combination_pack_ind",
  COMBINATION_PROD_IND: "lookup_combination_prod_ind",
  BASIS_OF_NAME: "lookup_basis_of_name",
  NAMECHANGE_REASON: "lookup_namechange_reason",
  VIRTUAL_PRODUCT_PRES_STATUS: "lookup_virtual_product_pres_status",
  CONTROL_DRUG_CATEGORY: "lookup_control_drug_category",
  LICENSING_AUTHORITY: "lookup_licensing_authority",
  UNIT_OF_MEASURE: "lookup_unit_of_measure",
  FORM: "lookup_form",
  ROUTE: "lookup_route",
  SUPPLIER: "lookup_supplier",
  AVAILABILITY_RESTRICTION: "lookup_availability_restriction",
  LEGAL_CATEGORY: "lookup_legal_category",
  DISCONTINUED_IND: "lookup_discontinued_ind",
  DF_INDICATOR: "lookup_df_indicator",
  REIMBURSEMENT_STATUS: "lookup_reimbursement_status",
  PRICE_BASIS: "lookup_price_basis",
  SPECIAL_CONTAINER: "lookup_special_container",
  FLAVOUR: "lookup_flavour",
  COLOUR: "lookup_colour",
  BASIS_OF_STRNTH: "lookup_basis_of_strength",
  DND: "lookup_dnd",
  SPEC_CONT: "lookup_special_container",
  ONT_FORM_ROUTE: "lookup_ont_form_route",
  VIRTUAL_PRODUCT_NON_AVAIL: "lookup_non_avail_reason",
};

/**
 * Load all lookup tables from f_lookup XML
 */
export async function loadLookups(
  xmlContent: Buffer | string
): Promise<Record<string, number>> {
  console.log("Parsing lookup XML...");
  const parsed = parseXml<LookupXml>(xmlContent);

  const results: Record<string, number> = {};
  const lookup = parsed.LOOKUP;

  for (const [xmlKey, tableData] of Object.entries(lookup)) {
    const tableName = lookupTableMap[xmlKey];

    if (!tableName) {
      console.log(`  Skipping unknown lookup: ${xmlKey}`);
      continue;
    }

    const records = ensureArray(
      (tableData as { INFO: LookupInfoRecord[] })?.INFO
    );

    if (records.length === 0) {
      console.log(`  ${xmlKey}: No records`);
      continue;
    }

    // Transform to database format
    const dbRecords = records.map((r: LookupInfoRecord) => {
      // Handle different table structures
      if (
        tableName === "lookup_unit_of_measure" ||
        tableName === "lookup_form" ||
        tableName === "lookup_route" ||
        tableName === "lookup_supplier" ||
        tableName === "lookup_flavour" ||
        tableName === "lookup_colour" ||
        tableName === "lookup_ont_form_route"
      ) {
        return {
          cd: String(r.CD),
          cddt: r.CDDT || null,
          cdprev: r.CDPREV ? String(r.CDPREV) : null,
          description: r.DESC,
          ...(r.INVALID !== undefined && { invalid: r.INVALID }),
        };
      }

      // Simple lookups with string codes
      return {
        cd: String(r.CD),
        description: r.DESC,
      };
    });

    console.log(`  Loading ${tableName}: ${dbRecords.length} records`);

    const { inserted, errors } = await batchInsert(tableName, dbRecords);
    results[tableName] = inserted;

    if (errors > 0) {
      console.warn(`    ${errors} errors during insert`);
    }
  }

  return results;
}
