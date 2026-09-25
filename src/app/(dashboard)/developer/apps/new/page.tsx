"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PLATFORMS, CATEGORIES } from "@/lib/constants";
import { generateSlug } from "@/lib/validations/application";

export default function NewApplicationPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState(PLATFORMS[0].value);
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [heroBannerUrl, setHeroBannerUrl] = useState("");
  const [runtimeUrl, setRuntimeUrl] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [screenshots, setScreenshots] = useState<string[]>([""]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugManual) {
      setSlug(generateSlug(val));
    }
  };

  const handleAddScreenshotField = () => {
    if (screenshots.length < 8) {
      setScreenshots([...screenshots, ""]);
    }
  };

  const handleScreenshotChange = (index: number, val: string) => {
    const updated = [...screenshots];
    updated[index] = val;
    setScreenshots(updated);
  };

  const handleRemoveScreenshotField = (index: number) => {
    const updated = screenshots.filter((_, i) => i !== index);
    setScreenshots(updated.length > 0 ? updated : [""]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const filteredScreenshots = screenshots.map((s) => s.trim()).filter(Boolean);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          description: description.trim(),
          platform,
          category,
          thumbnailUrl: thumbnailUrl.trim(),
          heroBannerUrl: heroBannerUrl.trim() || undefined,
          runtimeUrl: runtimeUrl.trim() || undefined,
          visibility,
          screenshots: filteredScreenshots,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create application");
        setLoading(false);
        return;
      }

      // Prompt to upload source code directly
      router.push(`/developer/apps/${data.application._id}/source`);
    } catch {
      setError("An unexpected network error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2 pb-6 border-b border-neutral-200">
        <Link
          href="/developer/apps"
          className="text-xs text-neutral-500 hover:text-neutral-800 flex items-center gap-1.5 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to applications
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
          Publish New Application
        </h1>
        <p className="text-xs text-neutral-500">
          Enter project metadata, media banners, and configure public visibility
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 font-medium rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 sm:p-8 rounded-xl border border-neutral-200 shadow-sm">
        {/* Basic Info */}
        <div className="space-y-4">
          <Input
            label="Application Name"
            required
            autoFocus
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. NextGen Terminal"
          />

          <div>
            <Input
              label="URL Slug"
              required
              value={slug}
              onChange={(e) => {
                setIsSlugManual(true);
                setSlug(e.target.value.toLowerCase());
              }}
              placeholder="e.g. nextgen-terminal"
              helperText="Unique identifier in URL: /apps/[slug]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Target Platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as any)}
              options={PLATFORMS.map((p) => ({ value: p.value, label: `${p.label} (${p.extension})` }))}
            />

            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Description *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a comprehensive summary of features, architecture, and usage..."
              className="w-full px-3 py-2 text-sm bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-neutral-900"
            />
          </div>
        </div>

        {/* Media & URLs */}
        <div className="pt-4 border-t border-neutral-100 space-y-4">
          <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
            Media & External Links
          </h3>

          <Input
            label="Thumbnail Image URL *"
            type="url"
            required
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="https://example.com/thumbnail.png"
            helperText="Direct image link (square or 16:9 recommended)"
          />

          <Input
            label="Hero Banner Image URL (optional)"
            type="url"
            value={heroBannerUrl}
            onChange={(e) => setHeroBannerUrl(e.target.value)}
            placeholder="https://example.com/hero-banner.jpg"
          />

          <Input
            label="Live Runtime / Web App URL (optional)"
            type="url"
            value={runtimeUrl}
            onChange={(e) => setRuntimeUrl(e.target.value)}
            placeholder="https://myapp.domain.com"
            helperText="Provides a 'Launch App' button on the showcase page"
          />

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Screenshots (up to 8 URLs)
            </label>
            <div className="space-y-2">
              {screenshots.map((s, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="url"
                    value={s}
                    onChange={(e) => handleScreenshotChange(idx, e.target.value)}
                    placeholder={`Screenshot URL #${idx + 1}`}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  {screenshots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveScreenshotField(idx)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {screenshots.length < 8 && (
              <button
                type="button"
                onClick={handleAddScreenshotField}
                className="mt-2 text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add screenshot field
              </button>
            )}
          </div>
        </div>

        {/* Visibility */}
        <div className="pt-4 border-t border-neutral-100 space-y-3">
          <label className="block text-xs font-medium text-neutral-700">
            Publishing Visibility
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                visibility === "PUBLIC"
                  ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <input
                type="radio"
                name="visibility"
                value="PUBLIC"
                checked={visibility === "PUBLIC"}
                onChange={() => setVisibility("PUBLIC")}
                className="sr-only"
              />
              <span className="block text-xs font-semibold text-neutral-900">PUBLIC</span>
              <span className="block text-[11px] text-neutral-500 mt-0.5">
                Visible to all platform visitors in discovery
              </span>
            </label>

            <label
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                visibility === "PRIVATE"
                  ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <input
                type="radio"
                name="visibility"
                value="PRIVATE"
                checked={visibility === "PRIVATE"}
                onChange={() => setVisibility("PRIVATE")}
                className="sr-only"
              />
              <span className="block text-xs font-semibold text-neutral-900">PRIVATE</span>
              <span className="block text-[11px] text-neutral-500 mt-0.5">
                Only accessible to you and platform administrators
              </span>
            </label>
          </div>
        </div>

        <div className="pt-6 border-t border-neutral-100 flex items-center justify-between">
          <Link href="/developer/apps">
            <Button type="button" variant="ghost" size="sm">
              Cancel
            </Button>
          </Link>
          <Button type="submit" size="md" isLoading={loading}>
            <span>Continue to Source Upload</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </form>
    </div>
  );
}
