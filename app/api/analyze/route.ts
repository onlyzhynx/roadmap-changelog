import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeCommit } from '@/lib/analyzer';
import { fetchLatestCommitPackets } from '@/lib/github';

const BodySchema = z.object({
  repo: z.string().default('leyten/shard'),
  limit: z.number().int().min(1).max(10).default(3),
  ref: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json().catch(() => ({})));
    const packets = await fetchLatestCommitPackets({ repo: body.repo, limit: body.limit, ref: body.ref });
    const cards = [];
    for (const packet of packets) cards.push(await analyzeCommit(packet));
    return NextResponse.json({ cards });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
