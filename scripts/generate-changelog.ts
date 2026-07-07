import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { analyzeCommit } from '../lib/analyzer';
import { fetchLatestCommitPackets } from '../lib/github';

const repos = ['leyten/shard', 'leyten/c0mpute'] as const;

async function main() {
  const generatedAt = new Date().toISOString();
  const data: Record<string, unknown[]> = {};

  for (const repo of repos) {
    const packets = await fetchLatestCommitPackets({ repo, limit: Number(process.env.CHANGELOG_LIMIT || 10) });
    const cards = [];
    for (const packet of packets) {
      cards.push(await analyzeCommit(packet));
    }
    data[repo] = cards;
  }

  const out = {
    generatedAt,
    repos,
    data,
  };

  const dir = path.join(process.cwd(), 'public', 'data');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'changelog.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(`wrote public/data/changelog.json at ${generatedAt}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
