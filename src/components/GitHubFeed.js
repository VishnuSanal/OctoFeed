'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import ActivityFilter from './ActivityFilter'
import NotificationBanner from './NotificationBanner'
import LoadingSkeleton from './LoadingSkeleton'

export default function GitHubFeed() {
  const { data: session } = useSession()
  const [events, setEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    if (session?.user?.name) {
      fetchEvents()
    }
  }, [session])

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredEvents(events)
    } else {
      setFilteredEvents(events.filter(event => event.type === activeFilter))
    }
  }, [events, activeFilter])

  const handleFilter = (filterType) => {
    setActiveFilter(filterType)
  }

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)

      // Extract username from session - try multiple sources
      let username = session.user.login || session.user.name

      if (!username) {
        throw new Error('Unable to determine GitHub username')
      }

      const response = await fetch(`https://api.github.com/users/${username}/received_events?per_page=100`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`GitHub user '${username}' not found`)
        }
        throw new Error(`Failed to fetch events (${response.status})`)
      }

      const data = await response.json()
      setEvents(data)

      // Show success notification
      setNotification({
        message: `Loaded ${data.length} recent activities`,
        type: 'success'
      })
    } catch (err) {
      setError(err.message)
      setNotification({
        message: `Failed to load activities: ${err.message}`,
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatEventType = (type) => {
    return type.replace(/([A-Z])/g, ' $1').replace('Event', '').trim()
  }

  const getEventIcon = (type) => {
    switch (type) {
      case 'PushEvent':
        return '📝'
      case 'PullRequestEvent':
        return '🔀'
      case 'IssuesEvent':
        return '🐛'
      case 'IssueCommentEvent':
        return '💬'
      case 'WatchEvent':
        return '⭐'
      case 'ForkEvent':
        return '🍴'
      case 'CreateEvent':
        return '✨'
      case 'DeleteEvent':
        return '🗑️'
      case 'ReleaseEvent':
        return '🚀'
      case 'PublicEvent':
        return '🌍'
      case 'MemberEvent':
        return '👥'
      default:
        return '📋'
    }
  }

  const getEventDescription = (event) => {
    const actor = event.actor.login
    const repo = event.repo.name

    switch (event.type) {
      case 'PushEvent':
        const commitCount = event.payload.commits?.length || 1
        return `${actor} pushed ${commitCount} commit${commitCount > 1 ? 's' : ''} to ${repo}`

      case 'PullRequestEvent':
        const action = event.payload.action
        const prNumber = event.payload.pull_request?.number
        return `${actor} ${action} pull request #${prNumber} in ${repo}`

      case 'IssuesEvent':
        const issueNumber = event.payload.issue?.number
        return `${actor} ${event.payload.action} issue #${issueNumber} in ${repo}`

      case 'IssueCommentEvent':
        return `${actor} commented on an issue in ${repo}`

      case 'WatchEvent':
        return `${actor} starred ${repo}`

      case 'ForkEvent':
        return `${actor} forked ${repo}`

      case 'CreateEvent':
        const refType = event.payload.ref_type
        const ref = event.payload.ref
        return `${actor} created ${refType}${ref ? ` "${ref}"` : ''} in ${repo}`

      case 'DeleteEvent':
        return `${actor} deleted ${event.payload.ref_type} "${event.payload.ref}" in ${repo}`

      case 'ReleaseEvent':
        return `${actor} released ${event.payload.release.tag_name} in ${repo}`

      case 'PublicEvent':
        return `${actor} made ${repo} public`

      case 'MemberEvent':
        return `${actor} ${event.payload.action} a member to ${repo}`

      default:
        return `${actor} ${formatEventType(event.type)} in ${repo}`
    }
  }

  const getEventLink = (event) => {
    switch (event.type) {
      case 'PushEvent':
        return `https://github.com/${event.repo.name}/tree/${event.payload.ref.replace('refs\/heads\/', '')}`

      case 'PullRequestEvent':
        return `https://github.com/${event.repo.name}/pull/${event.payload.pull_request.number}`

      case 'IssuesEvent':
        return `${event.payload.issue.html_url}`

      case 'IssueCommentEvent':
        return `${event.payload.issue.html_url}`

      case 'WatchEvent':
        return `https://github.com/${event.repo.name}`

      case 'ForkEvent':
        return `${event.payload.html_url}`

      case 'CreateEvent':
        return `https://github.com/${event.repo.name}`

      case 'DeleteEvent':
        return `https://github.com/${event.repo.name}`

      case 'ReleaseEvent':
        return `${event.payload.release.html_url}`

      case 'PublicEvent':
        return `https://github.com/${event.repo.name}`

      case 'MemberEvent':
        return `${event.payload.member.html_url}`

      default:
        return `https://github.com/${event.repo.name}`
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

    return date.toLocaleDateString()
  }

  if (!session) {
    return null
  }

  if (loading) {
    return (
      <>
        {notification && (
          <NotificationBanner
            message={notification.message}
            type={notification.type}
            onDismiss={() => setNotification(null)}
          />
        )}
        <LoadingSkeleton />
      </>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Unable to load GitHub feed</h3>
              <p className="text-red-700 dark:text-red-300">{error}</p>
              <button
                onClick={fetchEvents}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const eventStats = filteredEvents.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1
    return acc
  }, {})

  return (
    <>
      {/* Notification Banner */}
      {notification && (
        <NotificationBanner
          message={notification.message}
          type={notification.type}
          onDismiss={() => setNotification(null)}
        />
      )}

      <div className="w-full max-w-4xl mx-auto p-6">
        {/* Header with Stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Your GitHub Feed
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {filteredEvents.length} {activeFilter === 'all' ? 'recent activities' : `${activeFilter.replace('Event', '').toLowerCase()} events`}
              </p>
            </div>
            <button
              onClick={fetchEvents}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              title="Refresh feed"
            >
              <span className="">🔄</span>
              Refresh
            </button>
          </div>

          {/* Activity Filter */}
          <ActivityFilter
            events={events}
            onFilter={handleFilter}
            activeFilter={activeFilter}
          />

          {/* Activity Stats */}
          {Object.keys(eventStats).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
              {Object.entries(eventStats)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 6)
                .map(([type, count]) => (
                  <div key={type} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getEventIcon(type)}</span>
                      <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{count}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                      {formatEventType(type)}
                    </p>
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🦗</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {activeFilter === 'all' ? "It's quiet here" : `No ${activeFilter.replace('Event', '').toLowerCase()} events found`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {activeFilter === 'all'
                ? "No recent events found in your GitHub activity feed."
                : `Try selecting a different filter to see more activity.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event, index) => (
              <div
                key={event.id}
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200 transform hover:-translate-y-1 animate-fadeInUp"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  {/* Event Icon */}
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full flex items-center justify-center text-lg border border-purple-200 dark:border-purple-800">
                    {getEventIcon(event.type)}
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Image
                          src={event.actor.avatar_url}
                          alt={event.actor.login}
                          width={24}
                          height={24}
                          className="rounded-full ring-2 ring-gray-100 dark:ring-gray-700"
                        />
                        <p className="text-sm text-gray-900 dark:text-gray-100 break-words leading-relaxed">
                          {getEventDescription(event)}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0 font-medium">
                        {formatDate(event.created_at)}
                      </span>
                    </div>

                    {/* Event Details */}
                    {(event.payload.pull_request?.title || event.payload.issue?.title) && (
                      <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">
                          {event.payload.pull_request?.title || event.payload.issue?.title}
                        </p>
                        {event.payload.pull_request?.body && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {event.payload.pull_request.body.substring(0, 100)}...
                          </p>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                      <a
                        href={getEventLink(event)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                      >
                        View on GitHub
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>

                      {/* Repository link */}
                      <a
                        href={`https://github.com/${event.repo.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        📁 {event.repo.name.split('/')[1]}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
