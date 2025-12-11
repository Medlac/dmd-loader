import {
  parseXml,
  IngredientXml,
  IngredientRecord,
  ensureArray,
} from "../xml-parser";
import { batchInsert } from "../db";

/**
 * Transform Ingredient XML record to database format
 */
function transformIngredient(record: IngredientRecord) {
  return {
    isid: record.ISID,
    isidprev: record.ISIDPREV || null,
    isiddt: record.ISIDDT || null,
    nm: record.NM,
    invalid: record.INVALID || 0,
  };
}

/**
 * Load Ingredient data
 */
export async function loadIngredients(
  xmlContent: Buffer | string
): Promise<number> {
  console.log("Parsing Ingredient XML...");
  const parsed = parseXml<IngredientXml>(xmlContent);

  const records = ensureArray(parsed.INGREDIENT_SUBSTANCES?.ING);

  if (records.length === 0) {
    console.log("  No Ingredient records found");
    return 0;
  }

  console.log(`  Found ${records.length} Ingredient records`);

  // Transform records
  const dbRecords = records.map(transformIngredient);

  // Insert into database
  console.log("  Inserting Ingredient records...");
  const { inserted, errors } = await batchInsert("ingredient", dbRecords);

  if (errors > 0) {
    console.warn(`  ${errors} errors during Ingredient insert`);
  }

  console.log(`  Inserted ${inserted} Ingredient records`);
  return inserted;
}
