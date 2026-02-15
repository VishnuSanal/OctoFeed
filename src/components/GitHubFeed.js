'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function GitHubFeed() {
  const { data: session } = useSession()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (session?.user?.name) {
      fetchEvents()
    }
  }, [session])

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
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatEventType = (type) => {
    return type.replace(/([A-Z])/g, ' $1').replace('Event', '').trim()
  }

  const getEventDescription = (event) => {
    const actor = event.actor.login
    const repo = event.repo.name

    switch (event.type) {
      case 'PushEvent':
        // TODO: commit message
        return `${actor} pushed 1 commit to ${repo}/${event.payload.ref.replace('refs\/heads\/', '')}`

      case 'PullRequestEvent':
        const action = event.payload.action
        return `${actor} ${action} a pull request in ${repo}`

      case 'IssuesEvent':
        return `${actor} ${event.payload.action} an issue in ${repo}`

      case 'IssueCommentEvent':
        return `${actor} commented on an issue in ${repo}`

      case 'WatchEvent':
        return `${actor} starred ${repo}`

      case 'ForkEvent':
        return `${actor} forked ${repo}`

      case 'CreateEvent':
        const refType = event.payload.ref_type
        return `${actor} created ${event.payload.ref_type} in ${repo} (${event.payload.ref})`

      case 'DeleteEvent':
        return `${actor} deleted ${event.payload.ref_type}: ${repo}/${event.payload.ref}`

      case 'ReleaseEvent':
        return `${actor} released ${event.payload.release.tag_name} in ${repo}`

      case 'PublicEvent':
        return `${actor} made ${repo} public`

      case 'MemberEvent':
        return `${actor} ${event.payload.action} a member to ${event.payload.action}`

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
      <div className="w-full max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">Error: {error}</p>
          <button
            onClick={fetchEvents}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Your GitHub Feed
        </h2>
        <button
          onClick={fetchEvents}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          title="Refresh feed"
        >
          🔄 Refresh
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">No recent events found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <Image
                  src={event.actor.avatar_url}
                  alt="User Profile"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                {/* <span className="text-2xl flex-shrink-0">{}</span>*/}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-900 dark:text-gray-100 break-words">
                      {getEventDescription(event)}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                      {formatDate(event.created_at)}
                    </span>
                  </div>

                  {(event.payload.pull_request?.title || event.payload.issue?.title) && (
                    <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {event.payload.pull_request?.title || event.payload.issue?.title}
                    </p>
                  )}

                  <a
                    href={`${getEventLink(event)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Go →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
