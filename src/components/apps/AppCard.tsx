import React from "react";
import Link from "next/link";
import { Application } from "@/types";
import { Badge } from "../ui/Badge";
import { PLATFORMS, CATEGORIES } from "@/lib/constants";
import { Code, ExternalLink, Lock } from "lucide-react";

export function AppCard({ app }: { app: Application }) {
  const platformInfo = PLATFORMS.find((p) => p.value === app.platform);
  const categoryInfo = CATEGORIES.find((c) => c.value === app.category);

  return (
    <div className="group bg-white border border-neutral-200 hover:border-neutral-300 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Thumbnail area */}
      <Link href={`/apps/${app.slug}`} className="block relative aspect-video bg-neutral-100 overflow-hidden">
        {app.thumbnailUrl ? (
          <img
            src={app.thumbnailUrl}
            alt={app.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 bg-neutral-50">
            <Code className="w-10 h-10 stroke-1" />
          </div>
        )}

        {app.visibility === "PRIVATE" && (
          <div className="absolute top-2.5 right-2.5">
            <span className="inline-flex items-center gap-1 bg-neutral-900/80 backdrop-blur-sm text-white text-[11px] px-2 py-0.5 rounded font-medium">
              <Lock className="w-3 h-3" /> Private
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="neutral" size="sm">
              {platformInfo?.label || app.platform}
            </Badge>
            <Badge variant="outline" size="sm">
              {categoryInfo?.label || app.category}
            </Badge>
          </div>

          <Link href={`/apps/${app.slug}`}>
            <h3 className="font-semibold text-base text-neutral-900 group-hover:text-brand-600 transition-colors line-clamp-1">
              {app.name}
            </h3>
          </Link>

          <Link
            href={`/developers/${app.ownerUsername}`}
            className="text-xs text-neutral-500 hover:text-neutral-800 transition-colors mt-0.5 inline-block"
          >
            by @{app.ownerUsername}
          </Link>

          <p className="text-xs text-neutral-600 mt-2 line-clamp-2 leading-relaxed">
            {app.description}
          </p>
        </div>

        <div className="pt-4 mt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-neutral-500">
            {app.sourceStatus === "READY" ? (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Source Available
              </span>
            ) : (
              <span className="text-neutral-400">
                {app.sourceStatus === "PROCESSING" ? "Processing Code..." : "No Source"}
              </span>
            )}
          </div>

          <Link
            href={`/apps/${app.slug}`}
            className="text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
          >
            Details &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
