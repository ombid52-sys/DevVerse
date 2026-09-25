"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Code2,
  Layers,
  Eye,
  Lock,
  ArrowRight,
  FileCode,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Application } from "@/types";
import { formatDate } from "@/lib/utils";

export default function DeveloperDashboardPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApps() {
      try {
        const res = await fetch("/api/applications?mine=true&limit=50");
        if (res.ok) {
          const data = await res.json();
          setApps(data.items || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchApps();
  }, []);

  const totalApps = apps.length;
  const publicApps = apps.filter((a) => a.visibility === "PUBLIC").length;
  const privateApps = apps.filter((a) => a.visibility === "PRIVATE").length;
  const readySourceApps = apps.filter((a) => a.sourceStatus === "READY").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Developer Dashboard
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage your applications, source-code repositories, and platform deployments
          </p>
        </div>

        <Link href="/developer/apps/new">
          <Button size="md">
            <Plus className="w-4 h-4 mr-1" /> Publish Application
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-brand-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-medium">Total Applications</p>
              <h3 className="text-2xl font-bold text-neutral-900">{totalApps}</h3>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-medium">Public in Showcase</p>
              <h3 className="text-2xl font-bold text-neutral-900">{publicApps}</h3>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-medium">Private Drafts</p>
              <h3 className="text-2xl font-bold text-neutral-900">{privateApps}</h3>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 font-medium">Source Ready</p>
              <h3 className="text-2xl font-bold text-neutral-900">{readySourceApps}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Applications Quick Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-900 tracking-tight">
            Your Applications
          </h2>
          <Link
            href="/developer/apps"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>Manage all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-400">Loading your applications...</div>
        ) : apps.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center text-xs text-neutral-400 space-y-4">
            <p>You have not published any applications yet.</p>
            <Link href="/developer/apps/new">
              <Button size="sm">Publish First Application</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100 overflow-hidden shadow-sm">
            {apps.slice(0, 5).map((app) => (
              <div
                key={app._id.toString()}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/75 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={app.thumbnailUrl}
                    alt={app.name}
                    className="w-12 h-12 rounded-lg object-cover border border-neutral-200 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/apps/${app.slug}`}
                        className="font-semibold text-sm text-neutral-900 hover:text-brand-600 transition-colors"
                      >
                        {app.name}
                      </Link>
                      <Badge
                        variant={app.visibility === "PUBLIC" ? "success" : "neutral"}
                        size="sm"
                      >
                        {app.visibility}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
                      <span>{app.platform}</span>
                      <span>&bull;</span>
                      <span>{app.category}</span>
                      <span>&bull;</span>
                      <span>Updated {formatDate(app.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {app.sourceStatus === "READY" ? (
                    <span className="flex items-center gap-1 text-emerald-600 font-medium mr-2">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Source Ready
                    </span>
                  ) : (
                    <Link href={`/developer/apps/${app._id}/source`}>
                      <span className="flex items-center gap-1 text-amber-600 font-medium mr-2 hover:underline">
                        <AlertCircle className="w-3.5 h-3.5" /> Upload Source
                      </span>
                    </Link>
                  )}

                  <Link href={`/developer/apps/${app._id}/edit`}>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </Link>

                  <Link href={`/developer/apps/${app._id}/source`}>
                    <Button size="sm" variant="outline">
                      Source
                    </Button>
                  </Link>

                  <Link href={`/apps/${app.slug}`}>
                    <Button size="sm" variant="ghost">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
