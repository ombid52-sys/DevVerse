import { describe, it, expect } from "vitest";
import { generateSlug, createApplicationSchema, updateApplicationSchema } from "@/lib/validations/application";

describe("Application Validation & Slug Logic", () => {
  it("generates clean URL-safe slugs from application names", () => {
    expect(generateSlug("DevVerse Showcase")).toBe("devverse-showcase");
    expect(generateSlug("  Super Cool App! (v2.0)  ")).toBe("super-cool-app-v20");
    expect(generateSlug("C++ Game Engine & 3D Tools")).toBe("c-game-engine-3d-tools");
    expect(generateSlug("---Leading and Trailing---")).toBe("leading-and-trailing");
  });

  it("validates valid application creation payload", () => {
    const validData = {
      name: "Pixel Studio Pro",
      slug: "pixel-studio-pro",
      description: "An advanced graphics and vector manipulation desktop application built for creators.",
      platform: "WINDOWS",
      category: "MULTIMEDIA",
      thumbnailUrl: "https://example.com/thumb.png",
      heroBannerUrl: "https://example.com/banner.png",
      screenshots: ["https://example.com/shot1.png", "https://example.com/shot2.png"],
      runtimeUrl: "https://studio.example.com",
      visibility: "PUBLIC",
    };

    const res = createApplicationSchema.safeParse(validData);
    expect(res.success).toBe(true);
  });

  it("rejects invalid platforms or categories", () => {
    const invalidPlatform = {
      name: "Bad Platform App",
      slug: "bad-platform-app",
      description: "A valid description for testing platform failure.",
      platform: "PLAYSTATION", // Invalid platform
      category: "UTILITY",
      thumbnailUrl: "https://example.com/thumb.png",
    };

    const res = createApplicationSchema.safeParse(invalidPlatform);
    expect(res.success).toBe(false);

    const invalidCategory = {
      name: "Bad Category App",
      slug: "bad-category-app",
      description: "A valid description for testing category failure.",
      platform: "WEB_APP",
      category: "UNSUPPORTED_CATEGORY",
      thumbnailUrl: "https://example.com/thumb.png",
    };

    const res2 = createApplicationSchema.safeParse(invalidCategory);
    expect(res2.success).toBe(false);
  });

  it("rejects malicious URLs in thumbnail or runtime fields", () => {
    const maliciousThumb = {
      name: "Malicious App",
      slug: "malicious-app",
      description: "A valid description for testing URL rejection.",
      platform: "LINUX",
      category: "SECURITY",
      thumbnailUrl: "javascript:alert(document.cookie)",
    };

    const res = createApplicationSchema.safeParse(maliciousThumb);
    expect(res.success).toBe(false);
  });

  it("rejects malformed slugs", () => {
    const badSlug = {
      name: "Bad Slug App",
      slug: "bad slug with spaces!",
      description: "A valid description with length > 10 chars.",
      platform: "ANDROID",
      category: "UTILITY",
      thumbnailUrl: "https://example.com/thumb.png",
    };

    const res = createApplicationSchema.safeParse(badSlug);
    expect(res.success).toBe(false);
  });
});
