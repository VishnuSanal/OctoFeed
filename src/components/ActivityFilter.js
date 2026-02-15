'use client'

import { useState } from 'react'

export default function ActivityFilter({ events, onFilter, activeFilter }) {
  const [showFilters, setShowFilters] = useState(false)

  const eventTypes = [
    { type: 'all', label: 'All Activity', icon: '📊', count: events.length },
    { type: 'PushEvent', label: 'Commits', icon: '📝', count: events.filter(e => e.type === 'PushEvent').length },
    { type: 'PullRequestEvent', label: 'Pull Requests', icon: '🔀', count: events.filter(e => e.type === 'PullRequestEvent').length },
    { type: 'IssuesEvent', label: 'Issues', icon: '🐛', count: events.filter(e => e.type === 'IssuesEvent').length },
    { type: 'WatchEvent', label: 'Stars', icon: '⭐', count: events.filter(e => e.type === 'WatchEvent').length },
    { type: 'ForkEvent', label: 'Forks', icon: '🍴', count: events.filter(e => e.type === 'ForkEvent').length },
    { type: 'CreateEvent', label: 'Created', icon: '✨', count: events.filter(e => e.type === 'CreateEvent').length },
  ].filter(filter => filter.count > 0)

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Filter</h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden flex items-center gap-2 px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
        >
          <span className="text-xs">🔍</span>
          {showFilters ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 ${!showFilters ? 'hidden md:grid' : ''}`}>
        {eventTypes.map(({ type, label, icon, count }) => (
          <button
            key={type}
            onClick={() => onFilter(type)}
            className={`group relative p-3 rounded-xl border transition-all duration-200 hover:scale-105 ${
              activeFilter === type
                ? 'bg-purple-500 dark:bg-purple-600 text-white border-purple-500 dark:border-purple-600 shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md'
            }`}
          >
            <div className="flex flex-col items-center space-y-1">
              <span className="text-lg">{icon}</span>
              <span className="text-xs font-medium text-center leading-tight">{label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeFilter === type
                  ? 'bg-white/20 text-white'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              }`}>
                {count}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}