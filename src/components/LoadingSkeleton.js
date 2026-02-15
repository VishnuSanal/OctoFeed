'use client'

export default function LoadingSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-24"></div>
        </div>

        {/* Filter Skeleton */}
        <div className="mb-8">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Events Skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              {/* Icon Skeleton */}
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>

              {/* Content Skeleton */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 max-w-md"></div>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 flex-shrink-0"></div>
                </div>

                {/* Optional content skeleton */}
                {Math.random() > 0.5 && (
                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                  </div>
                )}

                {/* Buttons Skeleton */}
                <div className="flex items-center gap-3">
                  <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-full w-24"></div>
                  <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}