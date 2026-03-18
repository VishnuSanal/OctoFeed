"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import NotificationBanner from "./NotificationBanner";
import LoadingSkeleton from "./LoadingSkeleton";

const EVENTS_PER_PAGE = 50;

const LANGUAGE_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Lua: "#000080",
  "Vim Script": "#199f4b",
  Elixir: "#6e4a7e",
  Scala: "#c22d40",
  Haskell: "#5e5086",
  Zig: "#ec915c",
  Nix: "#7e7eff",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Jupyter: "#DA5B0B",
};

const TYPE_META = {
  follow:      { label: "Followers",  verb: "followed you" },
  star:        { label: "Stars",      verb: "starred" },
  create_repo: { label: "New Repos",  verb: "created a repository" },
  fork_repo:   { label: "Forks",      verb: "forked" },
  star_repo:   { label: "Starred",    verb: "starred" },
  release:     { label: "Releases",   verb: "released" },
};

const FILTERS = [
  { type: "all",         label: "All" },
  { type: "follow",      label: "Followers" },
  { type: "star",        label: "Stars" },
  { type: "star_repo",   label: "Starred" },
  { type: "create_repo", label: "New Repos" },
  { type: "fork_repo",   label: "Forks" },
  { type: "release",     label: "Releases" },
];

// Event type icon SVGs (GitHub-style)
function EventTypeIcon({ type }) {
  const iconClass = "w-3.5 h-3.5";
  switch (type) {
    case "follow":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="currentColor">
          <path d="M10.5 5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm.061 3.073a4 4 0 1 0-5.123 0 6.004 6.004 0 0 0-3.431 5.142.75.75 0 0 0 1.498.07 4.5 4.5 0 0 1 8.99 0 .75.75 0 1 0 1.498-.07 6.005 6.005 0 0 0-3.432-5.142Z" />
        </svg>
      );
    case "star":
    case "star_repo":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
        </svg>
      );
    case "create_repo":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
        </svg>
      );
    case "fork_repo":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="currentColor">
          <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
        </svg>
      );
    case "release":
      return (
        <svg className={iconClass} viewBox="0 0 16 16" fill="currentColor">
          <path d="M1 7.775V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 0 1 0 2.474l-5.026 5.026a1.75 1.75 0 0 1-2.474 0l-6.25-6.25A1.752 1.752 0 0 1 1 7.775Zm1.5 0c0 .066.026.13.073.177l6.25 6.25a.25.25 0 0 0 .354 0l5.025-5.025a.25.25 0 0 0 0-.354l-6.25-6.25a.25.25 0 0 0-.177-.073H2.75a.25.25 0 0 0-.25.25ZM6 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
        </svg>
      );
    default:
      return null;
  }
}

function RepoIcon() {
  return (
    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
    </svg>
  );
}

function StarIcon({ filled }) {
  if (filled) {
    return (
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z" />
    </svg>
  );
}

function eventTitle(ev) {
  const meta = TYPE_META[ev.type] || { verb: "performed an action" };
  switch (ev.type) {
    case "follow":
      return <><strong>{ev.actor}</strong> {meta.verb}</>;
    case "star":
      return <><strong>{ev.actor}</strong> {meta.verb} your repository <strong>{ev.repo?.split("/")[1]}</strong></>;
    case "create_repo":
      return <><strong>{ev.actor}</strong> {meta.verb}</>;
    case "fork_repo":
      return <><strong>{ev.actor}</strong> {meta.verb} <strong>{ev.repo?.split("/")[1]}</strong></>;
    case "star_repo":
      return <><strong>{ev.actor}</strong> {meta.verb} a repository</>;
    case "release":
      return <><strong>{ev.actor}</strong> {meta.verb} {ev.meta?.tag || "a version"} of <strong>{ev.repo?.split("/")[1]}</strong></>;
    default:
      return <><strong>{ev.actor}</strong> performed an action</>;
  }
}

/**
 * Group consecutive events that share the same actor + type.
 * Returns an array of { actor, actor_avatar, type, created_at, source, events: [...] }
 */
function groupConsecutiveEvents(events) {
  const groups = [];
  for (const event of events) {
    const last = groups[groups.length - 1];
    if (last && last.actor === event.actor && last.type === event.type) {
      last.events.push(event);
    } else {
      groups.push({
        actor: event.actor,
        actor_avatar: event.actor_avatar,
        type: event.type,
        created_at: event.created_at,
        source: event.source,
        events: [event],
      });
    }
  }
  return groups;
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
  const [repoInfo, setRepoInfo] = useState({});
  const [starredRepos, setStarredRepos] = useState(new Set());
  const [starringInProgress, setStarringInProgress] = useState(new Set());

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

  // Fetch missing repo info and check starred status when events load
  useEffect(() => {
    if (events.length === 0) return;

    const allRepos = new Set();
    const missingRepos = new Set();
    for (const ev of events) {
      if (ev.repo) {
        allRepos.add(ev.repo);
        if (!ev.repo_description && !repoInfo[ev.repo]) {
          missingRepos.add(ev.repo);
        }
      }
    }

    // Fetch repo info (descriptions, languages, star counts) for all repos
    if (allRepos.size > 0) {
      const repos = Array.from(allRepos).slice(0, 50);
      fetch(`/api/github/repo-info?repos=${repos.join(",")}`)
        .then((r) => r.json())
        .then((data) => setRepoInfo((prev) => ({ ...prev, ...data })))
        .catch(() => {});
    }

    // Check which repos are already starred
    if (allRepos.size > 0) {
      const repos = Array.from(allRepos).slice(0, 100);
      fetch("/api/github/star", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check", repos }),
      })
        .then((r) => r.json())
        .then((data) => {
          const starred = new Set();
          for (const [repo, isStarred] of Object.entries(data)) {
            if (isStarred) starred.add(repo);
          }
          setStarredRepos(starred);
        })
        .catch(() => {});
    }
  }, [events]);

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
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const toggleStar = useCallback(async (repo) => {
    if (starringInProgress.has(repo)) return;
    setStarringInProgress((prev) => new Set(prev).add(repo));

    const isStarred = starredRepos.has(repo);
    const action = isStarred ? "unstar" : "star";

    try {
      const res = await fetch("/api/github/star", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, repo }),
      });
      if (res.ok) {
        setStarredRepos((prev) => {
          const next = new Set(prev);
          if (isStarred) next.delete(repo);
          else next.add(repo);
          return next;
        });
        // Update star count in repoInfo
        setRepoInfo((prev) => {
          const info = prev[repo];
          if (!info) return prev;
          return {
            ...prev,
            [repo]: {
              ...info,
              stargazers_count: (info.stargazers_count || 0) + (isStarred ? -1 : 1),
            },
          };
        });
      }
    } catch (err) {
        console.error(
          `Network or unexpected error while trying to ${action} repo "${repo}":`,
          err,
        );
    } finally {
      setStarringInProgress((prev) => {
        const next = new Set(prev);
        next.delete(repo);
        return next;
      });
    }
  }, [starredRepos, starringInProgress]);

  const getFilterCounts = () => {
    const counts = { all: events.length };
    for (const event of events) {
      counts[event.type] = (counts[event.type] || 0) + 1;
    }
    return counts;
  };

  const getRepoDescription = (event) => {
    if (event.repo_description) return event.repo_description;
    if (repoInfo[event.repo]) return repoInfo[event.repo].description;
    return null;
  };

  const getRepoLanguage = (event) => {
    if (event.repo_language) return event.repo_language;
    if (repoInfo[event.repo]) return repoInfo[event.repo].language;
    return null;
  };

  const getStarCount = (event) => {
    if (repoInfo[event.repo]?.stargazers_count != null) return repoInfo[event.repo].stargazers_count;
    return null;
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
      <div className="w-full max-w-3xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">!</span>
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
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  const groups = groupConsecutiveEvents(paginatedEvents);

  return (
    <>
      {notification && (
        <NotificationBanner
          message={notification.message}
          type={notification.type}
          onDismiss={() => setNotification(null)}
        />
      )}

      <div className="w-full max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Your Feed
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {filteredEvents.length} events
                {totalPages > 1 && (
                  <span className="ml-2 text-gray-400 dark:text-gray-500">
                    &mdash; page {currentPage} of {totalPages}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={fetchClassicFeed}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Refresh feed"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map(({ type, label }) => {
              const count = counts[type] || 0;
              if (type !== "all" && count === 0) return null;
              return (
                <button
                  key={type}
                  onClick={() => setActiveFilter(type)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    activeFilter === type
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                  }`}
                >
                  {label}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      activeFilter === type
                        ? "bg-white/20"
                        : "bg-gray-200 dark:bg-gray-700"
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
          <div className="text-center py-16 border border-gray-200 dark:border-gray-700 rounded-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No events found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Try selecting a different filter to see more activity.
            </p>
          </div>
        ) : (
          <>
            {/* Feed items */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
              {groups.map((group, groupIndex) => (
                <div
                  key={`${group.actor}-${group.type}-${group.events[0].id}`}
                  className={`${groupIndex > 0 ? "border-t border-gray-200 dark:border-gray-700" : ""}`}
                >
                  {/* Event header */}
                  <div className="flex items-center gap-3 px-4 pt-3 pb-2">
                    {/* Avatar with event type badge */}
                    <div className="relative flex-shrink-0">
                      <a
                        href={`https://github.com/${group.actor}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Image
                          src={group.actor_avatar}
                          alt={group.actor}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      </a>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-900 flex items-center justify-center text-gray-600 dark:text-gray-300">
                        <EventTypeIcon type={group.type} />
                      </div>
                    </div>

                    {/* Title + time */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {eventTitle(group.events[0])}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(group.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Repo cards for each event in the group */}
                  <div className="px-4 pb-3 pl-14 space-y-2">
                    {group.events.map((event) => {
                      if (!event.repo) return null;
                      const description = getRepoDescription(event);
                      const language = getRepoLanguage(event);
                      const langColor = language ? LANGUAGE_COLORS[language] || "#8b8b8b" : null;
                      const starCount = getStarCount(event);
                      const isStarred = starredRepos.has(event.repo);
                      const isStarring = starringInProgress.has(event.repo);

                      return (
                        <div
                          key={event.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-md p-3 bg-gray-50 dark:bg-gray-800/50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <RepoIcon />
                                <a
                                  href={`https://github.com/${event.repo}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline truncate"
                                >
                                  {event.repo}
                                </a>
                              </div>
                              {description && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5 line-clamp-2">
                                  {description}
                                </p>
                              )}
                              {(language || starCount != null) && (
                                <div className="flex items-center gap-4">
                                  {language && (
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className="w-3 h-3 rounded-full inline-block"
                                        style={{ backgroundColor: langColor }}
                                      />
                                      <span className="text-xs text-gray-600 dark:text-gray-400">
                                        {language}
                                      </span>
                                    </div>
                                  )}
                                  {starCount != null && (
                                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
                                      </svg>
                                      <span className="text-xs">
                                        {starCount.toLocaleString()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Star button */}
                            {/* <button
                              onClick={() => toggleStar(event.repo)}
                              disabled={isStarring}
                              className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md border transition-colors flex-shrink-0 ${
                                isStarred
                                  ? "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-yellow-600 dark:text-yellow-400"
                                  : "bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              } ${isStarring ? "opacity-50 cursor-wait" : ""}`}
                            >
                              <StarIcon filled={isStarred} />
                              {isStarred ? "Starred" : "Star"}
                            </button> */}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex flex-col items-center gap-2">
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  {getPageNumbers().map((p, i) =>
                    p === "..." ? (
                      <span
                        key={`ellipsis-${i}`}
                        className="px-2 py-1.5 text-gray-400 dark:text-gray-500 text-sm select-none"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => {
                          setCurrentPage(p);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`w-8 h-8 rounded-md text-sm font-medium border transition-colors ${
                          currentPage === p
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                    className="px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Showing {(currentPage - 1) * EVENTS_PER_PAGE + 1}&ndash;
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
