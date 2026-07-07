export type EvidenceLine = {
  file: string;
  additions: number;
  deletions: number;
  patch?: string;
};

export type CommitPacket = {
  repo: string;
  sha: string;
  shortSha: string;
  title: string;
  body: string;
  url: string;
  author?: string;
  date?: string;
  changedFiles: EvidenceLine[];
  stats: { additions: number; deletions: number; files: number };
};

export type ChangelogCard = {
  id: string;
  repo: string;
  sha: string;
  url: string;
  title: string;
  tldr: string;
  plainEnglish: string;
  whyItMatters: string;
  roadmap: Array<{ lane: string; item: string; movement: string }>;
  evidence: Array<{ label: string; detail: string }>;
  codeNotes: Array<{ file: string; note: string; lines?: string }>;
  nextMilestone: string;
  confidence: 'low' | 'medium' | 'high';
  score: number;
  createdAt: string;
};

export const sampleCards: ChangelogCard[] = [
  {
    id: 'sample-graph-aux',
    repo: 'leyten/shard',
    sha: '09c27b7',
    url: 'https://github.com/leyten/shard/commit/09c27b75cabeb3d9e21e2b91b3dd86f398d179ed',
    title: 'SHARD graph-aux lands: faster swarm inference without new hardware',
    tldr: 'Same GPUs, better engine. SHARD cuts local stage compute by roughly 3-4x on key decode cells and makes the fast EAGLE path safer to run.',
    plainEnglish: 'This update makes the distributed inference engine waste less time launching tiny GPU operations. The model still runs across scattered consumer GPUs, but each stage spends less time waiting on CPU overhead.',
    whyItMatters: 'The MiniMax M2.5 paper said consumer GPU swarms were often limited by the CPU next to the GPU, not the GPU itself. This ships the fix the paper pointed at.',
    roadmap: [
      { lane: 'Protocol', item: 'Betanet PoC', movement: 'The verified M2.5 swarm gets faster on the same hardware.' },
      { lane: 'Protocol', item: 'Ever-bigger models', movement: 'Lower per-stage overhead makes larger sharded models more usable.' },
      { lane: 'Product', item: 'Frontier models in chat', movement: 'Better decode speed helps move frontier-size swarm models toward product UX.' },
    ],
    evidence: [
      { label: 'Perf', detail: 'Local stage compute drops from ~155-157ms to ~39-49ms on most cells.' },
      { label: 'Validation', detail: 'Graph-on/off is measured on the same warm ring, reducing WAN drift noise.' },
      { label: 'Safety', detail: 'Adds OOM-safe eager fallback and graph toggle ACK checks.' },
    ],
    codeNotes: [
      { file: 'phase0/m25_stage.py', note: 'Adds graph-captured EAGLE aux buffers and bounded graph capture.' },
      { file: 'phase0/m25_pipe.py', note: 'Adds per-job graph toggles and verifies the stage actually applied them.' },
      { file: 'tests/test_graph_aux.py', note: 'Adds CPU tests for capture limits, fallback routing, and graph toggle correctness.' },
    ],
    nextMilestone: 'Route this through live c0mpute jobs so users can hit the faster swarm path from chat/API.',
    confidence: 'high',
    score: 4.5,
    createdAt: '2026-07-06T00:00:00.000Z',
  },
];
