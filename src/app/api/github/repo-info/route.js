import { getToken } from "next-auth/jwt";

export async function GET(request) {
  const jwt = await getToken({ req: request });
  if (!jwt?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const repos = searchParams.get("repos");
  if (!repos) {
    return Response.json({ error: "repos param required" }, { status: 400 });
  }

  const repoList = repos.split(",").slice(0, 50); // limit to 50
  const results = {};

  const BATCH = 10;
  for (let i = 0; i < repoList.length; i += BATCH) {
    const batch = repoList.slice(i, i + BATCH);
    const fetches = await Promise.all(
      batch.map(async (repo) => {
        const res = await fetch(`https://api.github.com/repos/${repo}`, {
          headers: {
            Authorization: `Bearer ${jwt.accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        });
        if (!res.ok) return { repo, data: null };
        const data = await res.json();
        return {
          repo,
          data: {
            description: data.description,
            language: data.language,
            stargazers_count: data.stargazers_count,
          },
        };
      })
    );
    for (const r of fetches) {
      if (r.data) results[r.repo] = r.data;
    }
  }

  return Response.json(results);
}
