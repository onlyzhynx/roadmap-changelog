export type RoadmapLane = 'Network' | 'Protocol' | '$ZERO' | 'Product';

export type RoadmapItem = {
  lane: RoadmapLane;
  title: string;
  description: string;
  status: 'shipped' | 'now' | 'next' | 'later' | 'endgame';
  signals: string[];
};

export const roadmapItems: RoadmapItem[] = [
  {
    lane: 'Network',
    title: 'Swarm as a worker',
    status: 'now',
    description: 'The M2.5 swarm registers on the live network as a single worker, streams tokens into real jobs, and earns like any other worker.',
    signals: ['swarm worker', 'register', 'streaming tokens', 'live jobs', 'worker earning'],
  },
  {
    lane: 'Network',
    title: 'Self-managing swarms',
    status: 'next',
    description: 'Swarms assemble and heal themselves from whatever GPUs join, including node replacement during generation.',
    signals: ['fault tolerance', 'coordinator retry', 'node kill', 'splice', 'churn', 'recover', 'warm ring'],
  },
  {
    lane: 'Network',
    title: 'One-command swarm join',
    status: 'next',
    description: 'A GPU behind a home router joins a swarm with one command, no port forwarding or manual setup.',
    signals: ['sidecar', 'libp2p', 'holepunch', 'AutoNAT', 'one command', 'worker join'],
  },
  {
    lane: 'Network',
    title: 'Per-GPU identity and pay',
    status: 'next',
    description: 'Each GPU in a swarm has its own identity and earns its own balance for the tokens it helped produce.',
    signals: ['PeerId', 'identity', 'binding', 'receipt pubkey', 'payout split', 'per stage'],
  },
  {
    lane: 'Protocol',
    title: 'Betanet PoC',
    status: 'now',
    description: 'MiniMax M2.5 sharded across scattered consumer 5090s: interactive speed, batched speed, verified receipts.',
    signals: ['M2.5', 'MiniMax', '229B', 'receipts', 'betanet', '5090', 'tok/s', 'batch'],
  },
  {
    lane: 'Protocol',
    title: 'Signed receipts',
    status: 'shipped',
    description: 'Every job emits a verifiable signed receipt anyone can check.',
    signals: ['receipt', 'signature', 'coverage', 'verify', 'activation hash', 'ed25519'],
  },
  {
    lane: 'Protocol',
    title: 'Any-model runtime',
    status: 'next',
    description: 'One runtime interface so a new model onboards with no engine changes.',
    signals: ['runtime', 'registry', 'model config', 'generic', 'add model', 'engine path'],
  },
  {
    lane: 'Protocol',
    title: 'Ever-bigger models',
    status: 'next',
    description: 'A catalog of models, each sharded across a swarm sized to its needs.',
    signals: ['120B', '229B', '744B', 'larger model', 'layers', 'VRAM', 'planner'],
  },
  {
    lane: 'Protocol',
    title: 'Trustless verification',
    status: 'later',
    description: 'Catch fake work without recomputing everything, then slash dishonest stake.',
    signals: ['spot recomputation', 'slashing', 'freshness', 'replay', 'verification', 'fraud'],
  },
  {
    lane: '$ZERO',
    title: 'Trustless payouts',
    status: 'later',
    description: 'Worker and staker payouts anchored to on-chain proof of compute.',
    signals: ['payout', 'on-chain proof', 'worker earnings', 'USDC', 'treasury', 'claim'],
  },
  {
    lane: '$ZERO',
    title: 'Treasury dashboard',
    status: 'now',
    description: 'Every buyback, burn and reward payout on a live dashboard with receipts.',
    signals: ['dashboard', 'buyback', 'burn', 'reward', 'treasury', 'receipt'],
  },
  {
    lane: 'Product',
    title: 'Public API',
    status: 'shipped',
    description: 'OpenAI-compatible inference API with flat pricing.',
    signals: ['api', 'OpenAI-compatible', 'pricing', 'endpoint', 'chat completions'],
  },
  {
    lane: 'Product',
    title: 'Bigger uncensored models',
    status: 'now',
    description: 'A larger uncensored model for max tier, validated on consumer GPUs, being wired into the network.',
    signals: ['max tier', 'larger model', 'uncensored', 'validated', 'consumer GPU'],
  },
  {
    lane: 'Product',
    title: 'Frontier models in chat',
    status: 'next',
    description: 'Chat and API served by models sharded across the swarm, up to frontier size.',
    signals: ['chat', 'API', 'frontier', 'swarm', 'served by', 'M2.5'],
  },
  {
    lane: 'Product',
    title: 'c0mpute code',
    status: 'shipped',
    description: 'A coding agent whose thinking runs on the network while edits and commands stay local.',
    signals: ['code agent', 'terminal', 'npm', 'secrets stripped', 'local edits'],
  },
];
