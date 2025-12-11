import * as fs from "fs";
import * as path from "path";
import { config, validateConfig } from "./config";
import {
  testConnection,
  logImportStart,
  logImportComplete,
  logImportFailed,
  clearOldImportLogs,
  resetAllTables,
} from "./db";
import {
  getLatestRelease,
  streamAndProcess,
  findXmlFiles,
} from "./trud-client";
import { getFileType } from "./xml-parser";
import {
  loadLookups,
  loadVtm,
  loadIngredients,
  loadVmp,
  loadVmpp,
  loadAmp,
  loadAmpp,
  loadGtin,
} from "./loaders";

interface LoadResult {
  [table: string]: number;
}

/**
 * Main loader function - streams from TRUD and loads all data (no local storage)
 */
async function runLoad(): Promise<void> {
  console.log("=".repeat(60));
  console.log("NHS dm+d Data Loader");
  console.log("=".repeat(60));

  // Validate configuration
  validateConfig();
  console.log("Configuration validated");

  // Test database connection
  console.log("Testing database connection...");
  const connected = await testConnection();
  if (!connected) {
    throw new Error("Failed to connect to database");
  }
  console.log("Database connection successful");

  // Get latest release from TRUD
  const release = await getLatestRelease();

  // Clear old import logs (we only keep the latest one)
  await clearOldImportLogs();

  // Reset all tables using TRUNCATE CASCADE
  await resetAllTables();

  // Log import start
  const logId = await logImportStart(
    release.name,
    new Date(release.releaseDate)
  );

  try {
    const results: LoadResult = {};

    // Stream and collect files in memory
    const fileContents: Record<string, Buffer> = {};

    await streamAndProcess(release, async (filename, content) => {
      const fileType = getFileType(filename);
      if (fileType) {
        fileContents[fileType] = content;
      }
    });

    // Process in dependency order (gtin must come after ampp)
    const loadOrder = [
      "lookup",
      "ingredient",
      "vtm",
      "vmp",
      "vmpp",
      "amp",
      "ampp",
      "gtin",
    ];

    for (const fileType of loadOrder) {
      const content = fileContents[fileType];
      if (!content) {
        console.log(`\n⚠ No ${fileType} file found, skipping`);
        continue;
      }

      console.log(`\n${"─".repeat(50)}`);
      console.log(`Processing: ${fileType}`);
      console.log("─".repeat(50));

      switch (fileType) {
        case "lookup":
          Object.assign(results, await loadLookups(content));
          break;
        case "ingredient":
          results.ingredient = await loadIngredients(content);
          break;
        case "vtm":
          results.vtm = await loadVtm(content);
          break;
        case "vmp":
          Object.assign(results, await loadVmp(content));
          break;
        case "vmpp":
          results.vmpp = await loadVmpp(content);
          break;
        case "amp":
          Object.assign(results, await loadAmp(content));
          break;
        case "ampp":
          Object.assign(results, await loadAmpp(content));
          break;
        case "gtin":
          results.ampp_gtin = await loadGtin(content);
          break;
      }
    }

    // Log completion
    if (logId) {
      await logImportComplete(logId, results);
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("IMPORT COMPLETE");
    console.log("=".repeat(60));
    printResults(results);
  } catch (error) {
    if (logId) {
      await logImportFailed(
        logId,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
    throw error;
  }
}

/**
 * Load from a local directory (useful for testing with existing files)
 */
async function loadFromDirectory(directory: string): Promise<LoadResult> {
  console.log(`\nLoading from directory: ${directory}`);

  const results: LoadResult = {};
  const xmlFiles = findXmlFiles(directory);

  console.log(`Found ${xmlFiles.length} XML files`);

  // Organize files by type
  const filesByType: Record<string, string> = {};
  for (const filePath of xmlFiles) {
    const filename = path.basename(filePath);
    const fileType = getFileType(filename);
    if (fileType) {
      filesByType[fileType] = filePath;
    }
  }

  // Load in dependency order (gtin must come after ampp)
  const loadOrder = [
    "lookup",
    "ingredient",
    "vtm",
    "vmp",
    "vmpp",
    "amp",
    "ampp",
    "gtin",
  ];

  for (const fileType of loadOrder) {
    const filePath = filesByType[fileType];
    if (!filePath) {
      console.log(`\n⚠ No ${fileType} file found, skipping`);
      continue;
    }

    console.log(`\n${"─".repeat(50)}`);
    console.log(`Loading: ${path.basename(filePath)}`);
    console.log("─".repeat(50));

    const content = fs.readFileSync(filePath);

    switch (fileType) {
      case "lookup":
        const lookupResults = await loadLookups(content);
        Object.assign(results, lookupResults);
        break;

      case "ingredient":
        results.ingredient = await loadIngredients(content);
        break;

      case "vtm":
        results.vtm = await loadVtm(content);
        break;

      case "vmp":
        const vmpResults = await loadVmp(content);
        Object.assign(results, vmpResults);
        break;

      case "vmpp":
        results.vmpp = await loadVmpp(content);
        break;

      case "amp":
        const ampResults = await loadAmp(content);
        Object.assign(results, ampResults);
        break;

      case "ampp":
        const amppResults = await loadAmpp(content);
        Object.assign(results, amppResults);
        break;

      case "gtin":
        results.ampp_gtin = await loadGtin(content);
        break;
    }
  }

  return results;
}

/**
 * Load from local files (for testing without TRUD)
 */
async function runLocalLoad(directory: string): Promise<void> {
  console.log("=".repeat(60));
  console.log("NHS dm+d Data Loader (Local Mode)");
  console.log("=".repeat(60));

  validateConfig();

  const connected = await testConnection();
  if (!connected) {
    throw new Error("Failed to connect to database");
  }

  // Clear old import logs (we only keep the latest one)
  await clearOldImportLogs();

  // Reset all tables using TRUNCATE CASCADE
  await resetAllTables();

  const results = await loadFromDirectory(directory);

  console.log("\n" + "=".repeat(60));
  console.log("IMPORT COMPLETE");
  console.log("=".repeat(60));
  printResults(results);
}

/**
 * Print results summary
 */
function printResults(results: LoadResult): void {
  console.log("\nRows loaded per table:");

  let total = 0;
  for (const [table, count] of Object.entries(results).sort()) {
    console.log(`  ${table}: ${count.toLocaleString()}`);
    total += count;
  }

  console.log("─".repeat(30));
  console.log(`  Total: ${total.toLocaleString()} rows`);
}

/**
 * CLI Entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  try {
    if (args.includes("--test")) {
      // Just test connection
      console.log("Testing database connection...");
      validateConfig();
      const connected = await testConnection();
      console.log(
        connected ? "✓ Connection successful" : "✗ Connection failed"
      );
      process.exit(connected ? 0 : 1);
    }

    if (args.includes("--local")) {
      // Load from local directory (for testing)
      const dirIndex = args.indexOf("--local");
      const directory = args[dirIndex + 1] || process.cwd();
      await runLocalLoad(directory);
    } else {
      // Default: stream from TRUD (no local storage)
      await runLoad();
    }

    console.log("\n✓ Done!");
    process.exit(0);
  } catch (error) {
    console.error("\n✗ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run if executed directly
main();
