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
  } else if (process.env.NODE_ENV === "production") {
    console.error(
      "[DevVerse Storage Fatal] Local storage is disabled in production. Cloud storage (Google Drive) credentials are missing or invalid."
    );
    throw new Error(
      "[DevVerse Storage Fatal] Local storage is completely disabled in production. Cloud storage (Google Drive) credentials are required. " +
      (rawKey && !isValidPrivateKeyFormat
        ? "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY contains a key ID rather than the full RSA private key (must begin with '-----BEGIN PRIVATE KEY-----')."
        : "Please configure GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, and GOOGLE_DRIVE_ROOT_FOLDER_ID.")
    );
  } else {
    if (rawKey && !isValidPrivateKeyFormat) {
      console.warn(
        "[DevVerse Storage] Warning: GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is set but does not contain '-----BEGIN PRIVATE KEY-----'. Using Local Storage adapter for local environment."
      );
    } else {
      console.log("[DevVerse Storage] Local/test environment. Using Local Storage adapter.");
    }
    storageServiceInstance = new LocalStorage();
  }

  return storageServiceInstance;
}
