import { z } from 'zod';
import { roadmapItems } from './roadmap';
import type { ChangelogCard, CommitPacket } from './types';
import { summarizeEvidence } from './github';
import OpenAI from 'openai';

export const CardSchema = z.object({
  title: z.string(),
  tldr: z.string(),
  plainEnglish: z.string(),
  whyItMatters: z.string(),
  roadmap: z.array(z.object({ lane: z.string(), item: z.string(), movement: z.string() })).max(4),
  evidence: z.array(z.object({ label: z.string(), detail: z.string() })).max(5),
  codeNotes: z.array(z.object({ file: z.string(), note: z.string(), lines: z.string().optional() })).max(6),
  nextMilestone: z.string(),
  confidence: z.enum(['low', 'medium', 'high']),
  score: z.number().min(0).max(5),
});

// ─── deterministic rewrite engine (no API key needed) ───────────────

function stripPrefix(raw: string): string {
  return raw
    .replace(/^(feat|fix|perf|docs|test|refactor|chore|ci|build|style|revert)\b(\([^)]*\))?[:\-]\s*/i, '')
    .replace(/\(#[0-9]+\)/g, '')
    .replace(/^((worker|chat|api|keeper|staking|free-subsidy|anti-abuse|data-stats|docs?|engine)\s*[:\-]\s*)/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

type Category = 'security' | 'reliability' | 'performance' | 'product' | 'economics' | 'infra' | 'docs';

function classify(title: string, body: string, files: string[]): Category {
  const hay = `${title} ${body} ${files.join(' ')}`.toLowerCase();
  const t = title.toLowerCase();
  const allFiles = files.join(' ');

  // docs-only commits (check first)
  if (/^docs?[:\s]/.test(t) || (/\.md/.test(allFiles) && !/\.py|\.ts|\.tsx|\.js/.test(allFiles) && !/test/.test(t))) {
    return 'docs';
  }

  // test commits are reliability, regardless of what they test
  if (/^test\b|adversarial.*test|test.*coverage|round-trip|spot-check/.test(t)) {
    return 'reliability';
  }

  // economics / payouts
  if (/staking|payout|subsidy|reward.*claim|claim.*reward|migrate.*claim|double-spend|buyback|treasury/.test(hay)) return 'economics';

  // anti-abuse / caps / identity binding
  if (/anti-abuse|age.gate|node-bind|node-identity|peerid|fake.*worker|worker.*cap|inflation|per-account|per-ip/.test(hay)) return 'security';

  // security: tamper/attack prevention
  if (/tamper|bad-sig|wrong-pin|unsigned|path-traversal|corrupt|malicious|verified.*fetch|verified.*weight/.test(hay)) return 'security';

  // performance
  if (/tok.s|cuda.*graph|eagle.*aux|3x|4x|faster.*inference|throughput.*increase/.test(hay)) return 'performance';

  // product / UX
  if (/async|skeleton|render|image.gen|chat.*page|worker.*timeout|frontend|placeholder|generating|uncensored|vision|tool-result/.test(hay)) return 'product';

  // crash/bug fixes
  if (/bound.check|oob|crash|race.*condition|double.spend|disconnect|stall/.test(hay)) return 'reliability';

  // infra
  if (/manifest|deploy|fetch|weight|ring|node|pipe|topology|receipt|gateway|kv|libp2p|churn|coordinator/.test(hay)) return 'infra';

  return 'reliability';
}

function extractKeyPhrase(title: string): string {
  // strip conventional prefix + scope
  let s = stripPrefix(title);
  // shorten common long patterns
  s = s.replace(/\bso the\b.*$/i, '');
  s = s.replace(/\binstead of\b.*$/i, '');
  s = s.replace(/\bso .*?(can|cannot|won't|don't)\b.*$/i, '');
  return s.trim();
}

function bullishTitle(title: string, cat: Category): string {
  const phrase = extractKeyPhrase(title);

  const map: Record<Category, (p: string) => string> = {
    security: (p) => `closes a security gap: ${shorten(p)}`,
    reliability: (p) => `${shorten(p)} now battle-tested`,
    performance: (p) => `faster swarm: ${shorten(p)}`,
    product: (p) => `smoother product: ${shorten(p)}`,
    economics: (p) => `safer payouts: ${shorten(p)}`,
    infra: (p) => `engine upgrade: ${shorten(p)}`,
    docs: (p) => `docs: ${shorten(p)}`,
  };

  return map[cat](phrase);
}

function shorten(s: string): string {
  if (s.length <= 60) return s.toLowerCase();
  // cut at first comma/semicolon/paren after 30 chars
  const cut = s.slice(30).search(/[;,(]/);
  if (cut > 0) return s.slice(0, 30 + cut).toLowerCase();
  return s.slice(0, 57).toLowerCase() + '...';
}

function plainSummary(title: string, body: string, cat: Category): string {
  const phrase = extractKeyPhrase(title).toLowerCase();

  // get first useful body paragraph
  const firstGraph = body
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter((p) => p && !p.startsWith('*') && !p.startsWith('Test'))
    .find(Boolean) || '';

  const openers: Record<Category, string[]> = {
    security: [
      `this closes a real security gap.`,
      `this hardens the network against abuse.`,
      `this stops bad actors from exploiting the system.`,
    ],
    reliability: [
      `this makes the swarm more reliable under stress.`,
      `this adds test coverage so edge cases can't cause silent failures.`,
      `this proves the engine works under adversarial conditions.`,
    ],
    performance: [
      `this makes inference faster on the same hardware.`,
      `this is a real speed upgrade, not just cleanup.`,
      `this cuts wasted compute time.`,
    ],
    product: [
      `this improves the user experience.`,
      `this fixes a product rough edge.`,
      `this makes the product feel smoother.`,
    ],
    economics: [
      `this protects worker payouts and token economics.`,
      `this fixes an economics edge case so the math is trustworthy.`,
      `this ensures workers and holders are treated fairly.`,
    ],
    infra: [
      `this upgrades the core engine internals.`,
      `this improves the foundation for bigger models and swarms.`,
      `this makes the infrastructure safer and cleaner.`,
    ],
    docs: [
      `documentation update.`,
    ],
  };

  const pool = openers[cat];
  const idx = (title.length + cat.length) % pool.length;
  let out = pool[idx];

  if (phrase) out += ` ${phrase}.`;

  // add body detail if useful and not too long
  if (firstGraph && firstGraph.length > 40 && firstGraph.length < 400) {
    const detail = firstGraph.slice(0, 200).toLowerCase();
    out += ` — ${detail}`;
  }

  return out.slice(0, 600);
}

function nextMilestone(cat: Category): string {
  const map: Record<Category, string> = {
    security: 'prove it holds up under live network conditions.',
    reliability: 'show it surviving churn and load on the live swarm.',
    performance: 'confirm the speedup through live c0mpute jobs.',
    product: 'ship to all users and measure impact.',
    economics: 'validate with real payout flows on mainnet.',
    infra: 'route the improvement into live c0mpute jobs.',
    docs: 'turn the plan into shipped code.',
  };
  return map[cat];
}

function deterministicCard(packet: CommitPacket): ChangelogCard {
  const matched = roadmapItems
    .map((item) => {
      const hay = `${packet.title}\n${packet.body}\n${packet.changedFiles.map((f) => `${f.file}\n${f.patch || ''}`).join('\n')}`.toLowerCase();
      const score = item.signals.filter((s) => hay.includes(s.toLowerCase())).length;
      return { item, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const files = packet.changedFiles.map((f) => f.file);
  const cat = classify(packet.title, packet.body, files);
  const codeNotes = summarizeEvidence(packet).slice(0, 5).map((f) => ({
    file: f.file,
    lines: f.lines,
    note: `changed ${f.stat}`,
  }));

  const scoreMap: Record<Category, number> = {
    performance: 4,
    security: 4,
    reliability: 3.5,
    infra: 3,
    economics: 3.5,
    product: 2.5,
    docs: 1,
  };

  return {
    id: `${packet.repo}-${packet.shortSha}`.replace(/[^a-zA-Z0-9_-]/g, '-'),
    repo: packet.repo,
    sha: packet.shortSha,
    url: packet.url,
    title: bullishTitle(packet.title, cat),
    tldr: `${packet.stats.files} files, +${packet.stats.additions}/-${packet.stats.deletions}.`,
    plainEnglish: plainSummary(packet.title, packet.body, cat),
    whyItMatters: matched[0]
      ? `advances ${matched[0].item.lane.toLowerCase()} → ${matched[0].item.title.toLowerCase()}.`
      : 'roadmap progress signal.',
    roadmap: matched.length
      ? matched.map(({ item }) => ({ lane: item.lane, item: item.title, movement: 'progress signal.' }))
      : [{ lane: 'Protocol', item: 'general progress', movement: 'progress signal.' }],
    evidence: [
      { label: 'repo', detail: packet.repo },
      { label: 'commit', detail: `${packet.shortSha} · ${packet.author || 'unknown'} · ${packet.date?.split('T')[0] || ''}` },
      { label: 'diff', detail: `+${packet.stats.additions}/-${packet.stats.deletions} across ${packet.stats.files} files` },
    ],
    codeNotes,
    nextMilestone: nextMilestone(cat),
    confidence: 'medium',
    score: scoreMap[cat],
    createdAt: new Date().toISOString(),
  };
}

// ─── API rewrite path (uses OPENAI-compatible endpoint if key set) ──

export async function analyzeCommit(packet: CommitPacket, apiKey = process.env.OPENAI_API_KEY): Promise<ChangelogCard> {
  if (!apiKey) return deterministicCard(packet);

  try {
    const client = new OpenAI({ apiKey, baseURL: process.env.OPENAI_BASE_URL || undefined });
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const roadmap = roadmapItems.map((i) => `${i.lane} / ${i.title} [${i.status}]: ${i.description}`).join('\n');
    const evidence = summarizeEvidence(packet);

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You turn engineering commits into public, investor-readable roadmap changelog cards. You are bullish, precise, and evidence-first. Output strict JSON only.' },
        {
          role: 'user',
          content: `Write a bullish but credible public roadmap changelog card for nontechnical holders.

Core rule:
- the title MUST lead with the user/investor-readable impact, not the technical mechanism
- bad title: "CUDA graph EAGLE aux compatibility"
- good title: "roughly 3x faster swarm inference in latest benchmark"
- if the packet contains numbers, put the most important number in the headline
- if no number exists, headline the roadmap outcome

Rules:
- calm c0mpute tone, no hype slop, no guarantees
- explain what changed in plain English
- mention repo, commit, files/lines when useful
- tie to roadmap items
- include TLDR for less technical readers
- caveats framed as next milestone, not FUD
- do not invent benchmarks or tests not present in the packet
- output strict JSON only matching the schema

ROADMAP:
${roadmap}

COMMIT PACKET:
${JSON.stringify({
            repo: packet.repo,
            sha: packet.shortSha,
            title: packet.title,
            body: packet.body.slice(0, 2000),
            author: packet.author,
            date: packet.date,
            stats: packet.stats,
            url: packet.url,
            evidence,
          }, null, 2)}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.35,
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const parsed = CardSchema.parse(JSON.parse(raw));
    return {
      id: `${packet.repo}-${packet.shortSha}`.replace(/[^a-zA-Z0-9_-]/g, '-'),
      repo: packet.repo,
      sha: packet.shortSha,
      url: packet.url,
      createdAt: new Date().toISOString(),
      ...parsed,
    };
  } catch (error) {
    console.error(`API rewrite failed for ${packet.shortSha}, using deterministic fallback`, error);
    return deterministicCard(packet);
  }
}
