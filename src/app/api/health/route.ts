import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbStatus = "unknown";
  try {
    const db = await getDb();
    if ("command" in db) {
      await (db as any).command({ ping: 1 });
      dbStatus = "connected";
    } else {
      dbStatus = "in-memory-fallback";
    }
  } catch (err: any) {
    dbStatus = `error: ${err.message}`;
  }

  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "";
  const isValidKey = rawKey.includes("BEGIN PRIVATE KEY");
  const storageType =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && isValidKey && process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
      ? "google-drive"
      : "local-ephemeral";

  return NextResponse.json({
    status: dbStatus === "connected" ? "healthy" : "degraded",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    service: "DevVerse Platform",
    database: {
      type: "MongoDB Atlas",
      status: dbStatus,
    },
    storage: {
      provider: storageType,
      isPersistent: storageType === "google-drive",
      configured: Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID),
      privateKeyStatus: isValidKey ? "valid_rsa_pem" : rawKey ? "invalid_format_key_id" : "missing",
    },
    email: {
      provider: process.env.EMAIL_PROVIDER || "development",
    },
  });
}
