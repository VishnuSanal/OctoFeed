import { getToken } from "next-auth/jwt";

const GITHUB_HEADERS = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
});

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

export async function POST(request) {
  const jwt = await getToken({ req: request });
  if (!jwt?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;
  const headers = GITHUB_HEADERS(jwt.accessToken);

  // Batch check starred status
  if (action === "check") {
    const { repos } = body;
    if (!repos || !Array.isArray(repos)) {
      return Response.json({ error: "repos array is required" }, { status: 400 });
    }

    const thunks = repos.map((repo) => async () => {
      try {
        const res = await fetch(`https://api.github.com/user/starred/${repo}`, {
          method: "GET",
          headers,
        });
        return { repo, starred: res.status === 204 };
      } catch {
        return { repo, starred: false };
      }
    });

    const checks = await parallelLimit(thunks, 30);
    const results = {};
    for (const r of checks) {
      results[r.repo] = r.starred;
    }

    return Response.json(results);
  }

  // Star a repo
  if (action === "star") {
    const { repo } = body;
    if (!repo) {
      return Response.json({ error: "repo is required" }, { status: 400 });
    }

    console.log(repo);
    const res = await fetch(`https://api.github.com/user/starred/${repo}`, {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Length": "0",
      }
    });

    if (res.status !== 204) {
      const text = await res.text();
      console.error("Star failed:", res.status, text);
      return Response.json({ error: `Failed to star (${res.status}): ${text}` }, { status: res.status });
    }

    return Response.json({ starred: true });
  }

  // Unstar a repo
  if (action === "unstar") {
    const { repo } = body;
    if (!repo) {
      return Response.json({ error: "repo is required" }, { status: 400 });
    }

    const res = await fetch(`https://api.github.com/user/starred/${repo}`, {
      method: "DELETE",
      headers: {
        ...headers,
        "Content-Length": "0",
      },
    });

    if (res.status !== 204) {
      const text = await res.text();
      console.error("Unstar failed:", res.status, text);
      return Response.json({ error: `Failed to unstar (${res.status}): ${text}` }, { status: res.status });
    }

    return Response.json({ starred: false });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
