export type ChangelogItem = {
  repo: 'leyten/shard' | 'leyten/c0mpute';
  sha: string;
  url: string;
  title: string;
  dumb: string;
  affects: string;
  proof: string;
  next: string;
};

export const changelogItems: ChangelogItem[] = [
  {
    repo: 'leyten/shard',
    sha: '985fe3b',
    url: 'https://github.com/leyten/shard/commit/985fe3bdbb2bedcdd03fc60f57e9dd226e57c96d',
    title: 'swarm gets harder to break during connection blips',
    dumb: 'the swarm is less likely to get stuck when one internal connection blips. it can keep the important return path alive instead of forcing a full restart.',
    affects: 'self-managing swarms',
    proof: 'phase0/m25_pipe.py:L946-L960',
    next: 'show the recovery path on live swarm jobs with receipts',
  },
  {
    repo: 'leyten/shard',
    sha: '09c27b7',
    url: 'https://github.com/leyten/shard/commit/09c27b75cabeb3d9e21e2b91b3dd86f398d179ed',
    title: 'roughly 3x faster swarm inference in latest benchmark',
    dumb: 'same GPUs, much faster engine. in the benchmark note this is roughly a ~3x tok/s jump overall, because local stage work drops from ~155ms to ~40ms on key cells.',
    affects: 'betanet poc · frontier models in chat',
    proof: 'phase0/m25_stage.py · phase0/m25_pipe.py · tests/test_graph_aux.py',
    next: 'confirm the speedup through live c0mpute chat/api swarm jobs',
  },
  {
    repo: 'leyten/shard',
    sha: '14dcceb',
    url: 'https://github.com/leyten/shard/commit/14dcceb',
    title: 'better ring planning for faster multi-gpu swarms',
    dumb: 'better measurement and better ring planning. it separates what is slow: network, cpu, or stage compute.',
    affects: 'one-command swarm join · ever-bigger models',
    proof: 'tests/fake_ring.py · shard/topology.py',
    next: 'feed the planner into automatic swarm assembly',
  },
  {
    repo: 'leyten/c0mpute',
    sha: '7463db9',
    url: 'https://github.com/leyten/c0mpute/commit/7463db9e9c67f7efaf681fd38239c9e85cb8145e',
    title: 'image generation feels smoother while jobs finish',
    dumb: 'image generation feels less broken while waiting. the UI keeps showing a live placeholder until the worker returns the final image.',
    affects: 'image generation',
    proof: 'app/chat/page.tsx',
    next: 'same async pattern for longer swarm jobs',
  },
  {
    repo: 'leyten/c0mpute',
    sha: '74e5f3d',
    url: 'https://github.com/leyten/c0mpute/commit/74e5f3d',
    title: 'image jobs stop timing out while rendering',
    dumb: 'workers no longer time out waiting on image jobs. the job can finish in the background and land when ready.',
    affects: 'product reliability',
    proof: 'lib/orchestrator/tools.ts · hooks/useSocket.ts',
    next: 'use the same job lifecycle for slower frontier/swarm routes',
  },
  {
    repo: 'leyten/c0mpute',
    sha: 'b4ea451',
    url: 'https://github.com/leyten/c0mpute/commit/b4ea451aa813d559584d4c79cefe89fb887ba602',
    title: 'swarm GPUs can now be linked to payouts',
    dumb: 'connects a swarm node identity to a c0mpute account. basically: know which GPU should get paid.',
    affects: 'per-gpu identity and pay · trustless payouts',
    proof: 'app/api/node-bind/route.ts · lib/identity.ts',
    next: 'use bindings in live multi-gpu stage payouts',
  },
];
