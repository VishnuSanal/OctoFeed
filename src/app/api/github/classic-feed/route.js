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

    // --- A2: Someone starred your repos (stargazers with timestamps) -------
    // Fetch stargazers for each repo in parallel (batched to limit concurrency)
    const STARGAZER_BATCH = 10;
    for (let i = 0; i < repos.length; i += STARGAZER_BATCH) {
      const batch = repos.slice(i, i + STARGAZER_BATCH);
      const results = await Promise.all(
        batch.map((repo) =>
          fetchAllPages(
            `${GITHUB_API}/repos/${repo.full_name}/stargazers`,
            token,
            "application/vnd.github.v3.star+json"
          )
        )
      );
      for (let j = 0; j < batch.length; j++) {
        const repo = batch[j];
        const stargazers = results[j] || [];
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
    }

    // --- B: Events from followed users -------------------------------------
    const FOLLOWING_BATCH = 10;
    for (let i = 0; i < following.length; i += FOLLOWING_BATCH) {
      const batch = following.slice(i, i + FOLLOWING_BATCH);
      const results = await Promise.all(
        batch.map((user) =>
          fetchAllPages(`${GITHUB_API}/users/${user.login}/events`, token)
        )
      );
      for (const userEvents of results) {
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
