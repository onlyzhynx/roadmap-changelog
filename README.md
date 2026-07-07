# c0mpute changelog

Repo updates translated into c0mpute-style public roadmap changelog cards.

## what it does

- tracks `leyten/shard` and `leyten/c0mpute`
- turns technical commits into non-technical, bullish changelog entries
- leads with the *impact*, not the raw commit title
- shows which roadmap area the change affects
- keeps proof/files visible so the update does not feel made up
- uses any OpenAI-compatible model endpoint

## run

```bash
npm install
npm run dev
```

open:

```text
http://localhost:3000
```

## use openai, c0mpute, or any compatible endpoint

The analyzer uses the OpenAI chat-completions shape. To switch providers, change env vars only.

```bash
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
```

Later, point it at c0mpute:

```bash
OPENAI_BASE_URL=https://api.c0mpute.ai/v1
OPENAI_API_KEY=...
OPENAI_MODEL=qwen-3.5-27b
```

or any other model exposed through the same API:

```bash
OPENAI_MODEL=minimax-m2.5
```

## analyze via cli

```bash
OPENAI_API_KEY=... \
OPENAI_BASE_URL=https://api.openai.com/v1 \
OPENAI_MODEL=gpt-4o-mini \
npm run analyze leyten/shard 3
```

## api

```bash
curl -s http://localhost:3000/api/analyze \
  -H 'content-type: application/json' \
  -d '{"repo":"leyten/shard","limit":3}'
```

## how the prompt keeps it useful

The base prompt tells the model to:

- write for nontechnical holders, not engineers
- make the headline about the visible impact
- use numbers in the headline when the evidence contains numbers
- avoid raw titles like `cuda graph eagle aux compatibility`
- prefer headlines like `roughly 3x faster swarm inference in latest benchmark`
- tie every update to roadmap items
- include proof files/lines
- frame caveats as the next milestone
- never invent benchmarks/tests

So the output stays bullish, readable, and evidence-bound.

## files

- `app/page.tsx` - side-by-side changelog UI
- `app/globals.css` - c0mpute visual system
- `lib/changelog.ts` - starter changelog data
- `lib/analyzer.ts` - OpenAI-compatible bullish analyzer prompt
- `lib/github.ts` - GitHub commit fetcher
