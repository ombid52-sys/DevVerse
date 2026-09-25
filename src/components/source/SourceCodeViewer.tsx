"use client";

import React, { useState } from "react";
import { Copy, Check, FileText, Binary } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { Button } from "../ui/Button";

interface SourceCodeViewerProps {
  filePath: string;
  content: string | null;
  size: number;
  isBinary: boolean;
}

export function SourceCodeViewer({
  filePath,
  content,
  size,
  isBinary,
}: SourceCodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const lines = content ? content.split("\n") : [];

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm flex flex-col h-full">
      {/* File Header */}
      <div className="px-4 py-2.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-neutral-700 font-mono">
          <FileText className="w-4 h-4 text-neutral-500" />
          <span className="font-semibold text-neutral-900">{filePath}</span>
          <span className="text-neutral-400">&bull;</span>
          <span className="text-neutral-500">{formatBytes(size)}</span>
          {!isBinary && (
            <>
              <span className="text-neutral-400">&bull;</span>
              <span className="text-neutral-500">{lines.length} lines</span>
            </>
          )}
        </div>

        {!isBinary && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="h-7 text-xs"
          >
            {copied ? (
              <span className="flex items-center gap-1 text-emerald-600">
                <Check className="w-3.5 h-3.5" /> Copied
              </span>
            ) : (
              <span className="flex items-center gap-1 text-neutral-700">
                <Copy className="w-3.5 h-3.5" /> Copy Code
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Code / Content Area */}
      <div className="flex-1 overflow-auto bg-neutral-950 text-neutral-100 font-mono text-xs p-4">
        {isBinary ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-neutral-400">
            <Binary className="w-12 h-12 stroke-1 text-neutral-600 mb-2" />
            <p className="font-medium text-neutral-300">Binary file</p>
            <p className="text-[11px] text-neutral-500 mt-1">
              This file cannot be displayed directly in the code editor.
            </p>
          </div>
        ) : (
          <div className="flex leading-relaxed">
            {/* Line Numbers */}
            <div className="select-none pr-4 text-neutral-600 text-right font-mono border-r border-neutral-800">
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code Lines */}
            <div className="pl-4 flex-1 whitespace-pre overflow-x-auto text-neutral-200">
              {lines.map((line, i) => (
                <div key={i}>{line || " "}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
