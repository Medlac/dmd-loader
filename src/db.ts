import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { config } from "./config";

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(config.supabase.url, config.supabase.serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabase;
}

/**
 * Batch upsert data into a table
 * Uses upsert to handle updates on re-runs
 */
export async function batchUpsert<T extends Record<string, unknown>>(
  tableName: string,
  data: T[],
  conflictColumn: string = "id",
  batchSize: number = config.batchSize
): Promise<{ inserted: number; errors: number }> {
  const client = getSupabaseClient();
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    const { error } = await client
      .from(tableName)
      .upsert(batch, { onConflict: conflictColumn });

    if (error) {
      console.error(
        `Error inserting batch into ${tableName} (rows ${i}-${
          i + batch.length
        }):`,
        error.message
      );
      errors += batch.length;
    } else {
      inserted += batch.length;
    }
  }

  return { inserted, errors };
}

/**
 * Batch insert data into a table (no conflict handling)
 * Faster when you know the data is new
 */
export async function batchInsert<T extends Record<string, unknown>>(
  tableName: string,
  data: T[],
  batchSize: number = config.batchSize
): Promise<{ inserted: number; errors: number }> {
  const client = getSupabaseClient();
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    const { error } = await client.from(tableName).insert(batch);

    if (error) {
      console.error(
        `Error inserting batch into ${tableName} (rows ${i}-${
          i + batch.length
        }):`,
        error.message
      );
      errors += batch.length;
    } else {
      inserted += batch.length;
    }
  }

  return { inserted, errors };
}

/**
 * Clear a table (for full refresh)
 * Uses the primary key column to delete all rows
 */
export async function clearTable(
  tableName: string,
  primaryKeyColumn: string = "id"
): Promise<void> {
  const client = getSupabaseClient();

  console.log(`  Clearing table ${tableName}...`);

  // Use .not(pk, 'is', null) to match all rows - works for any column type
  // Primary keys cannot be null, so this matches everything
  const { error } = await client
    .from(tableName)
    .delete()
    .not(primaryKeyColumn, "is", null);

  if (error) {
    console.warn(`  Could not clear ${tableName}: ${error.message}`);
  } else {
    console.log(`  Cleared ${tableName}`);
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  const client = getSupabaseClient();

  try {
    const { error } = await client.from("vtm").select("vtmid").limit(1);
    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned, which is fine
      throw error;
    }
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
}

/**
 * Log import run to tracking table
 */
export async function logImportStart(
  releaseVersion: string,
  releaseDate: Date
): Promise<number | null> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("dmd_import_log")
    .insert({
      release_version: releaseVersion,
      release_date: releaseDate.toISOString().split("T")[0],
      import_started_at: new Date().toISOString(),
      status: "running",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to log import start:", error);
    return null;
  }

  return data?.id || null;
}

export async function logImportComplete(
  logId: number,
  rowsImported: Record<string, number>
): Promise<void> {
  const client = getSupabaseClient();

  await client
    .from("dmd_import_log")
    .update({
      import_completed_at: new Date().toISOString(),
      status: "completed",
      rows_imported: rowsImported,
    })
    .eq("id", logId);
}

export async function logImportFailed(
  logId: number,
  errorMessage: string
): Promise<void> {
  const client = getSupabaseClient();

  await client
    .from("dmd_import_log")
    .update({
      import_completed_at: new Date().toISOString(),
      status: "failed",
      error_message: errorMessage,
    })
    .eq("id", logId);
}

/**
 * Clear old import logs, keeping only the most recent one
 * Call this before starting a new import to save space
 */
export async function clearOldImportLogs(): Promise<void> {
  const client = getSupabaseClient();

  console.log("Clearing old import logs...");

  // Delete all import logs - the new import will create a fresh log
  const { error } = await client
    .from("dmd_import_log")
    .delete()
    .not("id", "is", null);

  if (error) {
    console.warn(`Could not clear old import logs: ${error.message}`);
  } else {
    console.log("Cleared old import logs");
  }
}

/**
 * Reset all dm+d tables using the dmd_reset() RPC function
 * This uses TRUNCATE CASCADE to properly handle all FK constraints
 * Must be called before loading any data
 */
export async function resetAllTables(): Promise<void> {
  const client = getSupabaseClient();

  console.log("Resetting all dm+d tables...");

  const { error } = await client.rpc("dmd_reset");

  if (error) {
    throw new Error(`Failed to reset tables: ${error.message}`);
  }

  console.log("All dm+d tables reset successfully");
}
