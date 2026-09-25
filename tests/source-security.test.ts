import { describe, it, expect } from "vitest";
import AdmZip from "adm-zip";
import { inspectAndValidateZip, ZipSecurityError, buildDirectoryTree } from "@/lib/source/zip-inspector";
import { detectLanguages, shouldIgnoreFile } from "@/lib/source/language-detector";

describe("Source Code Security & ZIP Inspection", () => {
  it("safely inspects a valid ZIP archive and builds directory tree", () => {
    const zip = new AdmZip();
    zip.addFile("src/index.ts", Buffer.from("console.log('Hello DevVerse');"));
    zip.addFile("src/utils.ts", Buffer.from("export const add = (a: number, b: number) => a + b;"));
    zip.addFile("README.md", Buffer.from("# Project Readme"));
    zip.addFile("styles/main.css", Buffer.from("body { margin: 0; }"));

    const buffer = zip.toBuffer();
    const result = inspectAndValidateZip(buffer);

    expect(result.fileCount).toBe(4);
    expect(result.sourceTree.length).toBeGreaterThan(0);
    expect(result.languages.length).toBeGreaterThan(0);

    const tsLang = result.languages.find((l) => l.language === "TypeScript");
    expect(tsLang).toBeDefined();
    expect(tsLang?.percentage).toBeGreaterThan(0);
  });

  it("detects and rejects Path Traversal / ZipSlip attempts", () => {
    // 1. Relative traversal
    const maliciousZip1 = new AdmZip();
    maliciousZip1.addFile("test.txt", Buffer.from("root:x:0:0"));
    maliciousZip1.getEntries()[0].entryName = "../../etc/passwd";
    expect(() => inspectAndValidateZip(maliciousZip1.toBuffer())).toThrow(ZipSecurityError);

    // 2. Absolute path starting with /
    const maliciousZip2 = new AdmZip();
    maliciousZip2.addFile("test.txt", Buffer.from("malicious"));
    maliciousZip2.getEntries()[0].entryName = "/root/.ssh/id_rsa";
    expect(() => inspectAndValidateZip(maliciousZip2.toBuffer())).toThrow(ZipSecurityError);

    // 3. Absolute path with Windows drive letter
    const maliciousZip3 = new AdmZip();
    maliciousZip3.addFile("test.txt", Buffer.from("dummy"));
    maliciousZip3.getEntries()[0].entryName = "C:\\Windows\\System32\\calc.exe";
    expect(() => inspectAndValidateZip(maliciousZip3.toBuffer())).toThrow(ZipSecurityError);
  });

  it("rejects nested archives", () => {
    const nestedZip = new AdmZip();
    nestedZip.addFile("src/index.js", Buffer.from("console.log('hi');"));
    nestedZip.addFile("vendor/bundle.zip", Buffer.from("PK0304dummyarchive"));

    expect(() => inspectAndValidateZip(nestedZip.toBuffer())).toThrow(ZipSecurityError);
  });

  it("rejects corrupted or non-ZIP buffers", () => {
    const badBuffer = Buffer.from("Not a real zip archive file content");
    expect(() => inspectAndValidateZip(badBuffer)).toThrow(ZipSecurityError);
  });

  it("accurately detects language percentages and ignores vendor/noise files", () => {
    const files = [
      { path: "src/main.ts", size: 600 },
      { path: "src/worker.py", size: 400 },
      { path: "node_modules/library/index.js", size: 10000 }, // should be ignored!
      { path: ".git/HEAD", size: 50 }, // should be ignored!
      { path: "dist/bundle.min.js", size: 5000 }, // should be ignored!
      { path: "package-lock.json", size: 8000 }, // should be ignored!
    ];

    const stats = detectLanguages(files);
    expect(stats.length).toBe(2);

    const ts = stats.find((s) => s.language === "TypeScript");
    const py = stats.find((s) => s.language === "Python");

    expect(ts).toBeDefined();
    expect(py).toBeDefined();
    expect(ts?.percentage).toBe(60); // 600 / 1000 = 60%
    expect(py?.percentage).toBe(40); // 400 / 1000 = 40%
  });

  it("correctly identifies ignored files and vendor directories", () => {
    expect(shouldIgnoreFile("node_modules/react/index.js")).toBe(true);
    expect(shouldIgnoreFile(".git/config")).toBe(true);
    expect(shouldIgnoreFile("dist/app.min.js")).toBe(true);
    expect(shouldIgnoreFile("build/styles.min.css")).toBe(true);
    expect(shouldIgnoreFile("package-lock.json")).toBe(true);
    expect(shouldIgnoreFile("src/components/Navbar.tsx")).toBe(false);
  });
});
