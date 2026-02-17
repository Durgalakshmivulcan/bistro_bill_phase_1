import React from 'react';

interface LoadingSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'table' | 'list';
  width?: string;
  height?: string;
  count?: number;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
}) => {
  const baseClasses = 'animate-pulse bg-gray-200';

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded',
    card: 'h-48 rounded-lg',
    table: 'h-12 rounded',
    list: 'h-16 rounded-lg',
  };

  const skeletonElement = (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{
        width: width || (variant === 'circular' ? height : '100%'),
        height: height || undefined,
      }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (count === 1) {
    return skeletonElement;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="mb-2">
          {skeletonElement}
        </div>
      ))}
    </>
  );
};

// Preset skeleton patterns for common UI elements
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-2">
    <LoadingSkeleton variant="table" count={rows} />
  </div>
);

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, index) => (
      <LoadingSkeleton key={index} variant="card" />
    ))}
  </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-3">
    <LoadingSkeleton variant="list" count={count} />
  </div>
);

export const ProductSkeleton: React.FC = () => (
  <div className="rounded-lg border border-gray-200 p-4">
    <LoadingSkeleton variant="rectangular" height="200px" className="mb-4" />
    <LoadingSkeleton variant="text" width="80%" className="mb-2" />
    <LoadingSkeleton variant="text" width="60%" className="mb-4" />
    <div className="flex justify-between">
      <LoadingSkeleton variant="text" width="40%" />
      <LoadingSkeleton variant="text" width="30%" />
    </div>
  </div>
);

export const FormSkeleton: React.FC = () => (
  <div className="space-y-4">
    <LoadingSkeleton variant="text" width="30%" className="mb-2" />
    <LoadingSkeleton variant="rectangular" height="40px" className="mb-4" />
    <LoadingSkeleton variant="text" width="30%" className="mb-2" />
    <LoadingSkeleton variant="rectangular" height="40px" className="mb-4" />
    <LoadingSkeleton variant="text" width="30%" className="mb-2" />
    <LoadingSkeleton variant="rectangular" height="120px" className="mb-4" />
    <LoadingSkeleton variant="rectangular" width="120px" height="40px" />
  </div>
);

export default LoadingSkeleton;
