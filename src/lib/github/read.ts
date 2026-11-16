import "server-only";
import { buildSkills, type RepoInput } from "./detect";

const API = "https://api.github.com";
const MAX_REPOS = 30; // most recently pushed original repos
const MANIFEST_REPOS = 8; // dependency files are read for the most recent few
const CONCURRENCY = 6;
const TIMEOUT_MS = 8000;

export class GitHubReadError extends Error {}

type GitHubRepo = {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  pushed_at: string;
  fork: boolean;
  size: number;
  private: boolean;
  languages_url: string;
  owner: { login: string };
};

async function gh<T>(url: string, token: string | null, accept = "application/vnd.github+json"): Promise<T | null> {
  const res = await fetch(url.startsWith("http") ? url : `${API}${url}`, {
    headers: {
      Accept: accept,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "sandbox-app",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new GitHubReadError(`GitHub responded ${res.status} for ${url.replace(API, "")}`);
  return accept.includes("raw") ? ((await res.text()) as T) : ((await res.json()) as T);
}

async function inBatches<T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    out.push(...(await Promise.all(items.slice(i, i + CONCURRENCY).map(fn))));
  }
  return out;
}

async function readRepos(repos: GitHubRepo[], token: string | null): Promise<RepoInput[]> {
  // Only original, non-empty, public repositories count.
  const original = repos
    .filter((r) => !r.fork && r.size > 0 && !r.private)
    .sort((a, b) => (a.pushed_at < b.pushed_at ? 1 : -1))
    .slice(0, MAX_REPOS);

  return inBatches(original, async (repo) => {
    const languages = (await gh<Record<string, number>>(repo.languages_url, token)) ?? {};
    const input: RepoInput = {
      github_id: repo.id,
      name: repo.name,
      url: repo.html_url,
      description: repo.description,
      main_language: repo.language,
      languages,
      topics: repo.topics ?? [],
      stars: repo.stargazers_count,
      pushed_at: repo.pushed_at,
    };
    if (original.indexOf(repo) < MANIFEST_REPOS) {
      const raw = "application/vnd.github.raw+json";
      const base = `/repos/${repo.owner.login}/${repo.name}/contents`;
      const [packageJson, requirements, pyproject, pubspec] = await Promise.all([
        gh<string>(`${base}/package.json`, token, raw),
        gh<string>(`${base}/requirements.txt`, token, raw),
        gh<string>(`${base}/pyproject.toml`, token, raw),
        gh<string>(`${base}/pubspec.yaml`, token, raw),
      ]);
      input.manifests = {
        packageJson: packageJson ?? undefined,
        requirements: requirements ?? undefined,
        pyproject: pyproject ?? undefined,
        pubspec: pubspec ?? undefined,
      };
    }
    return input;
  });
}

/**
 * Reads the signed-in student's own public repositories with their GitHub token.
 * Returns the GitHub account it belongs to, so the caller can check it matches
 * the identity linked to the Sandbox account.
 */
export async function readGitHubWithToken(token: string) {
  const user = await gh<{ id: number; login: string }>("/user", token);
  if (!user) throw new GitHubReadError("GitHub did not return the signed-in account");
  const repos =
    (await gh<GitHubRepo[]>("/user/repos?visibility=public&affiliation=owner&sort=pushed&per_page=100", token)) ?? [];
  const inputs = await readRepos(repos, token);
  return { githubId: user.id, login: user.login, ...buildSkills(inputs) };
}
