import { changelogItems } from '@/lib/changelog';

type Repo = 'leyten/shard' | 'leyten/c0mpute';

function CommitItem({ item }: { item: (typeof changelogItems)[number] }) {
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

function RepoColumn({ repo }: { repo: Repo }) {
  const items = changelogItems.filter((item) => item.repo === repo);
  return (
    <section className="repo-col">
      <div className="section-title pixel">{repo.replace('leyten/', '')}</div>
      <div className="repo-sub"><span className="dot" /> {items.length} commits translated</div>
      <div className="commit-list">
        {items.map((item) => <CommitItem item={item} key={`${item.repo}-${item.sha}`} />)}
      </div>
    </section>
  );
}

export default function Home() {
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
          <RepoColumn repo="leyten/shard" />
          <RepoColumn repo="leyten/c0mpute" />
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
        roadmap changelog <span className="sep">·</span> openai-compatible <span className="sep">·</span> c0mpute endpoint ready
      </footer>
    </>
  );
}
