import { cn } from "@/lib/utils";

export function LoadingSpinner({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = { sm: "h-4 w-4 border-2", md: "h-8 w-8 border-2", lg: "h-12 w-12 border-3" };
  return (
    <div
      className={cn(
        "rounded-full border-white/20 border-t-brand-500 animate-spin",
        sizes[size],
        className
      )}
    />
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" className="mx-auto" />
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white/4 border border-white/6 rounded-xl p-4 animate-pulse">
      <div className="h-48 bg-white/5 rounded-lg mb-4" />
      <div className="h-4 bg-white/5 rounded mb-2 w-3/4" />
      <div className="h-3 bg-white/5 rounded mb-4 w-1/2" />
      <div className="flex gap-2">
        <div className="h-6 bg-white/5 rounded-full w-16" />
        <div className="h-6 bg-white/5 rounded-full w-20" />
      </div>
    </div>
  );
}
