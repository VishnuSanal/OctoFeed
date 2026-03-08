"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Image from "next/image";
import NotificationBanner from "./NotificationBanner";
import LoadingSkeleton from "./LoadingSkeleton";

const EVENTS_PER_PAGE = 50;

const TYPE_META = {
  follow:      { emoji: "👤", label: "Followers",  color: "text-pink-500" },
  star:        { emoji: "⭐", label: "Stars",      color: "text-yellow-500" },
  create_repo: { emoji: "✨", label: "New Repos",  color: "text-green-500" },
  fork_repo:   { emoji: "🍴", label: "Forks",      color: "text-blue-500" },
  star_repo:   { emoji: "⭐", label: "Starred",    color: "text-yellow-500" },
  release:     { emoji: "🚀", label: "Releases",   color: "text-purple-500" },
};

const FILTERS = [
  { type: "all",         label: "All",        icon: "📊" },
  { type: "follow",      label: "Followers",   icon: "👤" },
  { type: "star",        label: "Stars",       icon: "⭐" },
  { type: "star_repo",   label: "Starred",     icon: "⭐" },
  { type: "create_repo", label: "New Repos",   icon: "✨" },
  { type: "fork_repo",   label: "Forks",       icon: "🍴" },
  { type: "release",     label: "Releases",    icon: "🚀" },
];

function eventTitle(ev) {
  const repo = ev.repo ? ev.repo.split("/")[1] : "";
  switch (ev.type) {
    case "follow":
      return `${ev.actor} started following you`;
    case "star":
      return `${ev.actor} starred your repository ${repo}`;
    case "create_repo":
      return `${ev.actor} created a new repository`;
    case "fork_repo":
      return `${ev.actor} forked ${repo}`;
    case "star_repo":
      return `${ev.actor} starred ${repo}`;
    case "release":
      return `${ev.actor} released ${ev.meta?.tag || "a release"} of ${repo}`;
    default:
      return `${ev.actor} performed an action`;
  }
}

function eventLink(ev) {
  if (ev.type === "follow") return `https://github.com/${ev.actor}`;
  if (ev.type === "release" && ev.meta?.url) return ev.meta.url;
  if (ev.type === "fork_repo" && ev.meta?.fork_url) return ev.meta.fork_url;
  if (ev.repo) return `https://github.com/${ev.repo}`;
  return `https://github.com/${ev.actor}`;
}

export default function ClassicFeed() {
  const { data: session } = useSession();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (session) fetchClassicFeed();
  }, [session]);

  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(events.filter((e) => e.type === activeFilter));
    }
    setCurrentPage(1);
  }, [events, activeFilter]);

  const fetchClassicFeed = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/github/classic-feed");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to fetch (${res.status})`);
      }

      const data = await res.json();
      setEvents(data);
      setNotification({
        message: `Loaded ${data.length} feed items`,
        type: "success",
      });
    } catch (err) {
      setError(err.message);
      setNotification({
        message: `Failed to load feed: ${err.message}`,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "recently";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getFilterCounts = () => {
    const counts = { all: events.length };
    for (const event of events) {
      counts[event.type] = (counts[event.type] || 0) + 1;
    }
    return counts;
  };

  if (!session) return null;

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
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">
                Unable to load feed
              </h3>
              <p className="text-red-700 dark:text-red-300">{error}</p>
              <button
                onClick={fetchClassicFeed}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const counts = getFilterCounts();
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / EVENTS_PER_PAGE));
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE
  );

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, "…", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages);
    }
    return pages;
  };

  // Group events by date
  const groupedByDate = {};
  for (const event of paginatedEvents) {
    const dateKey = event.created_at
      ? new Date(event.created_at).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Recent Activity";
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
    groupedByDate[dateKey].push(event);
  }

  return (
    <>
      {notification && (
        <NotificationBanner
          message={notification.message}
          type={notification.type}
          onDismiss={() => setNotification(null)}
        />
      )}

      <div className="w-full max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Your Feed
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {filteredEvents.length} events
                {totalPages > 1 && (
                  <span className="ml-2 text-gray-400 dark:text-gray-500">
                    — page {currentPage} of {totalPages}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={fetchClassicFeed}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              title="Refresh feed"
            >
              <span>🔄</span>
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {FILTERS.map(({ type, label, icon }) => {
              const count = counts[type] || 0;
              if (type !== "all" && count === 0) return null;
              return (
                <button
                  key={type}
                  onClick={() => setActiveFilter(type)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    activeFilter === type
                      ? "bg-purple-500 dark:bg-purple-600 text-white shadow-md"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700"
                  }`}
                >
                  <span>{icon}</span>
                  {label}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeFilter === type
                        ? "bg-white/20"
                        : "bg-gray-100 dark:bg-gray-700"
                    }`}
                  >
                    {type === "all" ? events.length : count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🦗</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No events found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try selecting a different filter to see more activity.
            </p>
          </div>
        ) : (
          <>
            {/* Timeline */}
            {Object.entries(groupedByDate).map(([date, dateEvents]) => (
              <div key={date} className="mb-8">
                <div className="sticky top-16 z-10 mb-3">
                  <span className="inline-block px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
                    {date}
                  </span>
                </div>

                <div className="border-l-2 border-gray-200 dark:border-gray-700 ml-4 space-y-1">
                  {dateEvents.map((event, index) => {
                    const meta = TYPE_META[event.type] || { emoji: "📋" };
                    return (
                      <div
                        key={event.id}
                        className="relative pl-8 py-3 group animate-fadeInUp"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        {/* Timeline dot */}
                        <div className="absolute left-[-9px] top-4 w-4 h-4 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 group-hover:border-purple-500 dark:group-hover:border-purple-400 transition-colors flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 group-hover:bg-purple-500 dark:group-hover:bg-purple-400 transition-colors" />
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-white dark:hover:bg-gray-800/50 transition-colors">
                          {/* Avatar */}
                          <a
                            href={`https://github.com/${event.actor}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0"
                          >
                            <Image
                              src={event.actor_avatar}
                              alt={event.actor}
                              width={32}
                              height={32}
                              className="rounded-full ring-2 ring-gray-100 dark:ring-gray-700 hover:ring-purple-300 dark:hover:ring-purple-600 transition-all"
                            />
                          </a>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base">{meta.emoji}</span>
                              <a
                                href={eventLink(event)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                              >
                                {eventTitle(event)}
                              </a>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {formatDate(event.created_at)}
                              </span>
                            </div>
                            {event.repo && (
                              <a
                                href={`https://github.com/${event.repo}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-gray-500 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors mt-0.5 block"
                              >
                                {event.repo}
                              </a>
                            )}
                          </div>

                          {/* Source badge */}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${
                              event.source === "self"
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                            }`}
                          >
                            {event.source === "self" ? "you" : "following"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center gap-3">
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Prev
                  </button>

                  {getPageNumbers().map((p, i) =>
                    p === "…" ? (
                      <span
                        key={`ellipsis-${i}`}
                        className="px-2 py-2 text-gray-400 dark:text-gray-500 text-sm select-none"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => {
                          setCurrentPage(p);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`w-9 h-9 rounded-lg text-sm font-medium border transition-colors ${
                          currentPage === p
                            ? "bg-purple-500 dark:bg-purple-600 text-white border-purple-500 dark:border-purple-600 shadow-md"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next →
                  </button>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Showing {(currentPage - 1) * EVENTS_PER_PAGE + 1}–
                  {Math.min(currentPage * EVENTS_PER_PAGE, filteredEvents.length)} of{" "}
                  {filteredEvents.length} events
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
