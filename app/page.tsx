'use client';

import { useEffect, useMemo, useState } from 'react';
import { changelogItems } from '@/lib/changelog';

type Repo = 'leyten/shard' | 'leyten/c0mpute';

function Notes({ repo }: { repo: Repo }) {
  const key = `c0mpute-changelog-notes:${repo}`;
  const [value, setValue] = useState('');

  useEffect(() => {
    setValue(localStorage.getItem(key) || '');
  }, [key]);

  function update(v: string) {
    setValue(v);
    localStorage.setItem(key, v);
  }

  return (
    <div className="notes panel">
      <div className="panel-title">personal notes</div>
      <textarea
        value={value}
        onChange={(e) => update(e.target.value)}
        placeholder="your read, questions, tweet angle..."
      />
    </div>
  );
}

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
  const items = useMemo(() => changelogItems.filter((item) => item.repo === repo), [repo]);
  return (
    <section className="repo-col">
      <div className="section-title pixel">{repo.replace('leyten/', '')}</div>
      <div className="repo-sub"><span className="dot" /> {items.length} commits translated</div>
      <div className="commit-list">
        {items.map((item) => <CommitItem item={item} key={`${item.repo}-${item.sha}`} />)}
      </div>
      <Notes repo={repo} />
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
      </main>

      <footer>
        roadmap changelog <span className="sep">·</span> notes save locally <span className="sep">·</span> openai-compatible analyzer ready
      </footer>
    </>
  );
}
