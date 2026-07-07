import OpenAI from 'openai';
import { z } from 'zod';
import { roadmapItems } from './roadmap';
import type { ChangelogCard, CommitPacket } from './types';
import { summarizeEvidence } from './github';

const CardSchema = z.object({
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

const SYSTEM = `you are the c0mpute roadmap changelog engine.
your job: take technical github commits and rewrite them into public, bullish, non-technical changelog cards.

you write for crypto holders and investors who do not read code. they want to know: is this project actually building? is it getting better? does this move the roadmap forward?

tone:
- calm, confident, evidence-first. like a smart friend explaining what just happened.
- never hype slop, never "to the moon", never guarantees.
- bullish but honest. if something is just docs, say it's planning/cleanup. don't pretend docs are a product launch.
- lowercase by default. c0mpute aesthetic. no emoji.

the single most important rule:
- the title MUST lead with the user-visible impact, never the technical mechanism.
- BAD: "CUDA graph EAGLE aux compatibility"
- GOOD: "roughly 3x faster swarm inference in latest benchmark"
- BAD: "bound-check batched-decode KV write"
- GOOD: "swarm crashes less under heavy decode loads"
- if the commit contains numbers (speed, tests, scale), put the best number in the headline.
- if no numbers, headline the outcome: what can users/investors now expect that they couldn't before?

classification (use for scoring and framing):
- performance: faster inference, less latency, better throughput. score 4-5.
- security: anti-abuse, tamper prevention, identity binding, attack surface reduction. score 4-5.
- reliability: tests, crash fixes, race conditions, edge cases. score 3-4.
- economics: payouts, staking, subsidies, buybacks, token mechanics. score 3-4.
- infra: engine internals, deploy wiring, weight fetching, ring topology. score 3.
- product: UX, chat features, image gen, frontend. score 2-3.
- docs: session logs, planning, README. score 1. still write the card but frame as "planning/cleanup".

caveats:
- frame unknowns as "next milestone" not as risk/FUD.
- never invent benchmarks, tests, or numbers that aren't in the packet.
- if the commit body has real detail, use it. don't hallucinate.

output: strict JSON matching the schema. no markdown, no commentary.`;

export async function analyzeCommit(packet: CommitPacket): Promise<ChangelogCard> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is required (set it to your c0mpute endpoint key)');

  const client = new OpenAI({ apiKey, baseURL: process.env.OPENAI_BASE_URL || undefined });
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const roadmap = roadmapItems.map((i) => `${i.lane} / ${i.title} [${i.status}]: ${i.description}`).join('\n');
  const evidence = summarizeEvidence(packet);

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM },
      {
        role: 'user',
        content: `ROADMAP:\n${roadmap}\n\nCOMMIT PACKET:\n${JSON.stringify({
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
}
