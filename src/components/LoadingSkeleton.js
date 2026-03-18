'use client'

export default function LoadingSkeleton() {
  return (
    <div className="w-full max-w-3xl mx-auto py-6 animate-pulse">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6" />
      <div className="border border-gray-200 dark:border-gray-700 rounded-md divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
