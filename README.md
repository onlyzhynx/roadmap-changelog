# c0mpute changelog

Repo updates translated into c0mpute-style public roadmap changelog cards.

## what it does

- tracks `leyten/shard` and `leyten/c0mpute`
- turns commits into non-technical changelog entries
- shows what roadmap area each commit affects
- keeps proof links/files visible
- includes local personal notes per repo
- has an OpenAI-compatible analyzer API for later c0mpute/ZERO-hosted models

## run

```bash
npm install
npm run dev
```

open:

```text
http://localhost:3000
```

## analyze via cli

```bash
OPENAI_API_KEY=... \
OPENAI_BASE_URL=https://api.openai.com/v1 \
OPENAI_MODEL=gpt-4o-mini \
npm run analyze leyten/shard 3
```

Swap `OPENAI_BASE_URL` later for a c0mpute OpenAI-compatible endpoint.

## api

```bash
curl -s http://localhost:3000/api/analyze \
  -H 'content-type: application/json' \
  -d '{"repo":"leyten/shard","limit":3}'
```

## files

- `app/page.tsx` - side-by-side changelog UI
- `app/globals.css` - c0mpute visual system
- `lib/changelog.ts` - starter changelog data
- `lib/analyzer.ts` - OpenAI-compatible prompt/analyzer
- `lib/github.ts` - GitHub commit fetcher
