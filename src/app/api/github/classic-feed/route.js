import { getToken } from "next-auth/jwt";

const GITHUB_API = "https://api.github.com";

// --- Rate-limit-aware fetch ------------------------------------------------

async function githubFetch(url, token, accept = "application/vnd.github.v3+json") {
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: accept,
      },
    });

    // Secondary rate limit (abuse detection)
    if (res.status === 403) {
      const body = await res.text();
      if (body.includes("abuse") || body.includes("secondary")) {
        const wait = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
        await sleep(wait);
        continue;
      }
    }

    // Primary rate limit exhausted
    const remaining = res.headers.get("X-RateLimit-Remaining");
    if (remaining === "0") {
      const resetEpoch = Number(res.headers.get("X-RateLimit-Reset"));
      const waitMs = Math.max(0, resetEpoch * 1000 - Date.now()) + 1000;
      await sleep(waitMs);
      continue;
    }

    if (!res.ok) return { data: null, res };
    const data = await res.json();
    return { data, res };
  }
  return { data: null, res: null };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- Pagination following Link headers -------------------------------------

function getNextUrl(response) {
  const link = response?.headers?.get("Link");
  if (!link) return null;
  const match = link.match(/<([^>]+)>;\s*rel="next"/);
  return match ? match[1] : null;
}

async function fetchAllPages(baseUrl, token, accept) {
  const all = [];
  let url = baseUrl.includes("per_page") ? baseUrl : `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}per_page=100`;

  while (url) {
    const { data, res } = await githubFetch(url, token, accept);
    if (!data || !Array.isArray(data) || data.length === 0) break;
    all.push(...data);
    url = getNextUrl(res);
  }
  return all;
}

// Fetch only the first page (most recent items) — avoids fetching entire history
async function fetchFirstPage(baseUrl, token, accept) {
  const url = baseUrl.includes("per_page") ? baseUrl : `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}per_page=100`;
  const { data } = await githubFetch(url, token, accept);
  return data || [];
}

// --- Concurrency-limited parallel execution --------------------------------
// Runs up to `limit` promises at a time from an array of thunks (()=>Promise).
// Avoids GitHub secondary rate limits while being much faster than serial batches.

async function parallelLimit(thunks, limit) {
  const results = new Array(thunks.length);
  let next = 0;

  async function worker() {
    while (next < thunks.length) {
      const idx = next++;
      results[idx] = await thunks[idx]();
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, thunks.length) }, () => worker()));
  return results;
}

// --- Main handler ----------------------------------------------------------

export async function GET(request) {
  const jwt = await getToken({ req: request });
  if (!jwt?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const username = jwt.login;
  const token = jwt.accessToken;

  try {
    // --- Parallel: received_events, user repos, following list -------------
    const [receivedEvents, repos, following] = await Promise.all([
      fetchAllPages(`${GITHUB_API}/users/${username}/received_events`, token),
      fetchAllPages(`${GITHUB_API}/user/repos?type=owner`, token),
      fetchAllPages(`${GITHUB_API}/users/${username}/following`, token),
    ]);

    const events = []; // normalized events
    const seenIds = new Set();

    function addEvent(ev) {
      if (seenIds.has(ev.id)) return;
      seenIds.add(ev.id);
      events.push(ev);
    }

    // --- A1: Someone followed the authenticated user -----------------------
    for (const ev of receivedEvents) {
      if (ev.type === "FollowEvent") {
        addEvent({
          id: ev.id,
          type: "follow",
          actor: ev.actor.login,
          actor_avatar: ev.actor.avatar_url,
          repo: null,
          created_at: ev.created_at,
          source: "self",
        });
      }
    }

    // --- A2: Someone starred your repos (recent stargazers) ----------------
    // Fetch only the FIRST PAGE of stargazers per repo (most recent 100).
    // Run all repos concurrently with a concurrency limit of 30.
    const stargazerThunks = repos.map((repo) => () =>
      fetchFirstPage(
        `${GITHUB_API}/repos/${repo.full_name}/stargazers`,
        token,
        "application/vnd.github.v3.star+json"
      ).then((stargazers) => ({ repo, stargazers }))
    );

    const stargazerResults = await parallelLimit(stargazerThunks, 30);

    for (const { repo, stargazers } of stargazerResults) {
      for (const sg of stargazers) {
        if (!sg.user || sg.user.login === username) continue;
        const id = `star-${repo.full_name}-${sg.user.login}-${sg.starred_at}`;
        addEvent({
          id,
          type: "star",
          actor: sg.user.login,
          actor_avatar: sg.user.avatar_url,
          repo: repo.full_name,
          repo_description: repo.description || null,
          repo_language: repo.language || null,
          created_at: sg.starred_at,
          source: "self",
        });
      }
    }

    // --- B: Events from followed users -------------------------------------
    // Fetch only the FIRST PAGE of events per user (most recent 100).
    // Run all users concurrently with a concurrency limit of 30.
    const followingThunks = following.map((user) => () =>
      fetchFirstPage(
        `${GITHUB_API}/users/${user.login}/events`,
        token
      )
    );

    const followingResults = await parallelLimit(followingThunks, 30);

    for (const userEvents of followingResults) {
      for (const ev of userEvents || []) {
        if (ev.type === "CreateEvent" && ev.payload?.ref_type === "repository") {
          addEvent({
            id: ev.id,
            type: "create_repo",
            actor: ev.actor.login,
            actor_avatar: ev.actor.avatar_url,
            repo: ev.repo.name,
            repo_description: ev.payload?.description || null,
            repo_language: null,
            created_at: ev.created_at,
            source: "following",
          });
        } else if (ev.type === "ForkEvent") {
          addEvent({
            id: ev.id,
            type: "fork_repo",
            actor: ev.actor.login,
            actor_avatar: ev.actor.avatar_url,
            repo: ev.repo.name,
            repo_description: ev.payload?.forkee?.description || null,
            repo_language: ev.payload?.forkee?.language || null,
            created_at: ev.created_at,
            source: "following",
            meta: { fork_url: ev.payload?.forkee?.html_url },
          });
        } else if (ev.type === "WatchEvent") {
          addEvent({
            id: ev.id,
            type: "star_repo",
            actor: ev.actor.login,
            actor_avatar: ev.actor.avatar_url,
            repo: ev.repo.name,
            repo_description: null,
            repo_language: null,
            created_at: ev.created_at,
            source: "following",
          });
        } else if (ev.type === "ReleaseEvent") {
          addEvent({
            id: ev.id,
            type: "release",
            actor: ev.actor.login,
            actor_avatar: ev.actor.avatar_url,
            repo: ev.repo.name,
            repo_description: null,
            repo_language: null,
            created_at: ev.created_at,
            source: "following",
            meta: {
              tag: ev.payload?.release?.tag_name,
              url: ev.payload?.release?.html_url,
            },
          });
        }
      }
    }

    // --- Sort: newest first, stable ----------------------------------------
    events.sort((a, b) => {
      const da = a.created_at ? new Date(a.created_at).getTime() : 0;
      const db = b.created_at ? new Date(b.created_at).getTime() : 0;
      return db - da;
    });

    return Response.json(events);
  } catch (err) {
    console.error("Classic feed error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
