import { analyzeCommit } from '../lib/analyzer';
import { fetchLatestCommitPackets } from '../lib/github';

async function main() {
  const repo = process.argv[2] || 'leyten/shard';
  const limit = Number(process.argv[3] || '1');
  const packets = await fetchLatestCommitPackets({ repo, limit });
  const cards = [];
  for (const packet of packets) cards.push(await analyzeCommit(packet));
  console.log(JSON.stringify({ cards }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
