"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="glass-card p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h3 className="text-white font-semibold mb-2">Something went wrong</h3>
          <p className="text-white/50 text-sm mb-4">An unexpected error occurred. Please try refreshing.</p>
          <button onClick={() => window.location.reload()} className="btn-secondary flex items-center gap-2 mx-auto">
            <RefreshCw className="w-4 h-4" /> Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="glass-card p-8 text-center">
      <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
      <h3 className="text-white font-semibold mb-2">Unable to load</h3>
      <p className="text-white/50 text-sm mb-4">{message ?? "Something went wrong. Please try again."}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary flex items-center gap-2 mx-auto">
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      )}
    </div>
  );
}
