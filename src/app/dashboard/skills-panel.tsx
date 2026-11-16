import { Sparkles, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { SkillProof } from "@/components/ui/skill-proof";
import type { Viewer } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { toProofItem, type SkillRow } from "@/lib/skills";
import { createClient } from "@/lib/supabase/server";
import { removeSkill } from "./actions";
import { ConnectGitHubButton } from "./connect-github-button";
import { AddSkillForm, PortfolioForm } from "./skill-forms";

export async function SkillsPanel({ viewer }: { viewer: Viewer }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("skills")
    .select("id, name, source, evidence, last_pushed_at, score")
    .eq("profile_id", viewer.id)
    .order("source", { ascending: true }) // github before self
    .order("score", { ascending: false });

  const skills = (data ?? []) as SkillRow[];
  const connected = Boolean(viewer.githubUsername);

  return (
    <section aria-labelledby="skills-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="skills-title" className="text-title font-semibold text-ink">
            Your skills
          </h2>
          <p className="mt-1 text-body-sm text-muted">
            {connected
              ? `Read from @${viewer.githubUsername}'s public repositories${viewer.githubSyncedAt ? `, ${timeAgo(viewer.githubSyncedAt)}` : ""}.`
              : "Connect GitHub to build skills from your own code. Only public repositories are read."}
          </p>
        </div>
        <ConnectGitHubButton connected={connected} />
      </div>

      <Panel className="mt-4">
        {error ? (
          <div className="p-6">
            <Alert tone="danger" title="Your skills couldn't be loaded">
              Refresh the page. Nothing was lost.
            </Alert>
          </div>
        ) : skills.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <Sparkles className="size-6 text-muted" aria-hidden="true" />
            <h3 className="mt-3 font-medium text-ink">No skills yet</h3>
            <p className="mt-1 text-body-sm text-muted">
              Connect GitHub to build skills from your code, or add skills by hand below.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {skills.map((s) => (
              <li key={s.id} className="flex min-h-12 items-center gap-3 px-6 py-3">
                <SkillProof item={toProofItem(s)} className="flex-1" />
                {s.source === "self" && (
                  <form action={removeSkill}>
                    <input type="hidden" name="id" value={s.id} />
                    <Button type="submit" variant="ghost" size="sm" icon={<X className="size-4" aria-hidden="true" />}>
                      <span className="sr-only">Remove {s.name}</span>
                    </Button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="grid grid-cols-1 gap-x-6 border-t border-line px-6 pt-5 pb-1 sm:grid-cols-2">
          <AddSkillForm />
          <PortfolioForm current={viewer.portfolioUrl} />
        </div>
      </Panel>
    </section>
  );
}
