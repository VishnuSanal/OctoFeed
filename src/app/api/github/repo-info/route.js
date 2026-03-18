import { getToken } from "next-auth/jwt";

async function fetchRepo(repo, token) {
  const res = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    description: data.description,
    language: data.language,
    stargazers_count: data.stargazers_count,
  };
}

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

  const { repos } = await request.json();
  if (!Array.isArray(repos) || repos.length === 0) {
    return Response.json({ error: "repos array required" }, { status: 400 });
  }

  const thunks = repos.map((repo) => async () => {
    const data = await fetchRepo(repo, jwt.accessToken);
    return { repo, data };
  });

  const fetched = await parallelLimit(thunks, 30);
  const results = {};
  for (const { repo, data } of fetched) {
    if (data) results[repo] = data;
  }

  return Response.json(results);
}

// Keep GET for backwards compat
export async function GET(request) {
  const jwt = await getToken({ req: request });
  if (!jwt?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const reposParam = searchParams.get("repos");
  if (!reposParam) {
    return Response.json({ error: "repos param required" }, { status: 400 });
  }

  const repoList = reposParam.split(",");
  const thunks = repoList.map((repo) => async () => {
    const data = await fetchRepo(repo, jwt.accessToken);
    return { repo, data };
  });

  const fetched = await parallelLimit(thunks, 30);
  const results = {};
  for (const { repo, data } of fetched) {
    if (data) results[repo] = data;
  }

  return Response.json(results);
}
