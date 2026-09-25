import { GoogleDriveStorage } from "./google-drive";
import { LocalStorage } from "./local-storage";

export interface IStorageService {
  uploadArchive(appId: string, buffer: Buffer, filename?: string): Promise<string>;
  getArchive(fileIdOrAppId: string, filename?: string): Promise<Buffer>;
  deleteAppFolder(appId: string): Promise<void>;
}

let storageServiceInstance: IStorageService | null = null;

export function getStorageService(): IStorageService {
  if (storageServiceInstance) {
    return storageServiceInstance;
  }

  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "";
  const isValidPrivateKeyFormat = rawKey.includes("BEGIN PRIVATE KEY");

  const hasGoogleCreds =
    Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) &&
    isValidPrivateKeyFormat &&
    Boolean(process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID);

  if (hasGoogleCreds) {
    console.log("[DevVerse Storage] Initializing Google Drive Storage adapter");
    storageServiceInstance = new GoogleDriveStorage();
  } else {
    if (rawKey && !isValidPrivateKeyFormat) {
      console.warn("[DevVerse Storage] Warning: GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is set but does not contain '-----BEGIN PRIVATE KEY-----'. It appears to be a private_key_id or malformed string. Falling back to Local Storage adapter.");
    } else {
      console.log("[DevVerse Storage] Google Drive credentials not provided. Using Local Storage adapter.");
    }
    storageServiceInstance = new LocalStorage();
  }

  return storageServiceInstance;
}
