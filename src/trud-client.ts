import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import * as unzipper from "unzipper";
import { config } from "./config";

interface TrudRelease {
  id: string;
  name: string;
  releaseDate: string;
  archiveFileUrl: string;
  archiveFileSizeBytes: number;
  archiveFileName: string;
}

interface TrudReleaseResponse {
  releases: TrudRelease[];
}

/**
 * Get the latest dm+d release info from TRUD API
 */
export async function getLatestRelease(): Promise<TrudRelease> {
  const url = `${config.trud.baseUrl}/keys/${config.trud.apiKey}/items/${config.trud.itemId}/releases?latest`;

  console.log("Fetching latest release info from TRUD...");

  const response = await axios.get<TrudReleaseResponse>(url);

  if (!response.data.releases || response.data.releases.length === 0) {
    throw new Error("No releases found from TRUD API");
  }

  const release = response.data.releases[0];
  console.log(`Latest release: ${release.name} (${release.releaseDate})`);
  console.log(
    `Archive size: ${(release.archiveFileSizeBytes / 1024 / 1024).toFixed(
      2
    )} MB`
  );

  return release;
}

/**
 * Stream download and process without saving to disk
 */
export async function streamAndProcess(
  release: TrudRelease,
  onXmlFile: (filename: string, content: Buffer) => Promise<void>
): Promise<void> {
  console.log(`Streaming dm+d archive from ${release.archiveFileUrl}...`);

  const response = await axios({
    url: release.archiveFileUrl,
    method: "GET",
    responseType: "stream",
  });

  // Collect zip buffers
  let innerZipBuffer: Buffer | null = null;
  let gtinZipBuffer: Buffer | null = null;

  await new Promise<void>((resolve, reject) => {
    response.data
      .pipe(unzipper.Parse())
      .on("entry", async (entry: unzipper.Entry) => {
        const fileName = entry.path;

        if (entry.type === "File" && fileName.endsWith(".zip")) {
          const isGtin = fileName.toUpperCase().includes("GTIN");
          console.log(
            `Found ${isGtin ? "GTIN" : "inner"} archive: ${fileName}`
          );
          if (isGtin) {
            gtinZipBuffer = await entry.buffer();
          } else {
            innerZipBuffer = await entry.buffer();
          }
        } else if (entry.type === "File" && fileName.endsWith(".xml")) {
          // Direct XML in outer zip
          const content = await entry.buffer();
          await onXmlFile(path.basename(fileName), content);
        } else {
          entry.autodrain();
        }
      })
      .on("close", resolve)
      .on("error", reject);
  });

  // Process inner zip
  if (innerZipBuffer) {
    console.log("Processing inner archive...");

    const directory = await unzipper.Open.buffer(innerZipBuffer);

    for (const file of directory.files) {
      if (file.path.endsWith(".xml")) {
        console.log(`  Processing: ${path.basename(file.path)}`);
        const content = await file.buffer();
        await onXmlFile(path.basename(file.path), content);
      }
    }
  }

  // Process GTIN zip
  if (gtinZipBuffer) {
    console.log("Processing GTIN archive...");

    const directory = await unzipper.Open.buffer(gtinZipBuffer);

    for (const file of directory.files) {
      if (file.path.endsWith(".xml")) {
        console.log(`  Processing: ${path.basename(file.path)}`);
        const content = await file.buffer();
        await onXmlFile(path.basename(file.path), content);
      }
    }
  }

  console.log("Stream processing complete");
}

/**
 * Find XML files in a directory
 */
export function findXmlFiles(directory: string): string[] {
  const files = fs.readdirSync(directory);
  return files
    .filter((f) => f.endsWith(".xml"))
    .map((f) => path.join(directory, f));
}
