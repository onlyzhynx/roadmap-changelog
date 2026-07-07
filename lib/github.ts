import { Octokit } from '@octokit/rest';
import type { CommitPacket, EvidenceLine } from './types';

function splitRepo(repo: string) {
  const [owner, name] = repo.split('/');
  if (!owner || !name) throw new Error('Repo must look like owner/name');
  return { owner, repo: name };
}

function patchLineRange(patch?: string): string | undefined {
  if (!patch) return undefined;
  const m = patch.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
  if (!m) return undefined;
  const start = Number(m[2]);
  const count = Number(m[3] || '1');
  return count <= 1 ? `L${start}` : `L${start}-L${start + count - 1}`;
}

export async function fetchLatestCommitPackets(input: {
  repo: string;
  limit?: number;
  ref?: string;
  githubToken?: string;
}): Promise<CommitPacket[]> {
  const { owner, repo } = splitRepo(input.repo);
  const octokit = new Octokit({ auth: input.githubToken || process.env.GITHUB_TOKEN });
  const list = await octokit.repos.listCommits({ owner, repo, sha: input.ref, per_page: input.limit || 5 });

  const packets: CommitPacket[] = [];
  for (const item of list.data) {
    const detail = await octokit.repos.getCommit({ owner, repo, ref: item.sha });
    const message = detail.data.commit.message || '';
    const [title, ...bodyParts] = message.split('\n');
    const files = detail.data.files || [];
    const changedFiles: EvidenceLine[] = files.map((f) => ({
      file: f.filename,
      additions: f.additions || 0,
      deletions: f.deletions || 0,
      patch: f.patch ? f.patch.slice(0, 2400) : undefined,
    }));
    packets.push({
      repo: input.repo,
      sha: detail.data.sha,
      shortSha: detail.data.sha.slice(0, 7),
      title: title.trim(),
      body: bodyParts.join('\n').trim(),
      url: detail.data.html_url,
      author: detail.data.commit.author?.name || undefined,
      date: detail.data.commit.author?.date || undefined,
      changedFiles,
      stats: {
        additions: detail.data.stats?.additions || 0,
        deletions: detail.data.stats?.deletions || 0,
        files: changedFiles.length,
      },
    });
  }
  return packets;
}

export function summarizeEvidence(packet: CommitPacket) {
  return packet.changedFiles.slice(0, 12).map((f) => ({
    file: f.file,
    stat: `+${f.additions}/-${f.deletions}`,
    lines: patchLineRange(f.patch),
    patch: f.patch,
  }));
}
