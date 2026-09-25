"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ExternalLink,
  Code2,
  Calendar,
  Layers,
  FolderPlus,
  Share2,
  FileCode,
  Download,
  AlertCircle,
  Lock,
} from "lucide-react";
import { Application } from "@/types";
import { PLATFORMS, CATEGORIES } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LanguageBar } from "@/components/apps/LanguageBar";
import { FavoriteButton } from "@/components/apps/FavoriteButton";
import { AddToCollectionModal } from "@/components/apps/AddToCollectionModal";
import { formatDate, formatBytes } from "@/lib/utils";

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);

  useEffect(() => {
    async function loadApp() {
      try {
        const res = await fetch(`/api/applications/${slug}`);
        if (res.status === 404) {
          setError("NOT_FOUND");
          return;
        }
        if (res.status === 403) {
          setError("FORBIDDEN");
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setApp(data.application);
          if (data.application.screenshots?.length > 0) {
            setSelectedScreenshot(data.application.screenshots[0]);
          }
        } else {
          setError("ERROR");
        }
      } catch (err) {
        setError("ERROR");
      } finally {
        setLoading(false);
      }
    }
    loadApp();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
        <div className="w-full h-64 bg-neutral-200 animate-pulse rounded-xl" />
        <div className="space-y-3">
          <div className="w-1/3 h-8 bg-neutral-200 animate-pulse rounded" />
          <div className="w-1/4 h-4 bg-neutral-200 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (error === "NOT_FOUND" || !app) {
    return notFound();
  }

  if (error === "FORBIDDEN") {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-neutral-900">Private Application</h2>
        <p className="text-xs text-neutral-500 max-w-sm mt-1 mb-6">
          This application is configured as private and can only be accessed by its owner or platform administrators.
        </p>
        <Link href="/explore">
          <Button size="sm">Browse Public Applications</Button>
        </Link>
      </div>
    );
  }

  const platformInfo = PLATFORMS.find((p) => p.value === app.platform);
  const categoryInfo = CATEGORIES.find((c) => c.value === app.category);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Hero Banner or Visual Showcase */}
      {app.heroBannerUrl ? (
        <div className="w-full h-56 sm:h-72 rounded-2xl overflow-hidden border border-neutral-200 relative bg-neutral-900 shadow-sm">
          <img
            src={app.heroBannerUrl}
            alt={`${app.name} banner`}
            className="w-full h-full object-cover"
          />
        </div>
      ) : null}

      {/* Main App Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-neutral-200">
        <div className="flex items-start gap-4">
          <img
            src={app.thumbnailUrl}
            alt={app.name}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-neutral-200 shadow-sm shrink-0"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <Badge variant="brand" size="md">
                {platformInfo?.label || app.platform}
              </Badge>
              <Badge variant="neutral" size="md">
                {categoryInfo?.label || app.category}
              </Badge>
              {app.visibility === "PRIVATE" && (
                <Badge variant="danger" size="md">
                  <Lock className="w-3 h-3" /> Private
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
              {app.name}
            </h1>

            <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
              <span>
                by{" "}
                <Link
                  href={`/developers/${app.ownerUsername}`}
                  className="font-medium text-neutral-800 hover:text-brand-600 underline"
                >
                  @{app.ownerUsername}
                </Link>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Published {formatDate(app.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {app.runtimeUrl && (
            <a
              href={app.runtimeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button variant="primary" size="md" className="w-full sm:w-auto h-10 gap-2">
                <ExternalLink className="w-4 h-4" />
                <span>Launch App</span>
              </Button>
            </a>
          )}

          {app.sourceStatus === "READY" && (
            <Link href={`/apps/${app.slug}/source`} className="w-full sm:w-auto">
              <Button variant={app.runtimeUrl ? "outline" : "primary"} size="md" className="w-full sm:w-auto h-10 gap-2">
                <Code2 className="w-4 h-4" />
                <span>Browse Source Code</span>
              </Button>
            </Link>
          )}

          <FavoriteButton applicationId={app._id.toString()} size="md" iconOnly />

          <Button
            variant="outline"
            size="md"
            onClick={() => setCollectionModalOpen(true)}
            title="Add to personal collection"
            aria-label="Add to collection"
            className="h-10 w-10 p-0 shrink-0 flex items-center justify-center text-neutral-700 hover:text-neutral-900 border-neutral-300"
          >
            <FolderPlus className="w-4.5 h-4.5 text-neutral-600" />
          </Button>
        </div>
      </div>

      {/* Grid Layout: Description & Media + Sidebar Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* About / Description */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-neutral-900 tracking-tight">
              About this application
            </h2>
            <div className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line bg-white p-6 rounded-xl border border-neutral-200">
              {app.description}
            </div>
          </section>

          {/* Screenshots Gallery */}
          {app.screenshots && app.screenshots.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-bold text-neutral-900 tracking-tight">
                Screenshots & Previews
              </h2>
              <div className="space-y-3">
                {selectedScreenshot && (
                  <div className="w-full aspect-video rounded-xl overflow-hidden border border-neutral-200 bg-neutral-950">
                    <img
                      src={selectedScreenshot}
                      alt="Selected preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <div className="flex gap-2 overflow-x-auto pb-2">
                  {app.screenshots.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedScreenshot(s)}
                      className={`relative w-24 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                        selectedScreenshot === s
                          ? "border-brand-500 ring-2 ring-brand-500/20"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <img
                        src={s}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Source Code Breakdown */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-neutral-900 tracking-tight">
                Source Code & Architecture
              </h2>
              {app.sourceStatus === "READY" && (
                <Link
                  href={`/apps/${app.slug}/source`}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:underline"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Browse Source Code</span>
                </Link>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl border border-neutral-200 space-y-4">
              {app.sourceStatus === "READY" ? (
                <>
                  <LanguageBar languages={app.languages} />
                  <div className="pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-500">
                    <div>
                      <span>Total files: </span>
                      <strong className="text-neutral-800">{app.sourceFileCount}</strong>
                    </div>
                    <div>
                      <span>Archive size: </span>
                      <strong className="text-neutral-800">{formatBytes(app.sourceArchiveSize || 0)}</strong>
                    </div>
                    <a
                      href={`/api/applications/${app.slug}/source`}
                      className="text-brand-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Source Archive (.zip)
                    </a>
                  </div>
                </>
              ) : app.sourceStatus === "PROCESSING" ? (
                <div className="flex items-center gap-3 text-xs text-amber-700 bg-amber-50 p-4 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>The source code archive is currently being processed and analyzed.</span>
                </div>
              ) : (
                <div className="text-xs text-neutral-400 py-4 text-center">
                  Source code has not yet been uploaded for this application.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Metadata Box */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-neutral-200 space-y-4 text-xs">
            <h3 className="font-bold text-neutral-900 text-sm uppercase tracking-wider">
              Application Details
            </h3>

            <div className="space-y-3 divide-y divide-neutral-100">
              <div className="pt-2 flex justify-between">
                <span className="text-neutral-500">Target Platform</span>
                <span className="font-semibold text-neutral-800">{platformInfo?.label}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-neutral-500">Executable Ext</span>
                <span className="font-mono text-neutral-800">{platformInfo?.extension}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-neutral-500">Category</span>
                <span className="font-semibold text-neutral-800">{categoryInfo?.label}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-neutral-500">Visibility</span>
                <span className="font-semibold text-neutral-800">{app.visibility}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-neutral-500">Source State</span>
                <span className={`font-semibold ${app.sourceStatus === "READY" ? "text-emerald-600" : "text-neutral-500"}`}>
                  {app.sourceStatus}
                </span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-neutral-500">URL Slug</span>
                <span className="font-mono text-neutral-700">/{app.slug}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-neutral-500">Last Modified</span>
                <span className="text-neutral-700">{formatDate(app.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add To Collection Modal */}
      <AddToCollectionModal
        isOpen={collectionModalOpen}
        onClose={() => setCollectionModalOpen(false)}
        applicationId={app._id.toString()}
        applicationName={app.name}
      />
    </div>
  );
}
