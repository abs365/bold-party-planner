"use client";

import { AlertCircle, Loader2, type LucideIcon } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = "Loading…", className = "" }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`} data-testid="loading-state">
      <Loader2 size={24} className="animate-spin text-brand-400 mb-3" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

interface EmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, emoji, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-14 text-center ${className}`} data-testid="empty-state">
      <div className="w-14 h-14 rounded-2xl bg-white/4 flex items-center justify-center mx-auto mb-4">
        {emoji ? (
          <span className="text-2xl">{emoji}</span>
        ) : Icon ? (
          <Icon size={24} className="text-slate-600" />
        ) : null}
      </div>
      <p className="text-white font-semibold mb-1">{title}</p>
      {description && <p className="text-sm text-slate-500 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  retry?: () => void;
  className?: string;
}

export function ErrorState({ title = "Something went wrong", message, retry, className = "" }: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-14 text-center ${className}`} data-testid="error-state">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
        <AlertCircle size={24} className="text-red-400" />
      </div>
      <p className="text-white font-semibold mb-1">{title}</p>
      {message && <p className="text-sm text-slate-500 max-w-xs">{message}</p>}
      {retry && (
        <button
          onClick={retry}
          className="mt-4 text-sm text-brand-400 hover:text-brand-300 transition-colors underline underline-offset-2"
        >
          Try again
        </button>
      )}
    </div>
  );
}
