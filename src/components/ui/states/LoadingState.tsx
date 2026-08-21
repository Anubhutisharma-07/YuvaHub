import React from "react";
import { LoaderCircle } from "lucide-react";

interface LoadingStateProps {
  title?: string;
  description?: string;
  compact?: boolean;
}

export default function LoadingState({
  title = "Loading",
  description = "Please wait while we fetch the latest information.",
  compact = false,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center rounded-2xl border border-[#e8ded1] dark:border-slate-800 bg-[#fcf9f2] dark:bg-slate-900 ${
        compact ? "min-h-28 p-4" : "min-h-56 p-8"
      }`}
    >
      <div className="text-center">
        <LoaderCircle
          className="mx-auto mb-3 h-7 w-7 animate-spin text-[#b56b37]"
          aria-hidden="true"
        />
        <p className="font-bold text-[#231f20] dark:text-slate-100 font-serif">{title}</p>
        <p className="mt-1 text-xs text-[#603620] dark:text-slate-400 font-medium">{description}</p>
      </div>
    </div>
  );
}
