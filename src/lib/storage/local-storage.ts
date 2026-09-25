import fs from "fs/promises";
import path from "path";

export class LocalStorage {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), ".storage", "drive");
  }

  private async ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  private extractAppId(fileIdOrAppId: string): string {
    let clean = fileIdOrAppId;
    if (clean.startsWith("local-")) {
      clean = clean.replace(/^local-/, "");
    }
    // If format was local-<appId>-<filename>, split out the appId
    if (clean.includes("-")) {
      clean = clean.split("-")[0];
    }
    return clean;
  }

  async uploadArchive(appId: string, buffer: Buffer, filename: string = "source.zip"): Promise<string> {
    const cleanAppId = this.extractAppId(appId);
    const appDir = path.join(this.baseDir, "applications", cleanAppId, "source");
    await this.ensureDir(appDir);
    const filePath = path.join(appDir, filename);
    await fs.writeFile(filePath, buffer);
    return `local-${cleanAppId}`;
  }

  async getArchive(fileIdOrAppId: string, filename: string = "source.zip"): Promise<Buffer> {
    const cleanAppId = this.extractAppId(fileIdOrAppId);
    const sourceDir = path.join(this.baseDir, "applications", cleanAppId, "source");
    const filePath = path.join(sourceDir, filename);

    try {
      return await fs.readFile(filePath);
    } catch {
      // If filename doesn't match exact target, read first file in directory
      const files = await fs.readdir(sourceDir);
      if (files.length > 0) {
        return await fs.readFile(path.join(sourceDir, files[0]));
      }
      throw new Error(`Source archive not found for application ${cleanAppId}`);
    }
  }

  async deleteAppFolder(appId: string): Promise<void> {
    const cleanAppId = this.extractAppId(appId);
    const appDir = path.join(this.baseDir, "applications", cleanAppId);
    try {
      await fs.rm(appDir, { recursive: true, force: true });
    } catch {
      // Ignore if doesn't exist
    }
  }
}
