import { getToken } from "next-auth/jwt";

const GITHUB_API = "https://api.github.com";

async function githubFetch(url, token) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchAllPages(baseUrl, token, maxPages = 3) {
  const all = [];
  for (let page = 1; page <= maxPages; page++) {
    const sep = baseUrl.includes("?") ? "&" : "?";
    const data = await githubFetch(
      `${baseUrl}${sep}per_page=100&page=${page}`,
      token
    );
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < 100) break;
  }
  return all;
}

export async function GET(request) {
  const jwt = await getToken({ req: request });
  if (!jwt?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const username = jwt.login;
  const token = jwt.accessToken;

  try {
    // 1. Fetch received_events (activity from people you follow) and user's repos in parallel
    const [receivedEvents, repos, followers] = await Promise.all([
      fetchAllPages(`${GITHUB_API}/users/${username}/received_events`, token),
      githubFetch(
        `${GITHUB_API}/user/repos?sort=pushed&per_page=30&affiliation=owner`,
        token
      ),
      githubFetch(
        `${GITHUB_API}/users/${username}/followers?per_page=50`,
        token
      ),
    ]);

    // 2. Fetch events for top repos to find stars/forks on YOUR repos
    const topRepos = (repos || []).slice(0, 15);
    const repoEventResults = await Promise.all(
      topRepos.map((repo) =>
        githubFetch(
          `${GITHUB_API}/repos/${repo.full_name}/events?per_page=100`,
          token
        )
      )
    );

    const classicEvents = [];

    // Process received_events — activity from people you follow
    for (const event of receivedEvents) {
      if (event.type === "WatchEvent") {
        classicEvents.push({
          id: event.id,
          classicType: "follow_star",
          icon: "star",
          title: `${event.actor.login} starred ${event.repo.name.split("/")[1]}`,
          subtitle: event.repo.name,
          actor: { login: event.actor.login, avatar_url: event.actor.avatar_url },
          link: `https://github.com/${event.repo.name}`,
          created_at: event.created_at,
        });
      } else if (event.type === "ForkEvent") {
        classicEvents.push({
          id: event.id,
          classicType: "follow_fork",
          icon: "fork",
          title: `${event.actor.login} forked ${event.repo.name.split("/")[1]}`,
          subtitle: event.repo.name,
          actor: { login: event.actor.login, avatar_url: event.actor.avatar_url },
          link: event.payload?.forkee?.html_url || `https://github.com/${event.repo.name}`,
          created_at: event.created_at,
        });
      } else if (
        event.type === "CreateEvent" &&
        event.payload?.ref_type === "repository"
      ) {
        classicEvents.push({
          id: event.id,
          classicType: "follow_create",
          icon: "repo",
          title: `${event.actor.login} created a new repository`,
          subtitle: event.repo.name,
          actor: { login: event.actor.login, avatar_url: event.actor.avatar_url },
          link: `https://github.com/${event.repo.name}`,
          created_at: event.created_at,
        });
      } else if (event.type === "ReleaseEvent") {
        const tag = event.payload?.release?.tag_name || "a release";
        classicEvents.push({
          id: event.id,
          classicType: "follow_release",
          icon: "release",
          title: `${event.actor.login} released ${tag} of ${event.repo.name.split("/")[1]}`,
          subtitle: event.repo.name,
          actor: { login: event.actor.login, avatar_url: event.actor.avatar_url },
          link: event.payload?.release?.html_url || `https://github.com/${event.repo.name}`,
          created_at: event.created_at,
        });
      }
    }

    // Process repo events — stars and forks on YOUR repos by others
    const seenIds = new Set(classicEvents.map((e) => e.id));
    for (const events of repoEventResults) {
      if (!events) continue;
      for (const event of events) {
        if (seenIds.has(event.id)) continue;
        if (event.actor.login === username) continue; // skip own activity

        if (event.type === "WatchEvent") {
          seenIds.add(event.id);
          classicEvents.push({
            id: event.id,
            classicType: "repo_star",
            icon: "star",
            title: `${event.actor.login} starred your repository ${event.repo.name.split("/")[1]}`,
            subtitle: event.repo.name,
            actor: { login: event.actor.login, avatar_url: event.actor.avatar_url },
            link: `https://github.com/${event.repo.name}`,
            created_at: event.created_at,
          });
        } else if (event.type === "ForkEvent") {
          seenIds.add(event.id);
          classicEvents.push({
            id: event.id,
            classicType: "repo_fork",
            icon: "fork",
            title: `${event.actor.login} forked your repository ${event.repo.name.split("/")[1]}`,
            subtitle: event.repo.name,
            actor: { login: event.actor.login, avatar_url: event.actor.avatar_url },
            link: event.payload?.forkee?.html_url || `https://github.com/${event.repo.name}`,
            created_at: event.created_at,
          });
        }
      }
    }

    // Process followers — "someone started following you"
    for (const follower of followers || []) {
      classicEvents.push({
        id: `follower-${follower.login}`,
        classicType: "new_follower",
        icon: "follow",
        title: `${follower.login} started following you`,
        subtitle: null,
        actor: { login: follower.login, avatar_url: follower.avatar_url },
        link: `https://github.com/${follower.login}`,
        created_at: null, // GitHub doesn't provide follow timestamps
      });
    }

    // Sort chronologically (newest first), undated items go to end
    classicEvents.sort((a, b) => {
      if (!a.created_at && !b.created_at) return 0;
      if (!a.created_at) return 1;
      if (!b.created_at) return -1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return Response.json({ events: classicEvents });
  } catch (err) {
    console.error("Classic feed error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
