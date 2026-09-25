import { describe, it, expect } from "vitest";
import { adminInitSchema, updateUserStatusSchema } from "@/lib/validations/admin";
import { logActivity } from "@/lib/audit";

describe("Admin Governance & Audit System", () => {
  it("validates administrator initialization schema with strict password requirements", () => {
    const valid = adminInitSchema.safeParse({
      email: "owner@devverse.io",
      username: "superadmin",
      displayName: "Platform Owner",
      password: "SuperSecretPassword123!",
    });
    expect(valid.success).toBe(true);

    // Password without special character
    const noSpecial = adminInitSchema.safeParse({
      email: "owner@devverse.io",
      username: "superadmin",
      displayName: "Platform Owner",
      password: "SuperSecretPassword123",
    });
    expect(noSpecial.success).toBe(false);

    // Short password (< 10 chars)
    const shortPass = adminInitSchema.safeParse({
      email: "owner@devverse.io",
      username: "superadmin",
      displayName: "Platform Owner",
      password: "Short1!",
    });
    expect(shortPass.success).toBe(false);
  });

  it("validates user status modification schemas", () => {
    const validActive = updateUserStatusSchema.safeParse({
      status: "ACTIVE",
    });
    expect(validActive.success).toBe(true);

    const validDisabled = updateUserStatusSchema.safeParse({
      status: "DISABLED",
      disabledUntil: new Date(Date.now() + 86400000).toISOString(),
      reason: "Suspicious login attempts detected",
    });
    expect(validDisabled.success).toBe(true);

    const validSuspended = updateUserStatusSchema.safeParse({
      status: "SUSPENDED",
      reason: "Severe policy violation",
    });
    expect(validSuspended.success).toBe(true);

    const invalid = updateUserStatusSchema.safeParse({
      status: "UNKNOWN_STATUS",
    });
    expect(invalid.success).toBe(false);
  });

  it("sanitizes sensitive fields before persisting in audit logs", async () => {
    const log = await logActivity({
      action: "AUTH_LOGIN_SUCCESS",
      actorId: "user-999",
      actorEmail: "test@domain.com",
      metadata: {
        username: "tester",
        password: "CleartextPasswordShouldBeRedacted",
        secretToken: "SecretValueShouldBeRedacted",
        normalKey: "NormalValue",
      },
    });

    expect(log.metadata?.password).toBe("[REDACTED]");
    expect(log.metadata?.secretToken).toBe("[REDACTED]");
    expect(log.metadata?.normalKey).toBe("NormalValue");
  });
});
