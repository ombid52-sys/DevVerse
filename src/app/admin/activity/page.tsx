"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Activity,
  Search,
  Filter,
  Radio,
  Clock,
  User,
  Shield,
  RefreshCw,
} from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";
import { ActivityLog } from "@/types";

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch initial paginated logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (actionFilter) q.set("action", actionFilter);
      q.set("page", page.toString());
      q.set("limit", "25");

      const res = await fetch(`/api/admin/activity?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  // Connect to SSE Live Activity Stream
  useEffect(() => {
    const es = new EventSource("/api/admin/activity/stream");
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsLiveConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "LOG" && data.log) {
          setLogs((prev) => [data.log, ...prev.slice(0, 49)]);
        }
      } catch {
        // ignore ping
      }
    };

    es.onerror = () => {
      setIsLiveConnected(false);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("FAILED") || action.includes("DELETE") || action.includes("SUSPEND")) {
      return "danger";
    }
    if (action.includes("DISABLED")) {
      return "warning";
    }
    if (action.includes("SUCCESS") || action.includes("READY") || action.includes("CREATE")) {
      return "success";
    }
    return "brand";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-brand-500" />
            <span>Audit & Activity Stream</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time audit records tracking authentications, uploads, security events, and administrative operations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
              isLiveConnected
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-neutral-100 text-neutral-500 border-neutral-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveConnected ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"
              }`}
            />
            <span>{isLiveConnected ? "Live SSE Connected" : "Connecting..."}</span>
          </div>

          <Button size="sm" variant="outline" onClick={fetchLogs}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Search and Action Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, actor, target..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </form>

        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs bg-white border border-neutral-300 rounded-md px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All Actions</option>
          <option value="AUTH_LOGIN_SUCCESS">AUTH_LOGIN_SUCCESS</option>
          <option value="AUTH_LOGIN_FAILED">AUTH_LOGIN_FAILED</option>
          <option value="AUTH_REGISTER">AUTH_REGISTER</option>
          <option value="AUTH_VERIFY_EMAIL">AUTH_VERIFY_EMAIL</option>
          <option value="APP_CREATE">APP_CREATE</option>
          <option value="APP_SOURCE_UPLOAD_SUCCESS">APP_SOURCE_UPLOAD_SUCCESS</option>
          <option value="APP_SOURCE_UPLOAD_FAILED">APP_SOURCE_UPLOAD_FAILED</option>
          <option value="ADMIN_USER_STATUS_DISABLED">ADMIN_USER_STATUS_DISABLED</option>
          <option value="ADMIN_USER_STATUS_SUSPENDED">ADMIN_USER_STATUS_SUSPENDED</option>
          <option value="ADMIN_APP_PERMANENT_DELETE">ADMIN_APP_PERMANENT_DELETE</option>
        </select>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="py-12 text-center text-xs text-neutral-400">Loading audit records...</div>
      ) : logs.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center text-xs text-neutral-400">
          No audit records found matching your filters.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Metadata / Details</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log._id?.toString() || Math.random()}>
                <TableCell className="text-xs font-mono text-neutral-500 whitespace-nowrap">
                  {formatDateTime(log.timestamp)}
                </TableCell>
                <TableCell>
                  <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-mono text-neutral-800">
                  {log.actorEmail || log.actorId || "Anonymous"}
                </TableCell>
                <TableCell>
                  <Badge variant="neutral" size="sm">
                    {log.actorRole || "ANON"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-neutral-600 font-mono">
                  {log.targetType ? `${log.targetType}:${(log.targetId || "").slice(0, 8)}...` : "-"}
                </TableCell>
                <TableCell className="text-[11px] text-neutral-600 font-mono max-w-xs truncate">
                  {log.metadata ? JSON.stringify(log.metadata) : "-"}
                </TableCell>
                <TableCell className="text-[11px] text-neutral-400 font-mono">
                  {log.ip || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-neutral-600">
            Page {page} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
