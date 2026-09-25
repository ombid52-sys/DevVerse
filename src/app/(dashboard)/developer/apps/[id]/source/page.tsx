"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  ExternalLink,
  RefreshCw,
  FolderTree,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { LanguageBar } from "@/components/apps/LanguageBar";
import { Application } from "@/types";
import { formatBytes, formatDate } from "@/lib/utils";
import { SOURCE_LIMITS } from "@/lib/constants";

export default function AppSourceUploadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchApp = async () => {
    try {
      const res = await fetch(`/api/applications/${id}`);
      if (res.ok) {
        const data = await res.json();
        setApp(data.application);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApp();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith(".zip")) {
        setError("Only ZIP archives (.zip) are supported");
        setSelectedFile(null);
        return;
      }
      if (file.size > SOURCE_LIMITS.MAX_ZIP_SIZE_BYTES) {
        setError(`File size exceeds ${SOURCE_LIMITS.MAX_ZIP_SIZE_BYTES / (1024 * 1024)}MB limit`);
        setSelectedFile(null);
        return;
      }
      setError(null);
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch(`/api/applications/${id}/source`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to process source archive");
      } else {
        setSuccess(true);
        setSelectedFile(null);
        fetchApp();
      }
    } catch {
      setError("An unexpected network error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-neutral-400">Loading source management...</div>;
  }

  if (!app) {
    return <div className="p-8 text-center text-xs text-neutral-400">Application not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2 pb-6 border-b border-neutral-200">
        <Link
          href="/developer/apps"
          className="text-xs text-neutral-500 hover:text-neutral-800 flex items-center gap-1.5 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to applications
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              <FileCode className="w-6 h-6 text-brand-500" />
              <span>Source Code & Persistence</span>
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Application: <strong className="text-neutral-800">{app.name}</strong> (/{app.slug})
            </p>
          </div>

          {app.sourceStatus === "READY" && (
            <Link href={`/apps/${app.slug}/source`}>
              <Button size="sm">
                <FolderTree className="w-4 h-4 mr-1" /> Open Source Browser
              </Button>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-xs text-red-700 font-medium rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Source archive successfully verified, analyzed, and stored!</span>
        </div>
      )}

      {/* Current State & Statistics */}
      {app.sourceStatus === "READY" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Active Source Code Repository
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                READY
              </span>
            </CardTitle>
          </CardHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-neutral-400">Total Files Extracted</p>
                <p className="text-base font-bold text-neutral-900 mt-0.5">
                  {app.sourceFileCount}
                </p>
              </div>

              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-neutral-400">Archive Buffer Size</p>
                <p className="text-base font-bold text-neutral-900 mt-0.5">
                  {formatBytes(app.sourceArchiveSize || 0)}
                </p>
              </div>

              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-neutral-400">Languages Detected</p>
                <p className="text-base font-bold text-neutral-900 mt-0.5">
                  {app.languages?.length || 0}
                </p>
              </div>
            </div>

            {/* Language Distribution */}
            <div>
              <h4 className="text-xs font-semibold text-neutral-800 mb-2">
                Detected Source Breakdown
              </h4>
              <LanguageBar languages={app.languages} />
            </div>

            <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-xs">
              <span className="text-neutral-500">
                Persistent storage backed by Google Drive / cloud storage
              </span>
              <a
                href={`/api/applications/${app.slug}/source`}
                download
                className="text-brand-600 font-medium hover:underline flex items-center gap-1"
              >
                Download active ZIP archive
              </a>
            </div>
          </div>
        </Card>
      )}

      {/* Upload New Archive Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-brand-500" />
            {app.sourceStatus === "READY" ? "Replace Source Code Archive" : "Upload Project Source Archive"}
          </CardTitle>
        </CardHeader>

        <form onSubmit={handleUpload} className="space-y-6">
          <div className="border-2 border-dashed border-neutral-300 hover:border-brand-400 rounded-xl p-8 text-center bg-neutral-50/50 transition-colors">
            <input
              type="file"
              id="zip-upload"
              accept=".zip"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="zip-upload" className="cursor-pointer block space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-brand-500 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  {selectedFile ? selectedFile.name : "Click to select a ZIP archive"}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {selectedFile
                    ? `${formatBytes(selectedFile.size)} selected`
                    : "Drag and drop or browse from your workstation (.zip files only)"}
                </p>
              </div>
            </label>
          </div>

          {/* Security & Validation Notice */}
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-neutral-800">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Automated Inspection & Security Protections</span>
            </div>
            <ul className="text-neutral-500 space-y-1 list-disc list-inside">
              <li>Max archive upload size: 50MB</li>
              <li>Decompression bomb prevention: maximum 250MB extracted size &amp; 10,000 files</li>
              <li>Path traversal / ZipSlip prevention: absolute paths &amp; malicious directories rejected</li>
              <li>Language percentage detection: excludes node_modules, .git, minified assets, and lockfiles</li>
              <li>Never executed: source code is stored safely and statically parsed only</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3">
            {selectedFile && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
              >
                Clear Selection
              </Button>
            )}
            <Button
              type="submit"
              size="md"
              disabled={!selectedFile}
              isLoading={uploading}
            >
              {uploading ? "Analyzing & Storing..." : "Upload & Analyze Source"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
