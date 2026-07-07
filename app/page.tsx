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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function fallbackItems(repo: Repo) {
  return changelogItems.filter((item) => item.repo === repo);
}

function cardToDisplay(card: Awaited<ReturnType<typeof analyzeCommit>>): DisplayItem {
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

async function getRepoItems(repo: Repo): Promise<DisplayItem[]> {
  try {
    const packets = await fetchLatestCommitPackets({ repo, limit: 3 });
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
  const [shardItems, c0mputeItems] = await Promise.all([
    getRepoItems('leyten/shard'),
    getRepoItems('leyten/c0mpute'),
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
        roadmap changelog <span className="sep">·</span> fetching latest github commits live <span className="sep">·</span> openai-compatible
      </footer>
    </>
  );
}
