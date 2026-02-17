import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
}

/**
 * Base skeleton loader component with pulsing animation
 */
const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      aria-hidden="true"
    />
  );
};

/**
 * Skeleton loader for KPI stat cards (8 cards in Revenue Statistics section)
 */
export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-bb-card border border-bb-border">
      <div className="flex items-start gap-3">
        {/* Icon placeholder */}
        <SkeletonLoader className="w-12 h-12 rounded-lg" />

        {/* Content placeholder */}
        <div className="flex-1 space-y-2">
          <SkeletonLoader className="h-4 w-3/4" />
          <SkeletonLoader className="h-6 w-1/2" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton loader for 8 KPI cards grid
 */
export const KPICardsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, index) => (
        <StatCardSkeleton key={index} />
      ))}
    </div>
  );
};

/**
 * Skeleton loader for table components (Product Ranking, Brand Ranking, etc.)
 */
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="p-4">
      {/* Table header */}
      <div className="mb-4">
        <SkeletonLoader className="h-6 w-48" />
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2 mb-4">
        <SkeletonLoader className="h-10 w-32" />
        <SkeletonLoader className="h-10 w-32" />
      </div>

      {/* Table headers */}
      <div className="flex gap-4 mb-3 pb-3 border-b border-gray-200">
        <SkeletonLoader className="h-4 w-1/4" />
        <SkeletonLoader className="h-4 w-1/4" />
        <SkeletonLoader className="h-4 w-1/4" />
        <SkeletonLoader className="h-4 w-1/4" />
      </div>

      {/* Table rows */}
      <div className="space-y-3">
        {[...Array(rows)].map((_, index) => (
          <div key={index} className="flex gap-4">
            <SkeletonLoader className="h-5 w-1/4" />
            <SkeletonLoader className="h-5 w-1/4" />
            <SkeletonLoader className="h-5 w-1/4" />
            <SkeletonLoader className="h-5 w-1/4" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton loader for Average Values section (5 progress bars)
 */
export const AverageValuesSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <div key={index}>
          <div className="flex justify-between mb-1">
            <SkeletonLoader className="h-4 w-48" />
            <SkeletonLoader className="h-4 w-16" />
          </div>
          <SkeletonLoader className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
