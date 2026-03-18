"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import LoadingSkeleton from "./LoadingSkeleton";

const EVENTS_PER_PAGE = 50;

const LANGUAGE_COLORS = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5",
  Java: "#b07219", Go: "#00ADD8", Rust: "#dea584", Ruby: "#701516",
  PHP: "#4F5D95", "C++": "#f34b7d", C: "#555555", "C#": "#178600",
  Swift: "#F05138", Kotlin: "#A97BFF", Dart: "#00B4AB", Shell: "#89e051",
  HTML: "#e34c26", CSS: "#563d7c", Lua: "#000080", "Vim Script": "#199f4b",
  Elixir: "#6e4a7e", Scala: "#c22d40", Haskell: "#5e5086", Zig: "#ec915c",
  Nix: "#7e7eff", Vue: "#41b883", Svelte: "#ff3e00", Jupyter: "#DA5B0B",
};

const FILTERS = [
  { type: "all",         label: "All" },
  { type: "follow",      label: "Followers" },
  { type: "star",        label: "Stars" },
  { type: "star_repo",   label: "Starred" },
  { type: "create_repo", label: "New repos" },
  { type: "fork_repo",   label: "Forks" },
  { type: "release",     label: "Releases" },
];

function dayLabel(dateString) {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today - eventDay) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

function groupByDay(events) {
  const groups = [];
  let currentLabel = null;
  for (const ev of events) {
    const label = dayLabel(ev.created_at);
    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ label, events: [] });
    }
    groups[groups.length - 1].events.push(ev);
  }
  return groups;
}

function eventText(ev) {
  switch (ev.type) {
    case "follow":
      return " followed you";
    case "star":
      return <> starred <a href={`https://github.com/${ev.repo}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-900 dark:text-gray-100 hover:underline">{ev.repo}</a></>;
    case "create_repo":
      return <> created <a href={`https://github.com/${ev.repo}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-900 dark:text-gray-100 hover:underline">{ev.repo}</a></>;
    case "fork_repo":
      return <> forked <a href={`https://github.com/${ev.repo}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-900 dark:text-gray-100 hover:underline">{ev.repo}</a></>;
    case "star_repo":
      return <> starred <a href={`https://github.com/${ev.repo}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-900 dark:text-gray-100 hover:underline">{ev.repo}</a></>;
    case "release":
      return <> released <a href={ev.meta?.url || `https://github.com/${ev.repo}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-900 dark:text-gray-100 hover:underline">{ev.meta?.tag || "a version"}</a> of <a href={`https://github.com/${ev.repo}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-900 dark:text-gray-100 hover:underline">{ev.repo}</a></>;
    default:
      return " performed an action";
  }
}

function formatDate(dateString) {
  if (!dateString) return "";
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ClassicFeed() {
  const { data: session } = useSession();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [repoInfo, setRepoInfo] = useState({});

  useEffect(() => {
    if (session) fetchFeed();
  }, [session]);

  useEffect(() => {
    setFilteredEvents(
      activeFilter === "all" ? events : events.filter((e) => e.type === activeFilter)
    );
    setCurrentPage(1);
  }, [events, activeFilter]);

  useEffect(() => {
    if (events.length === 0) return;
    const repos = [...new Set(events.filter((e) => e.repo).map((e) => e.repo))];
    if (repos.length > 0) {
      fetch("/api/github/repo-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repos }),
      })
        .then((r) => r.json())
        .then((data) => setRepoInfo((prev) => ({ ...prev, ...data })))
        .catch(() => {});
    }
  }, [events]);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/github/classic-feed");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to fetch (${res.status})`);
      }
      setEvents(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDescription = (ev) => ev.repo_description || repoInfo[ev.repo]?.description || null;
  const getLanguage = (ev) => ev.repo_language || repoInfo[ev.repo]?.language || null;
  const getStars = (ev) => repoInfo[ev.repo]?.stargazers_count ?? null;

  if (!session) return null;
  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="w-full max-w-3xl mx-auto py-8 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{error}</p>
        <button onClick={fetchFeed} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  const counts = { all: events.length };
  for (const e of events) counts[e.type] = (counts[e.type] || 0) + 1;

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / EVENTS_PER_PAGE));
  const page = filteredEvents.slice((currentPage - 1) * EVENTS_PER_PAGE, currentPage * EVENTS_PER_PAGE);

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 mb-4 overflow-x-auto">
        {FILTERS.map(({ type, label }) => {
          const count = counts[type] || 0;
          if (type !== "all" && count === 0) return null;
          return (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeFilter === type
                  ? "border-orange-500 font-semibold text-gray-900 dark:text-gray-100"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              {label}
              <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">
                {type === "all" ? events.length : count}
              </span>
            </button>
          );
        })}

        <div className="ml-auto flex-shrink-0 pb-1">
          <button
            onClick={fetchFeed}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Refresh"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z" />
            </svg>
          </button>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-12">
          No events to show.
        </p>
      ) : (
        <>
          {/* Event list grouped by day */}
          {groupByDay(page).map((group) => (
            <div key={group.label} className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                {group.label}
              </h3>
              <div className="border border-gray-200 dark:border-gray-700 rounded-md divide-y divide-gray-200 dark:divide-gray-700">
                {group.events.map((ev) => {
                  const desc = getDescription(ev);
                  const lang = getLanguage(ev);
                  const stars = getStars(ev);

                  return (
                    <div key={ev.id} className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <a href={`https://github.com/${ev.actor}`} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                          <img
                            src={ev.actor_avatar}
                            alt={ev.actor}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        </a>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <a
                              href={`https://github.com/${ev.actor}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-gray-900 dark:text-gray-100 hover:underline"
                            >
                              {ev.actor}
                            </a>
                            {eventText(ev)}
                          </p>

                          {desc && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                              {desc}
                            </p>
                          )}

                          {(lang || stars != null) && (
                            <div className="flex items-center gap-3 mt-1">
                              {lang && (
                                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: LANGUAGE_COLORS[lang] || "#8b8b8b" }} />
                                  {lang}
                                </span>
                              )}
                              {stars != null && (
                                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" /></svg>
                                  {stars.toLocaleString()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Time */}
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 whitespace-nowrap mt-0.5">
                          {formatDate(ev.created_at)}
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
            <div className="flex items-center justify-between mt-4 text-sm">
              <button
                onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
