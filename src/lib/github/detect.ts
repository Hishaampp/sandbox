/**
 * Turns a student's repositories into skills. Pure: no network, easy to test.
 * Rules (from the plan): only original, non-empty repositories count; a
 * language counts in a repo when it is the main language or at least 5% of
 * its code; frameworks come from the repo's own dependency files.
 */

export type RepoInput = {
  github_id: number;
  name: string;
  url: string;
  description: string | null;
  main_language: string | null;
  languages: Record<string, number>; // bytes per language
  topics: string[];
  stars: number;
  pushed_at: string;
  manifests?: { packageJson?: string; requirements?: string; pyproject?: string; pubspec?: string };
};

export type RepoRecord = Omit<RepoInput, "manifests"> & { frameworks: string[] };
export type SkillAggregate = { name: string; repo_count: number; last_pushed_at: string; stars: number };

const LANGUAGE_SHARE = 0.05;

/** Build files and config formats that are not skills a teammate would hire for. */
const IGNORED_LANGUAGES = new Set(["Makefile", "Procfile", "Batchfile", "CMake", "Roff", "Nix"]);

const LANGUAGE_NAMES: Record<string, string> = {
  "Jupyter Notebook": "Jupyter",
  Dockerfile: "Docker",
  SCSS: "CSS",
  PLpgSQL: "SQL",
  PLSQL: "SQL",
  TSQL: "SQL",
};

const NPM_FRAMEWORKS: Record<string, string> = {
  react: "React",
  next: "Next.js",
  vue: "Vue",
  nuxt: "Nuxt",
  "@angular/core": "Angular",
  svelte: "Svelte",
  "@sveltejs/kit": "SvelteKit",
  express: "Express",
  "@nestjs/core": "NestJS",
  "react-native": "React Native",
  expo: "Expo",
  tailwindcss: "Tailwind CSS",
  electron: "Electron",
  three: "Three.js",
  "@supabase/supabase-js": "Supabase",
  firebase: "Firebase",
  mongoose: "MongoDB",
  "@prisma/client": "Prisma",
  prisma: "Prisma",
  "socket.io": "Socket.IO",
  "@tensorflow/tfjs": "TensorFlow",
};

const PYTHON_FRAMEWORKS: Record<string, string> = {
  django: "Django",
  flask: "Flask",
  fastapi: "FastAPI",
  tensorflow: "TensorFlow",
  torch: "PyTorch",
  pandas: "pandas",
  numpy: "NumPy",
  "scikit-learn": "scikit-learn",
  sklearn: "scikit-learn",
  "opencv-python": "OpenCV",
  streamlit: "Streamlit",
  keras: "Keras",
};

/** The name students see for a GitHub language (e.g. PLpgSQL is shown as SQL). */
export function displayLanguage(language: string | null): string | null {
  if (!language) return null;
  return LANGUAGE_NAMES[language] ?? language;
}

export function frameworksFromManifests(manifests: RepoInput["manifests"]): string[] {
  const found = new Set<string>();
  if (!manifests) return [];

  if (manifests.packageJson) {
    try {
      const pkg = JSON.parse(manifests.packageJson) as Record<string, Record<string, string> | undefined>;
      const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
      for (const dep of Object.keys(deps)) {
        const name = NPM_FRAMEWORKS[dep];
        if (name) found.add(name);
      }
    } catch {
      // Malformed package.json: ignore rather than guess.
    }
  }

  const pythonText = [manifests.requirements, manifests.pyproject].filter(Boolean).join("\n").toLowerCase();
  if (pythonText) {
    for (const [pkg, name] of Object.entries(PYTHON_FRAMEWORKS)) {
      // Match a package name at a word boundary followed by a version or quote or line end.
      const pattern = new RegExp(`(^|[\\s"'\\[,])${pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s"'=<>~!\\],;]|$)`, "m");
      if (pattern.test(pythonText)) found.add(name);
    }
  }

  if (manifests.pubspec && /^\s*flutter\s*:/m.test(manifests.pubspec)) found.add("Flutter");

  return [...found].sort();
}

export function languagesForRepo(repo: Pick<RepoInput, "languages" | "main_language">): string[] {
  const total = Object.values(repo.languages).reduce((a, b) => a + b, 0);
  const names = new Set<string>();
  for (const [lang, bytes] of Object.entries(repo.languages)) {
    if (IGNORED_LANGUAGES.has(lang)) continue;
    if (lang === repo.main_language || (total > 0 && bytes / total >= LANGUAGE_SHARE)) {
      names.add(LANGUAGE_NAMES[lang] ?? lang);
    }
  }
  if (repo.main_language && !IGNORED_LANGUAGES.has(repo.main_language)) {
    names.add(LANGUAGE_NAMES[repo.main_language] ?? repo.main_language);
  }
  return [...names];
}

export function buildSkills(repos: RepoInput[]): { repos: RepoRecord[]; skills: SkillAggregate[] } {
  const records: RepoRecord[] = [];
  const bySkill = new Map<string, SkillAggregate>();

  for (const repo of repos) {
    const frameworks = frameworksFromManifests(repo.manifests);
    const { manifests: _unused, ...rest } = repo;
    void _unused;
    records.push({ ...rest, frameworks });

    for (const name of new Set([...languagesForRepo(repo), ...frameworks])) {
      const key = name.toLowerCase();
      const current = bySkill.get(key);
      if (!current) {
        bySkill.set(key, { name, repo_count: 1, last_pushed_at: repo.pushed_at, stars: repo.stars });
      } else {
        current.repo_count += 1;
        current.stars += repo.stars;
        if (repo.pushed_at > current.last_pushed_at) current.last_pushed_at = repo.pushed_at;
      }
    }
  }

  const skills = [...bySkill.values()].sort((a, b) => b.repo_count - a.repo_count || (a.last_pushed_at < b.last_pushed_at ? 1 : -1));
  return { repos: records, skills };
}
