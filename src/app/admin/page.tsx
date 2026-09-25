"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Terminal,
  Grid,
  Activity,
  ShieldCheck,
  Server,
  ArrowRight,
  Database,
  Cloud,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    developers: 0,
    totalApps: 0,
    publicApps: 0,
    privateApps: 0,
    recentLogs: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [usersRes, appsRes, logsRes] = await Promise.all([
          fetch("/api/admin/users?limit=1"),
          fetch("/api/admin/applications?limit=100"),
          fetch("/api/admin/activity?limit=6"),
        ]);

        let totalUsers = 0;
        let developers = 0;
        let totalApps = 0;
        let publicApps = 0;
        let privateApps = 0;
        let recentLogs: any[] = [];

        if (usersRes.ok) {
          const uData = await usersRes.json();
          totalUsers = uData.total || 0;
        }

        if (appsRes.ok) {
          const aData = await appsRes.json();
          const items = aData.applications || [];
          totalApps = aData.total || items.length;
          publicApps = items.filter((a: any) => a.visibility === "PUBLIC").length;
          privateApps = items.filter((a: any) => a.visibility === "PRIVATE").length;
        }

        if (logsRes.ok) {
          const lData = await logsRes.json();
          recentLogs = lData.logs || [];
        }

        setStats({
          totalUsers,
          developers,
          totalApps,
          publicApps,
          privateApps,
          recentLogs,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
            <span>Platform Overview</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            System governance, active workloads, and security audit logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" size="md">
            System Healthy
          </Badge>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-brand-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Registered Accounts</p>
              <h3 className="text-2xl font-bold text-neutral-900">{stats.totalUsers}</h3>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Total Applications</p>
              <h3 className="text-2xl font-bold text-neutral-900">{stats.totalApps}</h3>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Public Apps</p>
              <h3 className="text-2xl font-bold text-neutral-900">{stats.publicApps}</h3>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Storage Backend</p>
              <h3 className="text-sm font-bold text-neutral-900 mt-1">
                Drive / Local
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/users"
          className="p-5 bg-white border border-neutral-200 hover:border-brand-300 rounded-xl shadow-sm hover:shadow transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 group-hover:bg-brand-50 group-hover:text-brand-600 flex items-center justify-center transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-neutral-900">Manage Users</h3>
              <p className="text-[11px] text-neutral-500">Inspect status, disable or suspend</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/admin/apps"
          className="p-5 bg-white border border-neutral-200 hover:border-brand-300 rounded-xl shadow-sm hover:shadow transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 group-hover:bg-brand-50 group-hover:text-brand-600 flex items-center justify-center transition-colors">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-neutral-900">Manage Applications</h3>
              <p className="text-[11px] text-neutral-500">Visibility control and deletions</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/admin/activity"
          className="p-5 bg-white border border-neutral-200 hover:border-brand-300 rounded-xl shadow-sm hover:shadow transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 group-hover:bg-brand-50 group-hover:text-brand-600 flex items-center justify-center transition-colors">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-neutral-900">Live Audit Stream</h3>
              <p className="text-[11px] text-neutral-500">Real-time SSE event feed</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-900 tracking-tight">
            Recent Audit & Security Logs
          </h2>
          <Link
            href="/admin/activity"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            View live stream &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-neutral-400">Loading audit events...</div>
        ) : stats.recentLogs.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center text-xs text-neutral-400">
            No audit events recorded yet.
          </div>
        ) : (
          <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100 shadow-sm overflow-hidden">
            {stats.recentLogs.map((log: any) => (
              <div
                key={log._id?.toString() || Math.random()}
                className="p-3.5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" size="sm">
                    {log.action}
                  </Badge>
                  <span className="font-mono text-neutral-700">
                    {log.actorEmail || "anonymous"}
                  </span>
                  {log.targetType && (
                    <span className="text-neutral-400">
                      &bull; target: {log.targetType}
                    </span>
                  )}
                </div>
                <span className="text-neutral-400 font-mono text-[11px]">
                  {formatDateTime(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
