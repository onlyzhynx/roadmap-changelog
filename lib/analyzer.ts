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

function firstParagraph(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .find(Boolean) || '';
}

function fallbackCard(packet: CommitPacket): ChangelogCard {
  const matched = roadmapItems
    .map((item) => {
      const hay = `${packet.title}\n${packet.body}\n${packet.changedFiles.map((f) => `${f.file}\n${f.patch || ''}`).join('\n')}`.toLowerCase();
      const score = item.signals.filter((s) => hay.includes(s.toLowerCase())).length;
      return { item, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const codeNotes = summarizeEvidence(packet).slice(0, 5).map((f) => ({
    file: f.file,
    lines: f.lines,
    note: `Changed ${f.stat}. Review this file for the concrete implementation detail.`,
  }));

  return {
    id: `${packet.repo}-${packet.shortSha}`.replace(/[^a-zA-Z0-9_-]/g, '-'),
    repo: packet.repo,
    sha: packet.shortSha,
    url: packet.url,
    title: packet.title,
    tldr: `${packet.title}. ${packet.stats.files} files changed, +${packet.stats.additions}/-${packet.stats.deletions}.`,
    plainEnglish: firstParagraph(packet.body).slice(0, 700) || 'This commit updates the repo. Connect an OpenAI-compatible API key for richer plain-English analysis.',
    whyItMatters: matched[0]
      ? `Looks related to ${matched[0].item.lane} → ${matched[0].item.title}.`
      : 'Roadmap impact needs model analysis or manual review.',
    roadmap: matched.map(({ item }) => ({ lane: item.lane, item: item.title, movement: 'Potential progress signal based on changed files and commit text.' })),
    evidence: [
      { label: 'Repo', detail: packet.repo },
      { label: 'Commit', detail: `${packet.shortSha} · ${packet.author || 'unknown'} · ${packet.date || 'unknown date'}` },
      { label: 'Diff', detail: `${packet.stats.files} files changed, +${packet.stats.additions}/-${packet.stats.deletions}` },
    ],
    codeNotes,
    nextMilestone: 'Add a verified run, benchmark, receipt, or product route that shows this change live.',
    confidence: 'medium',
    score: matched.length ? 3 : 1.5,
    createdAt: new Date().toISOString(),
  };
}

export async function analyzeCommit(packet: CommitPacket, apiKey = process.env.OPENAI_API_KEY): Promise<ChangelogCard> {
  if (!apiKey) return fallbackCard(packet);

  const client = new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const roadmap = roadmapItems.map((i) => `${i.lane} / ${i.title} [${i.status}]: ${i.description}`).join('\n');
  const evidence = summarizeEvidence(packet);

  const prompt = {
    role: 'user' as const,
    content: `Write a bullish but credible public roadmap changelog card for nontechnical holders.\n\nCore rule:\n- the title MUST lead with the user/investor-readable impact, not the technical mechanism\n- bad title: \"CUDA graph EAGLE aux compatibility\"\n- good title: \"roughly 3x faster swarm inference in latest benchmark\"\n- if the packet contains numbers, put the most important number in the headline\n- if no number exists, headline the roadmap outcome: \"swarm gets harder to break during node churn\"\n\nRules:\n- calm c0mpute tone, no hype slop, no guarantees\n- explain what changed in plain English\n- mention repo, commit, files/lines when useful\n- tie to roadmap items\n- include TLDR for less technical readers\n- caveats should be framed as next milestone, not FUD\n- do not invent benchmarks or tests not present in the packet\n- output strict JSON only matching the schema\n\nROADMAP:\n${roadmap}\n\nCOMMIT PACKET:\n${JSON.stringify({
      repo: packet.repo,
      sha: packet.shortSha,
      title: packet.title,
      body: packet.body,
      author: packet.author,
      date: packet.date,
      stats: packet.stats,
      url: packet.url,
      evidence,
    }, null, 2)}`,
  };

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: 'You turn engineering commits into public, investor-readable roadmap changelog cards. You are bullish, precise, and evidence-first.' },
      prompt,
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
