# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # TypeScript compile + Next.js production build
npm run lint         # ESLint (eslint.config.mjs)
npm run test         # Run all Vitest tests
npm run test -- tests/path/to/file.test.ts  # Run a single test file
```

## Architecture

This is a **Next.js 16 App Router** application implementing the **Hartman Value Profile (PVH)** psychological assessment tool — a TypeScript port of a Java backend (`PvhService`).

### Data Flow

```
POST /api/iahrsubmit
  └─> ReportsService (orchestrator)
        ├─> world-calculator: calculateValues() × 3 worlds (EXTERNAL, INTERNAL, SEXUAL)
        ├─> world-calculator: calculateRelationValues() → WorldRelationsValues
        ├─> PdfGenerator  → PDF bytes (pdf-lib, uses template in public/templates/)
        ├─> WordGenerator → DOCX buffer (docx library)
        └─> EmailService  → sends both files via Mailgun
```

### Key Layers

**`src/lib/hartman/domain/`** — Pure domain constants and lookup functions. No state, no I/O.
- `axiogram.ts` / `axiogram-base.ts` — 18 axiogram definitions per world (content/interpretation text for reports)
- `dimension.ts` — 3 dimension types (INTRINSIC, EXTRINSIC, SISTEMIC); cell position arrays `DIM_I/E/S_CELLS_POSITIONS`; Spanish text valuation functions
- `world.ts` — 3 world types (EXTERNAL, INTERNAL, SEXUAL); Spanish names and per-world dimension explanations
- `report-type.ts`, `word-type.ts` — enums for PDF/Word generation modes

**`src/lib/hartman/types/`** — TypeScript interfaces for calculation outputs:
- `WorldValues` — full result of `calculateValues()`: scores, counts, weighted/noticeable axiogram lists
- `WorldRelationsValues` — BQR1, BQR2, DIF1/DIF2 ratios between external and internal worlds
- `RemarkableInteger` / `RemarkableBigDecimal` — value + boolean flag indicating it exceeds a threshold

**`src/lib/hartman/world-calculator.ts`** — Core computation engine. Entry points:
- `calculateValues(world, responses[18])` → `WorldValues`
- `calculateRelationValues(externalValues, internalValues)` → `WorldRelationsValues`
- `calculateFormulaWarns(ext, int, sexual)` → `AxiogramsByFormulaWarns`

**`src/lib/hartman/quick-test/`** — Survey input processing layer:
- `responses-mapper.ts` — remaps raw survey ordering to the canonical 18-position format expected by `calculateValues()`
- `esquemas-handler.ts` + `esquemas.json` — looks up text explanations by world/dimension/concretoType/estructuraType
- `response-generator.ts` — generates 6 dimension text valuations (ext×3 + int×3)
- `types.ts` — `QuicktestRequest` (input DTO with `clave`, demographics, `responses[]`) and `QuicktestResponse`

**`src/lib/hartman/generator/`** — Output generation:
- `reports-service.ts` — `generateAndSendReport()` orchestrates PDF + Word + email in parallel
- `pdf-generator.ts` — fills `public/templates/` PDF template using pdf-lib
- `word-generator.ts` — generates DOCX using the docx library
- `email-service.ts` — sends via Mailgun (requires env vars below)

**`src/middleware.ts`** — Subdomain routing: `admin.*` rewrites to `/admin/*`, `test.*` rewrites to `/test/*`.

### Test Structure

Tests mirror `src/` under `tests/`. Vitest is configured with `globals: true` and `@` aliased to `./src`.

### Environment Variables (required at runtime)

```
MAILGUN_API_KEY
MAILGUN_DOMAIN
MAILGUN_FROM_EMAIL
MAILGUN_FROM_NAME
MAILGUN_TO_EMAIL
```

Copy `.env.local.example` to `.env.local` for local development.

### Important Implementation Notes

- Responses arrays must be exactly 18 values, each 1–18, with no duplicates — `calculateValues()` throws on violations.
- The `QuicktestRequest.responses` field is 36 values (ext+int) or 54 values (ext+int+sexual); the API route slices them.
- `getDimensionLargeName()` in `dimension.ts` intentionally returns the short name — this preserves a bug from the Java source.
- All document generation is in-memory (no temp files), suitable for serverless.
- `Dockerfile.nextjs` uses Next.js standalone output and includes Prisma setup (for a future DB integration not yet active).
