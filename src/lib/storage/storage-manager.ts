import { GoogleDriveStorage } from "./google-drive";

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

  if (!hasGoogleCreds) {
    throw new Error(
      "[DevVerse Storage Fatal] Cloud storage (Google Drive) credentials are strictly required. Local storage fallback is completely disabled. " +
      (rawKey && !isValidPrivateKeyFormat
        ? "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is missing '-----BEGIN PRIVATE KEY-----' header."
        : "Please configure GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, and GOOGLE_DRIVE_ROOT_FOLDER_ID.")
    );
  }

  console.log("[DevVerse Storage] Initializing Google Drive Cloud Storage adapter");
  storageServiceInstance = new GoogleDriveStorage();
  return storageServiceInstance;
}
