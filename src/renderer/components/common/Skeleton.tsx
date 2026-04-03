/**
 * SA ERP - Skeleton Loading Components
 */



export function SkeletonLine({ width = 'w-full', height = 'h-4' }: { width?: string; height?: string }) {
  return <div className={`skeleton ${width} ${height} rounded`} />;
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <SkeletonLine width="w-1/3" height="h-5" />
      <SkeletonLine width="w-2/3" />
      <SkeletonLine width="w-1/2" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="bg-surface-50 dark:bg-surface-800 px-6 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} width={i === 0 ? 'w-32' : 'w-24'} height="h-3" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-6 py-4 flex gap-4 border-t border-surface-100 dark:border-surface-800">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine key={c} width={c === 0 ? 'w-32' : 'w-24'} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5 space-y-3">
          <SkeletonLine width="w-20" height="h-3" />
          <SkeletonLine width="w-24" height="h-8" />
          <SkeletonLine width="w-16" height="h-3" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <SkeletonLine width="w-48" height="h-7" />
          <SkeletonLine width="w-64" height="h-4" />
        </div>
        <SkeletonLine width="w-28" height="h-10" />
      </div>
      <SkeletonStats />
      <SkeletonTable />
    </div>
  );
}
