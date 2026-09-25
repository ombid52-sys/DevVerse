import { google } from "googleapis";
import { Readable } from "stream";

function getDriveClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

  if (!email || !privateKey) {
    throw new Error("Google Drive service account credentials are not configured");
  }

  // Handle quotes around private key string in .env
  if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
    privateKey = privateKey.slice(1, -1);
  }

  // Handle newlines in private key string whether provided with literal \n or real newlines
  if (privateKey.includes("\\n")) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
    projectId,
  });

  return google.drive({ version: "v3", auth });
}

export class GoogleDriveStorage {
  private rootFolderId: string;

  constructor() {
    this.rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || "";
  }

  // Find or create folder by name inside parent folder
  private async findOrCreateFolder(name: string, parentId?: string): Promise<string> {
    const drive = getDriveClient();
    const queryParts = [
      `name = '${name.replace(/'/g, "\\'")}'`,
      "mimeType = 'application/vnd.google-apps.folder'",
      "trashed = false",
    ];
    if (parentId) {
      queryParts.push(`'${parentId}' in parents`);
    }

    const res = await drive.files.list({
      q: queryParts.join(" and "),
      fields: "files(id, name)",
      spaces: "drive",
    });

    if (res.data.files && res.data.files.length > 0) {
      return res.data.files[0].id!;
    }

    const folderMetadata: any = {
      name,
      mimeType: "application/vnd.google-apps.folder",
    };
    if (parentId) {
      folderMetadata.parents = [parentId];
    }

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: "id",
    });

    return folder.data.id!;
  }

  async ensureAppFolders(appId: string): Promise<{ appFolderId: string; sourceFolderId: string; metadataFolderId: string }> {
    const rootId = this.rootFolderId || (await this.findOrCreateFolder("DevVerse"));
    const appsFolderId = await this.findOrCreateFolder("applications", rootId);
    const appFolderId = await this.findOrCreateFolder(appId, appsFolderId);
    const sourceFolderId = await this.findOrCreateFolder("source", appFolderId);
    const metadataFolderId = await this.findOrCreateFolder("metadata", appFolderId);

    return { appFolderId, sourceFolderId, metadataFolderId };
  }

  async uploadArchive(appId: string, buffer: Buffer, filename: string = "source.zip"): Promise<string> {
    const drive = getDriveClient();
    const { sourceFolderId } = await this.ensureAppFolders(appId);

    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const res = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [sourceFolderId],
        description: `DevVerse source code for application ${appId}`,
      },
      media: {
        mimeType: "application/zip",
        body: stream,
      },
      fields: "id, name, size",
    });

    return res.data.id!;
  }

  async getArchive(fileId: string): Promise<Buffer> {
    const drive = getDriveClient();
    const res = await drive.files.get(
      {
        fileId,
        alt: "media",
      },
      { responseType: "arraybuffer" }
    );

    return Buffer.from(res.data as ArrayBuffer);
  }

  async deleteAppFolder(appId: string): Promise<void> {
    const drive = getDriveClient();
    const rootId = this.rootFolderId || (await this.findOrCreateFolder("DevVerse"));
    const appsFolderId = await this.findOrCreateFolder("applications", rootId);

    const res = await drive.files.list({
      q: `name = '${appId}' and '${appsFolderId}' in parents and trashed = false`,
      fields: "files(id)",
    });

    if (res.data.files && res.data.files.length > 0) {
      for (const file of res.data.files) {
        if (file.id) {
          await drive.files.delete({ fileId: file.id });
        }
      }
    }
  }
}
