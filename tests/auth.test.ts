import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, generateVerificationCode } from "@/lib/auth";
import { registerSchema, safeUrlSchema, resetPasswordSchema } from "@/lib/validations/auth";
import { createSessionToken, verifySessionToken } from "@/lib/session";

describe("Authentication & Security", () => {
  it("hashes and verifies passwords correctly with bcrypt", async () => {
    const password = "SecurePassword123!";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.startsWith("$2")).toBe(true);

    const isMatch = await verifyPassword(password, hash);
    expect(isMatch).toBe(true);

    const isBadMatch = await verifyPassword("WrongPassword123!", hash);
    expect(isBadMatch).toBe(false);
  });

  it("generates a secure 6-digit verification code", () => {
    for (let i = 0; i < 20; i++) {
      const code = generateVerificationCode();
      expect(code).toMatch(/^[0-9]{6}$/);
      expect(code.length).toBe(6);
    }
  });

  it("validates registration schemas with strict rules", () => {
    const valid = registerSchema.safeParse({
      username: "sarah_dev",
      email: "sarah@example.com",
      password: "StrongPassword1",
      role: "DEVELOPER",
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.username).toBe("sarah_dev");
      expect(valid.data.email).toBe("sarah@example.com");
    }

    // Weak password rejection
    const weakPass = registerSchema.safeParse({
      username: "sarah_dev",
      email: "sarah@example.com",
      password: "weak",
      role: "DEVELOPER",
    });
    expect(weakPass.success).toBe(false);

    // Invalid username with spaces or special characters
    const badUser = registerSchema.safeParse({
      username: "sarah dev!@#",
      email: "sarah@example.com",
      password: "StrongPassword1",
      role: "DEVELOPER",
    });
    expect(badUser.success).toBe(false);

    // Invalid role
    const badRole = registerSchema.safeParse({
      username: "sarah_dev",
      email: "sarah@example.com",
      password: "StrongPassword1",
      role: "ADMIN", // Admin cannot be registered via public registration
    });
    expect(badRole.success).toBe(false);
  });

  it("creates and verifies cryptographically signed session tokens", async () => {
    const payload = {
      userId: "user-12345",
      email: "test@devverse.io",
      username: "tester",
      displayName: "Tester",
      role: "USER" as const,
      status: "ACTIVE" as const,
    };

    const token = await createSessionToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe("user-12345");
    expect(decoded?.email).toBe("test@devverse.io");
    expect(decoded?.role).toBe("USER");
  });

  it("rejects invalid or tampered session tokens", async () => {
    const invalid = await verifySessionToken("tampered.jwt.token");
    expect(invalid).toBeNull();
  });

  it("strictly validates safe URLs and prevents dangerous schemes", () => {
    expect(safeUrlSchema.safeParse("https://devverse.io").success).toBe(true);
    expect(safeUrlSchema.safeParse("http://localhost:3000/app").success).toBe(true);

    // Reject javascript:, data:, vbscript:, file:
    expect(safeUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
    expect(safeUrlSchema.safeParse("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==").success).toBe(false);
    expect(safeUrlSchema.safeParse("file:///etc/passwd").success).toBe(false);
  });
});
