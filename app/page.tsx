import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { analyzeCommit } from '@/lib/analyzer';
import { changelogItems } from '@/lib/changelog';
import { fetchLatestCommitPackets } from '@/lib/github';

type Repo = 'leyten/shard' | 'leyten/c0mpute';
type DisplayItem = {
  repo: Repo;
  sha: string;
  url: string;
  title: string;
  dumb: string;
  affects: string;
  proof: string;
  next: string;
};
type GeneratedCard = Awaited<ReturnType<typeof analyzeCommit>>;
type GeneratedFile = {
  generatedAt: string;
  data: Record<string, GeneratedCard[]>;
};

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

function fallbackItems(repo: Repo) {
  return changelogItems.filter((item) => item.repo === repo);
}

function cardToDisplay(card: GeneratedCard): DisplayItem {
  const roadmap = card.roadmap?.map((r) => `${r.lane} · ${r.item}`).join(' · ') || 'roadmap impact';
  const proof = card.codeNotes?.slice(0, 3).map((n) => `${n.file}${n.lines ? `:${n.lines}` : ''}`).join(' · ')
    || card.evidence?.map((e) => e.detail).join(' · ')
    || 'commit diff';

  return {
    repo: card.repo as Repo,
    sha: card.sha,
    url: card.url,
    title: card.title.toLowerCase(),
    dumb: (card.tldr || card.plainEnglish || card.whyItMatters).toLowerCase(),
    affects: roadmap.toLowerCase(),
    proof,
    next: card.nextMilestone.toLowerCase(),
  };
}

async function readGenerated(): Promise<GeneratedFile | null> {
  try {
    const file = await readFile(path.join(process.cwd(), 'public', 'data', 'changelog.json'), 'utf8');
    return JSON.parse(file) as GeneratedFile;
  } catch {
    return null;
  }
}

async function getRepoItems(repo: Repo, generated: GeneratedFile | null): Promise<DisplayItem[]> {
  const cached = generated?.data?.[repo];
  if (cached?.length) return cached.map(cardToDisplay);

  try {
    const packets = await fetchLatestCommitPackets({ repo, limit: 10 });
    const cards = await Promise.all(packets.map((packet) => analyzeCommit(packet)));
    return cards.map(cardToDisplay);
  } catch (error) {
    console.error(`failed to fetch ${repo}`, error);
    return fallbackItems(repo);
  }
}

function CommitItem({ item }: { item: DisplayItem }) {
  return (
    <div className="commit panel">
      <div className="commit-top">
        <a href={item.url} target="_blank" rel="noreferrer">{item.sha}</a>
        <span>{item.affects}</span>
      </div>
      <div className="commit-title pixel">{item.title}</div>
      <p>{item.dumb}</p>
      <div className="mini-row"><span>proof</span><code>{item.proof}</code></div>
      <div className="mini-row"><span>next</span><em>{item.next}</em></div>
    </div>
  );
}

function RepoColumn({ repo, items }: { repo: Repo; items: DisplayItem[] }) {
  return (
    <section className="repo-col">
      <div className="section-title pixel">{repo.replace('leyten/', '')}</div>
      <div className="repo-sub"><span className="dot" /> latest {items.length} commits translated</div>
      <div className="commit-list">
        {items.map((item) => <CommitItem item={item} key={`${item.repo}-${item.sha}`} />)}
      </div>
    </section>
  );
}

export default async function Home() {
  const generated = await readGenerated();
  const [shardItems, c0mputeItems] = await Promise.all([
    getRepoItems('leyten/shard', generated),
    getRepoItems('leyten/c0mpute', generated),
  ]);

  return (
    <>
      <header>
        <div className="header-inner">
          <span className="wordmark pixel">c<span className="zero">0</span>mpute</span>
          <span className="brand-sub"><span className="dot" /> changelog · live</span>
        </div>
      </header>

      <main>
        <div className="hero-stat">
          <div className="hero-num pixel">changelog</div>
          <div className="hero-label">latest repo work, dumbed down. what changed, what it affects, what to watch.</div>
          {generated?.generatedAt ? <div className="hero-label">updated {generated.generatedAt}</div> : null}
        </div>

        <div className="columns">
          <RepoColumn repo="leyten/shard" items={shardItems} />
          <RepoColumn repo="leyten/c0mpute" items={c0mputeItems} />
        </div>

        <section>
          <div className="section-title pixel">model config</div>
          <div className="panel config-panel">
            <code>OPENAI_BASE_URL=https://api.c0mpute.ai/v1</code>
            <code>OPENAI_API_KEY=...</code>
            <code>OPENAI_MODEL=any-openai-compatible-model</code>
          </div>
        </section>
      </main>

      <footer>
        roadmap changelog <span className="sep">·</span> github action refreshes hourly <span className="sep">·</span> openai-compatible
      </footer>
    </>
  );
}
