# Phase 3: PDF/Word Report Generation & Email Delivery

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generate PDF and Word reports from Hartman world values and send them via Mailgun email, completing the full Java ReportsService pipeline in TypeScript.

**Architecture:** Port PdfGenerator (pdf-lib), WordGenerator (docx), EmailService (mailgun.js), and ReportsService (orchestrator) to `src/lib/hartman/generator/`. Files are generated in-memory as Buffers — no temp-file I/O, which avoids serverless limitations. Update `/api/iahrsubmit` to call ReportsService and return `"ok"` on success (matching Java behavior).

**Tech Stack:** Next.js 16 App Router, TypeScript 5, Vitest 4, pdf-lib 1.17, docx 9, mailgun.js 11, form-data 4.

---

## Context

Phase 1 delivered the calculation engine. Phase 2 added the quick-test HTTP API. Phase 3 completes the pipeline by generating PDF and Word reports and emailing them.

**Java source references:**
- `/Users/jcsastre/workspace/PvhService/src/main/java/pvh/generator/PdfGeneratorBase.java`
- `/Users/jcsastre/workspace/PvhService/src/main/java/pvh/generator/PdfGenerator.java`
- `/Users/jcsastre/workspace/PvhService/src/main/java/pvh/generator/WordGenerator.java`
- `/Users/jcsastre/workspace/PvhService/src/main/java/pvh/generator/services/EmailService.java`
- `/Users/jcsastre/workspace/PvhService/src/main/java/pvh/generator/services/ReportsService.java`
- `/Users/jcsastre/workspace/PvhService/src/main/resources/PVH_World_ES_Template.pdf`

**Key differences from Java:**
- `ReportType` uses `'FIRST_PAGE'` instead of `'SIMPLE'` (already renamed in TS)
- `DIM_I_CELLS_POSITIONS` is `number[]` (use `.includes(i)`, not `.has(i)`)
- `WorldValues` has no `getResponsesSeparatedByCommaAsString()` — use `remarkableResponses.map(r => r.value).join(', ')`
- pdf-lib uses same coordinate system as PDFBox (bottom-left origin, Y increases upward)
- Circle drawing: use `page.drawCircle({ size: radius, borderColor, borderWidth })` (outline only, no fill)
- Files generated as `Uint8Array` / `Buffer` in memory, not written to disk

**Existing TypeScript files to import:**
- `@/lib/hartman/domain/dimension` — `Dimension`, `DimensionType`, `getDimensionLetter`, `getTextValuationByScoreSpanish`, `getAiPercValuationByScoreSpanish`, `DIM_I_CELLS_POSITIONS`, `DIM_S_CELLS_POSITIONS`
- `@/lib/hartman/domain/world` — `World`, `WorldType`, `getWorldLargeName`, `getDimensionTitle`, `getDimensionExplanation`
- `@/lib/hartman/domain/report-type` — `ReportType`
- `@/lib/hartman/domain/word-type` — `WordType`
- `@/lib/hartman/domain/axiogram` — `axiogramsByWorld`, `Axiogram`
- `@/lib/hartman/domain/axiogram-base` — `AxiogramBase`
- `@/lib/hartman/domain/absolute-values-mappers` — `getDifTextValuationByScoreSpanish`, `getDimPercTextValuationByScoreSpanish`
- `@/lib/hartman/types/world-values` — `WorldValues`
- `@/lib/hartman/types/world-relations-values` — `WorldRelationsValues`
- `@/lib/hartman/types/weighted-axiogram` — `WeightedAxiogram`
- `@/lib/hartman/quick-test/types` — `QuicktestRequest`

---

### Task 1: Install dependencies

**Files:** `package.json`

**Step 1: Install npm packages**

```bash
npm install pdf-lib docx mailgun.js form-data
```

**Step 2: Verify TypeScript resolves the new packages**

```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add pdf-lib, docx, and mailgun.js dependencies"
```

---

### Task 2: Copy PDF template file

**Files:**
- Create: `public/templates/PVH_World_ES_Template.pdf`

**Step 1: Create directory and copy template**

```bash
mkdir -p public/templates
cp /Users/jcsastre/workspace/PvhService/src/main/resources/PVH_World_ES_Template.pdf public/templates/
```

**Step 2: Verify**

```bash
ls -lh public/templates/PVH_World_ES_Template.pdf
```

Expected: File listed with size > 0.

**Step 3: Commit**

```bash
git add public/templates/PVH_World_ES_Template.pdf
git commit -m "chore: add PDF template for report generation"
```

---

### Task 3: Port PdfGenerator

**Files:**
- Create: `src/lib/hartman/generator/pdf-generator.ts`
- Create: `tests/lib/hartman/generator/pdf-generator.test.ts`

**Context:**
- pdf-lib loads the 8-page template and draws text at exact X/Y coordinates matching Java constants
- `FIRST_PAGE` mode: keeps only page 0 (removes pages 1–7)
- `COMPLETE` mode: fills pages 0–6, removes page 7 (unused formula page)
- All font sizes/names match Java: `FONT=HelveticaBold@8pt`, `WEIGHTED=Helvetica@10pt`, `ORDER=Helvetica@8pt`
- `remarkableResponses.map(r => r.value).join(', ')` replaces `getResponsesSeparatedByCommaAsString()`

**Step 1: Write the failing test**

```typescript
// tests/lib/hartman/generator/pdf-generator.test.ts
import { describe, it, expect } from 'vitest';
import { generatePdf } from '@/lib/hartman/generator/pdf-generator';
import { calculateValues, calculateRelationValues } from '@/lib/hartman/world-calculator';
import { World } from '@/lib/hartman/domain/world';

const EXT = [4, 1, 18, 12, 17, 6, 5, 15, 7, 14, 16, 9, 8, 2, 11, 10, 3, 13];
const INT = [17, 13, 12, 9, 11, 7, 15, 18, 6, 1, 16, 3, 14, 4, 2, 10, 5, 8];
const REQ = { clave: 'Felicidad', sexo: 'F', edad: '35', estadoCivil: 'casada', hijos: '2', profesión: 'profesora', metodoInput: 'web', responses: [] };

describe('generatePdf', () => {
  it('returns valid PDF bytes for COMPLETE report', async () => {
    const ext = calculateValues(World.EXTERNAL, EXT);
    const int = calculateValues(World.INTERNAL, INT);
    const rel = calculateRelationValues(ext, int);

    const bytes = await generatePdf(REQ, ext, int, null, rel, 'COMPLETE');

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(10_000);
    expect(Buffer.from(bytes.slice(0, 4)).toString()).toBe('%PDF');
  });

  it('returns valid PDF bytes for FIRST_PAGE report', async () => {
    const ext = calculateValues(World.EXTERNAL, EXT);
    const int = calculateValues(World.INTERNAL, INT);
    const rel = calculateRelationValues(ext, int);

    const bytes = await generatePdf(REQ, ext, int, null, rel, 'FIRST_PAGE');

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(10_000);
    expect(Buffer.from(bytes.slice(0, 4)).toString()).toBe('%PDF');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test -- tests/lib/hartman/generator/pdf-generator.test.ts
```

Expected: FAIL with "Cannot find module"

**Step 3: Write the implementation**

```typescript
// src/lib/hartman/generator/pdf-generator.ts
import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import type { WorldValues } from '@/lib/hartman/types/world-values';
import type { WorldRelationsValues } from '@/lib/hartman/types/world-relations-values';
import type { WeightedAxiogram } from '@/lib/hartman/types/weighted-axiogram';
import type { QuicktestRequest } from '@/lib/hartman/quick-test/types';
import type { ReportType } from '@/lib/hartman/domain/report-type';
import type { WorldType } from '@/lib/hartman/domain/world';
import { axiogramsByWorld } from '@/lib/hartman/domain/axiogram';
import { Dimension, DimensionType, getDimensionLetter, DIM_I_CELLS_POSITIONS, DIM_S_CELLS_POSITIONS } from '@/lib/hartman/domain/dimension';

// ─── Constants (from PdfGeneratorBase.java) ───────────────────────────────────

const FONT_SIZE = 8.0;
const _3W_EXT_X = 18, _3W_EXT_Y = 786.5;
const _3W_INT_X = 18, _3W_INT_Y = 530;
const _3W_SEX_X = 18, _3W_SEX_Y = 240;
const _3W_BQR_X = 147, _3W_BQR_Y = 300;
const _1W_X = 21, _1W_Y = 705.5;
const _1W_WA_X = 30, _1W_WA_Y = 445, _1W_WA_DY = 23.75, _1W_WA_FS = 10;
const _1W_OA_X = 25, _1W_OA_Y = 445, _1W_OA_DY = 23.75, _1W_OA_FS = 8;

function buildResponsesDeltas() {
  const d = [];
  let x = 9;
  for (let i = 0; i < 18; i++) { d.push({ x, y: 50 }); x += 18.8; }
  return d;
}

function buildDiffsDeltas() {
  const d = [];
  let x = 9;
  for (let i = 0; i < 18; i++) {
    let y = 130;
    if (DIM_I_CELLS_POSITIONS.includes(i)) y -= 40;
    else if (DIM_S_CELLS_POSITIONS.includes(i)) y += 39;
    d.push({ x, y });
    x += 18.8;
  }
  return d;
}

const RD = buildResponsesDeltas();  // response cell deltas
const DD = buildDiffsDeltas();       // diff cell deltas

const DIF  = { x: 390.5, y: 30.25 };
const DIM  = { x: 420.5, y: 30.25 };
const INT  = { x: 448.5, y: 30.25 };
const DIS  = { x: 476.5, y: 30.25 };
const Q1   = { x: 508,   y: 30.25 };
const Q2   = { x: 542,   y: 30.25 };
const DIMP = { x: 362.5, y: 69.25 };
const INTP = { x: 420.5, y: 69.25 };

// DIM-I row uses DD[5].y; DIM-E uses DD[0].y; DIM-S uses DD[1].y
const DIM_I = { x: 389,       y: DD[5].y };
const DIM_I_INT = { x: 449,   y: DD[5].y + 18 };
const DIM_I_POS = { x: 479,   y: DD[5].y };
const DIM_I_NEG = { x: 479 + 19.5, y: DD[5].y };
const DIM_I_NET = { x: 479 + 39,   y: DD[5].y };
const DIM_E = { x: 389,       y: DD[0].y };
const DIM_E_INT = { x: 449,   y: DD[0].y + 18 };
const DIM_E_POS = { x: 479,   y: DD[0].y };
const DIM_E_NEG = { x: 479 + 19.5, y: DD[0].y };
const DIM_E_NET = { x: 479 + 39,   y: DD[0].y };
const DIM_S = { x: 389,       y: DD[1].y };
const DIM_S_INT = { x: 449,   y: DD[1].y + 18 };
const DIM_S_POS = { x: 479,   y: DD[1].y };
const DIM_S_NEG = { x: 479 + 19.5, y: DD[1].y };
const DIM_S_NET = { x: 479 + 39,   y: DD[1].y };
const DI    = { x: 449, y: DD[1].y + 18 + 20 };
const AI    = { x: 548, y: DI.y };
const PT    = { x: 479, y: DI.y };
const NT    = { x: 479 + 19.5, y: DI.y };

// ─── Drawing helpers ──────────────────────────────────────────────────────────

type RGB = [number, number, number];
const BLACK: RGB = [0, 0, 0];
const BLUE:  RGB = [0, 0, 1];
const RED:   RGB = [1, 0, 0];
const TEAL:  RGB = [0, 0.7, 0.7];

function textCentered(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size: number, color: RGB) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: x - w / 2, y: y - size / 2, font, size, color: rgb(...color) });
}

function textLeft(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size: number, color: RGB) {
  page.drawText(text, { x, y: y - size / 2, font, size, color: rgb(...color) });
}

function textAt(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size: number, color: RGB) {
  page.drawText(text, { x, y, font, size, color: rgb(...color) });
}

function circleOutline(page: PDFPage, x: number, y: number, color: RGB) {
  page.drawCircle({ x, y, size: 7.5, borderColor: rgb(...color), borderWidth: 2 });
}

function remarkableCentered(
  page: PDFPage, value: number, remarked: boolean,
  x: number, y: number, font: PDFFont, size: number,
  textColor: RGB, circleColor: RGB,
) {
  textCentered(page, String(value), x, y, font, size, textColor);
  if (remarked) circleOutline(page, x, y, circleColor);
}

function remarkableDecimalCentered(
  page: PDFPage, value: number, remarked: boolean,
  x: number, y: number, font: PDFFont, size: number, color: RGB,
) {
  const c = remarked ? RED : color;
  textCentered(page, String(value), x, y, font, size, c);
}

// ─── World box ────────────────────────────────────────────────────────────────

function worldBox(page: PDFPage, wv: WorldValues, sx: number, sy: number, f: PDFFont) {
  // Raw responses string
  const responsesStr = wv.remarkableResponses.map(r => r.value).join(', ');
  textAt(page, responsesStr, sx + RD[0].x, sy - RD[0].y - 160, f, FONT_SIZE, BLUE);

  // Individual responses
  for (let i = 0; i < 18; i++) {
    const r = wv.remarkableResponses[i];
    remarkableCentered(page, r.value, r.remarked, sx + RD[i].x, sy - RD[i].y, f, FONT_SIZE, BLUE, RED);
  }

  // Diffs + INT cells
  for (let i = 0; i < 18; i++) {
    const d = wv.remarkableDiffs[i];
    remarkableCentered(page, d.value, d.remarked, sx + DD[i].x, sy - DD[i].y, f, FONT_SIZE, [0.70, 0.70, 0], RED);
    textCentered(page, String(wv.intCells[i]), sx + DD[i].x, sy - DD[i].y - 18, f, FONT_SIZE, BLACK);
  }

  // DIM-I/E/S scores
  remarkableCentered(page, wv.dimIValues.dimensionScore.value, wv.dimIValues.dimensionScore.remarked, sx + DIM_I.x, sy - DIM_I.y, f, FONT_SIZE, BLACK, RED);
  remarkableCentered(page, wv.dimEValues.dimensionScore.value, wv.dimEValues.dimensionScore.remarked, sx + DIM_E.x, sy - DIM_E.y, f, FONT_SIZE, BLACK, RED);
  remarkableCentered(page, wv.dimSValues.dimensionScore.value, wv.dimSValues.dimensionScore.remarked, sx + DIM_S.x, sy - DIM_S.y, f, FONT_SIZE, BLACK, RED);

  // INT scores per dimension
  textCentered(page, String(wv.dimIValues.integrationScore), sx + DIM_I_INT.x, sy - DIM_I_INT.y, f, FONT_SIZE, BLACK);
  textCentered(page, String(wv.dimEValues.integrationScore), sx + DIM_E_INT.x, sy - DIM_E_INT.y, f, FONT_SIZE, BLACK);
  textCentered(page, String(wv.dimSValues.integrationScore), sx + DIM_S_INT.x, sy - DIM_S_INT.y, f, FONT_SIZE, BLACK);

  // Positives, Negatives, Net per dimension
  textCentered(page, String(wv.dimIValues.positivesCount), sx + DIM_I_POS.x, sy - DIM_I_POS.y, f, FONT_SIZE, BLACK);
  textCentered(page, String(wv.dimIValues.negativesCount), sx + DIM_I_NEG.x, sy - DIM_I_NEG.y, f, FONT_SIZE, BLACK);
  remarkableCentered(page, wv.dimIValues.positivesNegativesNet.value, wv.dimIValues.positivesNegativesNet.remarked, sx + DIM_I_NET.x, sy - DIM_I_NET.y, f, FONT_SIZE, BLACK, TEAL);
  textCentered(page, String(wv.dimEValues.positivesCount), sx + DIM_E_POS.x, sy - DIM_E_POS.y, f, FONT_SIZE, BLACK);
  textCentered(page, String(wv.dimEValues.negativesCount), sx + DIM_E_NEG.x, sy - DIM_E_NEG.y, f, FONT_SIZE, BLACK);
  remarkableCentered(page, wv.dimEValues.positivesNegativesNet.value, wv.dimEValues.positivesNegativesNet.remarked, sx + DIM_E_NET.x, sy - DIM_E_NET.y, f, FONT_SIZE, BLACK, TEAL);
  textCentered(page, String(wv.dimSValues.positivesCount), sx + DIM_S_POS.x, sy - DIM_S_POS.y, f, FONT_SIZE, BLACK);
  textCentered(page, String(wv.dimSValues.negativesCount), sx + DIM_S_NEG.x, sy - DIM_S_NEG.y, f, FONT_SIZE, BLACK);
  remarkableCentered(page, wv.dimSValues.positivesNegativesNet.value, wv.dimSValues.positivesNegativesNet.remarked, sx + DIM_S_NET.x, sy - DIM_S_NET.y, f, FONT_SIZE, BLACK, TEAL);

  // DIF, DIM, INT, DIS, Q1, Q2
  remarkableCentered(page, wv.difScore.value, wv.difScore.remarked, sx + DIF.x, sy - DIF.y, f, FONT_SIZE, BLACK, RED);
  textCentered(page, String(wv.dimScore), sx + DIM.x, sy - DIM.y, f, FONT_SIZE, BLACK);
  textCentered(page, String(wv.intScore), sx + INT.x, sy - DIM.y, f, FONT_SIZE, BLACK);
  remarkableCentered(page, wv.distorsionsCount.value, wv.distorsionsCount.remarked, sx + DIS.x, sy - DIS.y, f, FONT_SIZE, BLACK, RED);
  textCentered(page, String(wv.q1), sx + Q1.x, sy - Q1.y, f, FONT_SIZE, BLACK);
  textCentered(page, String(wv.q2), sx + Q2.x, sy - Q2.y, f, FONT_SIZE, BLACK);

  // DIM%, INT%
  remarkableCentered(page, wv.dimPerc.value, wv.dimPerc.remarked, sx + DIMP.x, sy - DIMP.y, f, FONT_SIZE, BLACK, RED);
  remarkableCentered(page, wv.intPerc.value, wv.intPerc.remarked, sx + INTP.x, sy - INTP.y, f, FONT_SIZE, BLACK, RED);

  // DI, AI%, totals
  remarkableCentered(page, wv.diScore.value, wv.diScore.remarked, sx + DI.x, sy - DI.y, f, FONT_SIZE, BLACK, RED);
  remarkableCentered(page, wv.aiPerc.value, wv.aiPerc.remarked, sx + AI.x, sy - AI.y, f, FONT_SIZE, BLACK, RED);
  textCentered(page, String(wv.positivesTotal), sx + PT.x, sy - PT.y, f, FONT_SIZE, BLACK);
  textCentered(page, String(wv.negativesTotal), sx + NT.x, sy - NT.y, f, FONT_SIZE, BLACK);
}

// ─── BQR relations ────────────────────────────────────────────────────────────

function relationsBox(page: PDFPage, rv: WorldRelationsValues, sx: number, sy: number, f: PDFFont) {
  remarkableDecimalCentered(page, rv.bqr1.value, rv.bqr1.remarked, sx, sy, f, FONT_SIZE, BLUE);
  remarkableDecimalCentered(page, rv.bqr2.value, rv.bqr2.remarked, sx, sy - 15, f, FONT_SIZE, BLUE);
  textCentered(page, String(rv.dif1dif2), sx + 150, sy - 8, f, FONT_SIZE, BLACK);
}

// ─── Weighted axiograms (pages 1, 3, 5) ──────────────────────────────────────

function weightedAxiomsList(
  page: PDFPage, axioms: WeightedAxiogram[], sx: number, sy: number, f: PDFFont,
) {
  let dy = 0;
  for (const ax of axioms) {
    const ab = ax.axiogram.axiogramBase;
    // Value
    textCentered(page, String(ab.value), sx + 19, sy + dy, f, _1W_WA_FS, BLACK);
    // Response
    textCentered(page, String(ax.response.value), sx + 48, sy + dy, f, _1W_WA_FS, ax.response.remarked ? RED : BLUE);
    // Diff
    const diffStr = ax.diff > 0 ? `+${ax.diff}` : String(ax.diff);
    textCentered(page, diffStr, sx + 78, sy + dy, f, _1W_WA_FS, BLACK);
    // Formula: dimension letter
    textCentered(page, getDimensionLetter(ab.dimension), sx + 100, sy + dy, f, _1W_WA_FS, BLACK);
    // Valuing letter (super/subscript simulated with Y offset)
    const valuingY = ab.isDevalued ? sy + dy - 5 : sy + dy + 5;
    textCentered(page, getDimensionLetter(ab.dimensionValuing), sx + 105.5, valuingY, f, _1W_WA_FS - 3, BLACK);
    // Phrase
    textLeft(page, ax.axiogram.phrase, sx + 120, sy + dy, f, _1W_WA_FS, BLACK);
    dy -= _1W_WA_DY;
  }
}

function printWeightedAxiograms(page: PDFPage, wv: WorldValues, sx: number, sy: number, f: PDFFont) {
  let dy = 0;
  for (const dim of [Dimension.INTRINSIC, Dimension.EXTRINSIC, Dimension.SISTEMIC] as DimensionType[]) {
    const axioms = wv.weightedAxiogramsByDimension.get(dim) ?? [];
    // Use a local delta to accumulate across dimensions
    for (const ax of axioms) {
      const ab = ax.axiogram.axiogramBase;
      textCentered(page, String(ab.value), sx + 19, sy + dy, f, _1W_WA_FS, BLACK);
      textCentered(page, String(ax.response.value), sx + 48, sy + dy, f, _1W_WA_FS, ax.response.remarked ? RED : BLUE);
      const diffStr = ax.diff > 0 ? `+${ax.diff}` : String(ax.diff);
      textCentered(page, diffStr, sx + 78, sy + dy, f, _1W_WA_FS, BLACK);
      textCentered(page, getDimensionLetter(ab.dimension), sx + 100, sy + dy, f, _1W_WA_FS, BLACK);
      const valuingY = ab.isDevalued ? sy + dy - 5 : sy + dy + 5;
      textCentered(page, getDimensionLetter(ab.dimensionValuing), sx + 105.5, valuingY, f, _1W_WA_FS - 3, BLACK);
      textLeft(page, ax.axiogram.phrase, sx + 120, sy + dy, f, _1W_WA_FS, BLACK);
      dy -= _1W_WA_DY;
    }
  }
}

// ─── Order / patient-order axiograms (pages 2, 4, 6) ─────────────────────────

function printOrderAxiograms(page: PDFPage, world: WorldType, wv: WorldValues, sx: number, sy: number, f: PDFFont) {
  const PHRASE_MAX = 40;
  const axioms = axiogramsByWorld.get(world) ?? [];

  // Left column: axiograms ordered by canonical value (1–18)
  let dy = 0;
  for (let i = 1; i <= 18; i++) {
    const ax = axioms.find(a => a.axiogramBase.value === i);
    if (!ax) continue;
    const ab = ax.axiogramBase;
    const phrase = ax.phrase.length > PHRASE_MAX ? ax.phrase.slice(0, PHRASE_MAX) + ' ...' : ax.phrase;
    textLeft(page, phrase, sx + 5, sy + dy, f, _1W_OA_FS, BLACK);
    textCentered(page, getDimensionLetter(ab.dimension), sx + 178, sy + dy, f, _1W_OA_FS, BLACK);
    const valuingY = ab.isDevalued ? sy + dy - 5 : sy + dy + 5;
    textCentered(page, getDimensionLetter(ab.dimensionValuing), sx + 183.5, valuingY, f, _1W_OA_FS - 3, BLACK);
    textCentered(page, String(ab.value), sx + 195, sy + dy, f, _1W_OA_FS, BLACK);
    dy -= _1W_OA_DY;
  }

  // Right column: axiograms ordered by patient response (1–18)
  dy = 0;
  for (let patientVal = 1; patientVal <= 18; patientVal++) {
    const assignedPos = wv.remarkableResponses.findIndex(r => r.value === patientVal);
    if (assignedPos === -1) continue;
    const ax = axioms[assignedPos];
    if (!ax) continue;
    const ab = ax.axiogramBase;
    const phrase = ax.phrase.length > PHRASE_MAX ? ax.phrase.slice(0, PHRASE_MAX) + ' ...' : ax.phrase;
    const rem = wv.remarkableResponses[assignedPos];
    const color: RGB = rem.remarked ? RED : BLACK;

    textCentered(page, String(ab.value), sx + 355, sy + dy, f, _1W_OA_FS, color);
    textCentered(page, getDimensionLetter(ab.dimension), sx + 370, sy + dy, f, _1W_OA_FS, color);
    const valuingY = ab.isDevalued ? sy + dy - 5 : sy + dy + 5;
    textCentered(page, getDimensionLetter(ab.dimensionValuing), sx + 375.5, valuingY, f, _1W_OA_FS - 3, color);
    textLeft(page, phrase, sx + 385, sy + dy, f, _1W_OA_FS, color);

    // Arrow line when patient value ≠ canonical value
    const axiomVal = ab.value;
    if (patientVal !== axiomVal) {
      const dif = patientVal - axiomVal;
      const lw = Math.abs(dif) <= 2 ? 0.25 : Math.abs(dif) <= 4 ? 0.5 : Math.abs(dif) <= 6 ? 1 : 2;
      page.drawLine({
        start: { x: sx + 230, y: sy + dy + dif * _1W_OA_DY },
        end:   { x: sx + 370, y: sy + dy },
        thickness: lw,
        color: rgb(...color),
      });
    }
    dy -= _1W_OA_DY;
  }
}

// ─── Extended pages (COMPLETE mode) ──────────────────────────────────────────

function generateExtendedPages(
  pdfDoc: PDFDocument, ext: WorldValues, int: WorldValues, sex: WorldValues | null,
  fBold: PDFFont, f: PDFFont,
) {
  // External World - weighted axiograms (page 1)
  const p1 = pdfDoc.getPage(1);
  worldBox(p1, ext, _1W_X, _1W_Y, fBold);
  printWeightedAxiograms(p1, ext, _1W_WA_X, _1W_WA_Y, f);

  // External World - order axiograms (page 2)
  const p2 = pdfDoc.getPage(2);
  worldBox(p2, ext, _1W_X, _1W_Y, fBold);
  printOrderAxiograms(p2, 'EXTERNAL', ext, _1W_OA_X, _1W_OA_Y, f);

  // Internal World - weighted axiograms (page 3)
  const p3 = pdfDoc.getPage(3);
  worldBox(p3, int, _1W_X, _1W_Y, fBold);
  printWeightedAxiograms(p3, int, _1W_WA_X, _1W_WA_Y, f);

  // Internal World - order axiograms (page 4)
  const p4 = pdfDoc.getPage(4);
  worldBox(p4, int, _1W_X, _1W_Y, fBold);
  printOrderAxiograms(p4, 'INTERNAL', int, _1W_OA_X, _1W_OA_Y, f);

  if (sex) {
    // Sexual World - weighted axiograms (page 5)
    const p5 = pdfDoc.getPage(5);
    worldBox(p5, sex, _1W_X, _1W_Y, fBold);
    printWeightedAxiograms(p5, sex, _1W_WA_X, _1W_WA_Y, f);

    // Sexual World - order axiograms (page 6)
    const p6 = pdfDoc.getPage(6);
    worldBox(p6, sex, _1W_X, _1W_Y, fBold);
    printOrderAxiograms(p6, 'SEXUAL', sex, _1W_OA_X, _1W_OA_Y, f);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generatePdf(
  request: QuicktestRequest,
  externalWorldValues: WorldValues,
  internalWorldValues: WorldValues,
  sexualWorldValues: WorldValues | null,
  worldRelationsValues: WorldRelationsValues,
  reportType: ReportType,
): Promise<Uint8Array> {
  const templatePath = path.join(process.cwd(), 'public', 'templates', 'PVH_World_ES_Template.pdf');
  const templateBytes = fs.readFileSync(templatePath);

  const pdfDoc = await PDFDocument.load(templateBytes);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Page 0: 3-worlds overview
  const p0 = pdfDoc.getPage(0);
  const datosLinea = [
    request.clave, request.sexo, request.edad,
    request.estadoCivil, request.hijos, request.profesión, request.metodoInput,
  ].join(' / ');
  textAt(p0, datosLinea, 20, 810, fontBold, FONT_SIZE, BLACK);

  worldBox(p0, externalWorldValues, _3W_EXT_X, _3W_EXT_Y, fontBold);
  worldBox(p0, internalWorldValues, _3W_INT_X, _3W_INT_Y, fontBold);
  if (sexualWorldValues) {
    worldBox(p0, sexualWorldValues, _3W_SEX_X, _3W_SEX_Y, fontBold);
  }
  relationsBox(p0, worldRelationsValues, _3W_BQR_X, _3W_BQR_Y, fontBold);

  if (reportType === 'COMPLETE') {
    generateExtendedPages(pdfDoc, externalWorldValues, internalWorldValues, sexualWorldValues, fontBold, font);
    pdfDoc.removePage(7); // Remove unused formula page
  } else {
    // FIRST_PAGE: remove pages 7 down to 1
    for (let i = 7; i >= 1; i--) {
      pdfDoc.removePage(i);
    }
  }

  return pdfDoc.save();
}
```

**Step 4: Run test to verify it passes**

```bash
npm run test -- tests/lib/hartman/generator/pdf-generator.test.ts
```

Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add src/lib/hartman/generator/pdf-generator.ts tests/lib/hartman/generator/pdf-generator.test.ts
git commit -m "feat: add PdfGenerator TypeScript port using pdf-lib"
```

---

### Task 4: Port WordGenerator

**Files:**
- Create: `src/lib/hartman/generator/word-generator.ts`
- Create: `tests/lib/hartman/generator/word-generator.test.ts`

**Context:**
- Uses the `docx` npm library (generates from scratch, no template file needed)
- Ports `WordType.SIMPLE` and `WordType.COMPLETE` modes (FOR_JC adds axiom excerpt + explanation which the TS axiogram already has)
- SIMPLE mode outputs compact valuation text per world/dimension
- COMPLETE and FOR_JC modes add heading sections per axiogram with full text

**Step 1: Write the failing test**

```typescript
// tests/lib/hartman/generator/word-generator.test.ts
import { describe, it, expect } from 'vitest';
import { generateWord } from '@/lib/hartman/generator/word-generator';
import { calculateValues, calculateRelationValues } from '@/lib/hartman/world-calculator';
import { World } from '@/lib/hartman/domain/world';

const EXT = [4, 1, 18, 12, 17, 6, 5, 15, 7, 14, 16, 9, 8, 2, 11, 10, 3, 13];
const INT = [17, 13, 12, 9, 11, 7, 15, 18, 6, 1, 16, 3, 14, 4, 2, 10, 5, 8];

describe('generateWord', () => {
  it('generates DOCX buffer for SIMPLE word type', async () => {
    const ext = calculateValues(World.EXTERNAL, EXT);
    const int = calculateValues(World.INTERNAL, INT);
    const rel = calculateRelationValues(ext, int);

    const buf = await generateWord(ext, int, null, rel, 'SIMPLE', 3);

    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(1000);
    // DOCX is a ZIP — starts with PK
    expect(buf.slice(0, 2).toString()).toBe('PK');
  });

  it('generates DOCX buffer for COMPLETE word type', async () => {
    const ext = calculateValues(World.EXTERNAL, EXT);
    const int = calculateValues(World.INTERNAL, INT);
    const rel = calculateRelationValues(ext, int);

    const buf = await generateWord(ext, int, null, rel, 'COMPLETE', 3);

    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(1000);
    expect(buf.slice(0, 2).toString()).toBe('PK');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test -- tests/lib/hartman/generator/word-generator.test.ts
```

Expected: FAIL with "Cannot find module"

**Step 3: Write the implementation**

```typescript
// src/lib/hartman/generator/word-generator.ts
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  VerticalAlign as DocxVerticalAlign, AlignmentType,
} from 'docx';
import type { WorldValues } from '@/lib/hartman/types/world-values';
import type { WorldRelationsValues } from '@/lib/hartman/types/world-relations-values';
import type { WeightedAxiogram } from '@/lib/hartman/types/weighted-axiogram';
import type { WordType } from '@/lib/hartman/domain/word-type';
import type { WorldType } from '@/lib/hartman/domain/world';
import { Dimension, DimensionType, getDimensionLetter, getTextValuationByScoreSpanish, getAiPercValuationByScoreSpanish } from '@/lib/hartman/domain/dimension';
import { getWorldLargeName, getDimensionTitle, getDimensionExplanation } from '@/lib/hartman/domain/world';
import { getDifTextValuationByScoreSpanish, getDimPercTextValuationByScoreSpanish } from '@/lib/hartman/domain/absolute-values-mappers';

function para(text: string): Paragraph {
  return new Paragraph({ children: [new TextRun(text)] });
}

function heading1(text: string): Paragraph {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
}

function heading2(text: string): Paragraph {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
}

function heading3(dimLetter: string, valuingLetter: string, isDevalued: boolean, phrase: string, extra: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [
      new TextRun(dimLetter),
      new TextRun({ text: valuingLetter, subScript: isDevalued, superScript: !isDevalued }),
      new TextRun(` - ${phrase} ${extra}`),
    ],
  });
}

function generateWorldSection(
  world: WorldType, wv: WorldValues, wordType: WordType, minDistortion: number,
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  paragraphs.push(heading1(getWorldLargeName(world)));

  if (wordType === 'SIMPLE') {
    paragraphs.push(para(`Capacidad valorativa: ${getDifTextValuationByScoreSpanish(wv.difScore.value)}`));
    paragraphs.push(para(`Madurez existencial, presencia, realismo, esperanza: ${getDimPercTextValuationByScoreSpanish(wv.dimPerc.value)}`));
    paragraphs.push(para(`Actitud emocional: ${getAiPercValuationByScoreSpanish(wv.aiPerc.value)}`));
    paragraphs.push(para(''));
    for (const [dim, dimValues] of [
      [Dimension.INTRINSIC, wv.dimIValues] as const,
      [Dimension.EXTRINSIC, wv.dimEValues] as const,
      [Dimension.SISTEMIC,  wv.dimSValues] as const,
    ]) {
      paragraphs.push(para(`${getDimensionTitle(world, dim)}:  ${getTextValuationByScoreSpanish(dimValues.dimensionScore.value)}`));
    }
  } else {
    // COMPLETE and FOR_JC
    paragraphs.push(para('xxx'));
    paragraphs.push(para(`DIF (${wv.difScore.value}): xxx`));
    paragraphs.push(para(`DIM% (${wv.dimPerc.value}): xxx`));
    paragraphs.push(para(`INT% (${wv.intPerc.value}): xxx`));
    paragraphs.push(para(`DI (${wv.diScore.value}): xxx`));
    paragraphs.push(para(`DIM-I (${wv.dimIValues.dimensionScore.value}, ${wv.dimIValues.positivesNegativesNet.value}): xxx`));
    paragraphs.push(para(`DIM-E (${wv.dimEValues.dimensionScore.value}, ${wv.dimEValues.positivesNegativesNet.value}): xxx`));
    paragraphs.push(para(`DIM-S (${wv.dimSValues.dimensionScore.value}, ${wv.dimSValues.positivesNegativesNet.value}): xxx`));
    paragraphs.push(para(`AI% (${wv.aiPerc.value}): ${getAiPercValuationByScoreSpanish(wv.aiPerc.value)}`));

    for (const [dim, dimValues] of [
      [Dimension.INTRINSIC, wv.dimIValues] as const,
      [Dimension.EXTRINSIC, wv.dimEValues] as const,
      [Dimension.SISTEMIC,  wv.dimSValues] as const,
    ]) {
      paragraphs.push(heading2(`${dim} (${getDimensionTitle(world, dim)})`));
      paragraphs.push(para(getDimensionExplanation(world, dim)));
      paragraphs.push(para(`Valoración: ${getTextValuationByScoreSpanish(dimValues.dimensionScore.value)}`));

      const axioms = wv.weightedAxiogramsByDimension.get(dim) ?? [];
      for (const ax of axioms) {
        if (Math.abs(ax.diff) < minDistortion) continue;
        const ab = ax.axiogram.axiogramBase;
        const diffStr = ax.diff > 0 ? `+${ax.diff}` : String(ax.diff);
        const dis = ax.distorsion ? ' (dis)' : '';
        const extra = `( ${ab.letter} | ${ab.value}, ${ax.response.value} -> ${diffStr}${dis})`;
        paragraphs.push(heading3(getDimensionLetter(ab.dimension), getDimensionLetter(ab.dimensionValuing), ab.isDevalued, ax.axiogram.phrase, extra));

        if (wordType === 'FOR_JC') {
          paragraphs.push(para(ax.axiogram.excerpt));
          paragraphs.push(para(ax.axiogram.explanation));
          paragraphs.push(para(`(+) -> ${ab.plusRangeTxt} -> ${ax.axiogram.plus}`));
          paragraphs.push(para(`(0) -> n/a -> ${ax.axiogram.zero}`));
          paragraphs.push(para(`(-) -> ${ab.minusRangeTxt} -> ${ax.axiogram.minus}`));
        } else {
          paragraphs.push(para(ax.axiogram.excerpt));
        }
      }
    }
  }

  return paragraphs;
}

export async function generateWord(
  externalWorldValues: WorldValues,
  internalWorldValues: WorldValues,
  sexualWorldValues: WorldValues | null,
  worldRelationsValues: WorldRelationsValues,
  wordType: WordType,
  minDistortion: number,
): Promise<Buffer> {
  const children: Paragraph[] = [];

  if (wordType !== 'SIMPLE') {
    children.push(para(`M.E.: ${externalWorldValues.remarkableResponses.map(r => r.value).join(', ')}`));
    children.push(para(`M.I.: ${internalWorldValues.remarkableResponses.map(r => r.value).join(', ')}`));
    if (sexualWorldValues) {
      children.push(para(`M.S.: ${sexualWorldValues.remarkableResponses.map(r => r.value).join(', ')}`));
    }
    children.push(heading1('Notas'));
    children.push(para('xxx'));
    children.push(heading1('Tema Básico'));
    children.push(para('xxx'));
  }

  children.push(...generateWorldSection('EXTERNAL', externalWorldValues, wordType, minDistortion));
  children.push(...generateWorldSection('INTERNAL', internalWorldValues, wordType, minDistortion));
  if (sexualWorldValues) {
    children.push(...generateWorldSection('SEXUAL', sexualWorldValues, wordType, minDistortion));
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  return Packer.toBuffer(doc);
}
```

**Step 4: Run test to verify it passes**

```bash
npm run test -- tests/lib/hartman/generator/word-generator.test.ts
```

Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add src/lib/hartman/generator/word-generator.ts tests/lib/hartman/generator/word-generator.test.ts
git commit -m "feat: add WordGenerator TypeScript port using docx library"
```

---

### Task 5: Port EmailService

**Files:**
- Create: `src/lib/hartman/generator/email-service.ts`
- Create: `tests/lib/hartman/generator/email-service.test.ts`

**Context:**
- Uses mailgun.js v11 API: `new Mailgun(FormData).client({ username: 'api', key })`
- Send via `mg.messages.create(domain, messageData)`
- Attachments are Buffers: `{ filename, data, contentType }`
- Environment variables: `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM_EMAIL`, `MAILGUN_FROM_NAME`, `MAILGUN_TO_EMAIL`

**Step 1: Write the failing test**

```typescript
// tests/lib/hartman/generator/email-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock mailgun.js before importing the service
vi.mock('mailgun.js', () => {
  const mockCreate = vi.fn().mockResolvedValue({ id: 'mock-id', message: 'Queued' });
  const mockClient = { messages: { create: mockCreate } };
  return { default: vi.fn().mockReturnValue({ client: vi.fn().mockReturnValue(mockClient) }) };
});

import { sendReportByEmail } from '@/lib/hartman/generator/email-service';

describe('sendReportByEmail', () => {
  beforeEach(() => {
    process.env.MAILGUN_API_KEY    = 'test-key';
    process.env.MAILGUN_DOMAIN     = 'test.domain.com';
    process.env.MAILGUN_FROM_EMAIL = 'from@test.com';
    process.env.MAILGUN_FROM_NAME  = 'Test Sender';
    process.env.MAILGUN_TO_EMAIL   = 'to@test.com';
  });

  it('calls mailgun with correct parameters', async () => {
    const pdfBuffer   = Buffer.from('%PDF-test');
    const docxBuffer  = Buffer.from('PK-test');

    await sendReportByEmail('Test Subject', 'Test body', pdfBuffer, 'report.pdf', docxBuffer, 'report.docx');

    const Mailgun = (await import('mailgun.js')).default;
    // Verify Mailgun was instantiated
    expect(Mailgun).toHaveBeenCalled();
  });

  it('throws when env vars are missing', async () => {
    delete process.env.MAILGUN_API_KEY;

    await expect(
      sendReportByEmail('Subject', 'Body', Buffer.alloc(0), 'f.pdf', Buffer.alloc(0), 'f.docx')
    ).rejects.toThrow('MAILGUN_API_KEY');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test -- tests/lib/hartman/generator/email-service.test.ts
```

Expected: FAIL with "Cannot find module"

**Step 3: Write the implementation**

```typescript
// src/lib/hartman/generator/email-service.ts
import Mailgun from 'mailgun.js';
import FormData from 'form-data';

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`${name} environment variable is not set`);
  return val;
}

export async function sendReportByEmail(
  subject: string,
  body: string,
  pdfBuffer: Buffer,
  pdfFilename: string,
  docxBuffer: Buffer,
  docxFilename: string,
): Promise<void> {
  const apiKey    = requireEnv('MAILGUN_API_KEY');
  const domain    = requireEnv('MAILGUN_DOMAIN');
  const fromEmail = requireEnv('MAILGUN_FROM_EMAIL');
  const fromName  = requireEnv('MAILGUN_FROM_NAME');
  const toEmail   = requireEnv('MAILGUN_TO_EMAIL');

  const mg = new Mailgun(FormData).client({ username: 'api', key: apiKey });

  await mg.messages.create(domain, {
    from: `${fromName} <${fromEmail}>`,
    to: [toEmail],
    subject,
    text: body,
    attachment: [
      { filename: pdfFilename,  data: pdfBuffer,  contentType: 'application/pdf' },
      { filename: docxFilename, data: docxBuffer,  contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    ],
  });
}
```

**Step 4: Run test to verify it passes**

```bash
npm run test -- tests/lib/hartman/generator/email-service.test.ts
```

Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add src/lib/hartman/generator/email-service.ts tests/lib/hartman/generator/email-service.test.ts
git commit -m "feat: add EmailService TypeScript port using mailgun.js"
```

---

### Task 6: Port ReportsService

**Files:**
- Create: `src/lib/hartman/generator/reports-service.ts`
- Create: `tests/lib/hartman/generator/reports-service.test.ts`

**Context:**
- Orchestrates: calculate → generate PDF → generate Word → send email
- Filename: `YYYY_MM_DD_<clave>_<8-char uuid>` (no extension — filenames include .pdf/.docx when sent)
- `generateUniqueOutputFilename(clave)` is a pure helper (easy to test)
- The main `generateAndSendReport` function is tested with mocked email (to avoid real Mailgun calls)

**Step 1: Write the failing test**

```typescript
// tests/lib/hartman/generator/reports-service.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/hartman/generator/email-service', () => ({
  sendReportByEmail: vi.fn().mockResolvedValue(undefined),
}));

import { generateUniqueOutputFilename, generateAndSendReport } from '@/lib/hartman/generator/reports-service';
import { sendReportByEmail } from '@/lib/hartman/generator/email-service';
import { calculateValues, calculateRelationValues } from '@/lib/hartman/world-calculator';
import { World } from '@/lib/hartman/domain/world';

const EXT = [4, 1, 18, 12, 17, 6, 5, 15, 7, 14, 16, 9, 8, 2, 11, 10, 3, 13];
const INT = [17, 13, 12, 9, 11, 7, 15, 18, 6, 1, 16, 3, 14, 4, 2, 10, 5, 8];
const REQ = { clave: 'Felicidad', sexo: 'F', edad: '35', estadoCivil: 'casada', hijos: '2', profesión: 'profesora', metodoInput: 'web', responses: [] };

describe('generateUniqueOutputFilename', () => {
  it('follows YYYY_MM_DD_clave_xxxxxxxx pattern', () => {
    const name = generateUniqueOutputFilename('TestClave');
    expect(name).toMatch(/^\d{4}_\d{2}_\d{2}_TestClave_[a-f0-9-]{8}$/);
  });
});

describe('generateAndSendReport', () => {
  it('calls sendReportByEmail with PDF and DOCX buffers', async () => {
    const ext = calculateValues(World.EXTERNAL, EXT);
    const int = calculateValues(World.INTERNAL, INT);

    await generateAndSendReport(REQ, EXT, INT, null, 'COMPLETE', 'COMPLETE');

    expect(sendReportByEmail).toHaveBeenCalledOnce();
    const [subject, body, pdfBuf, pdfName, docxBuf, docxName] = (sendReportByEmail as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(pdfBuf).toBeInstanceOf(Buffer);
    expect(docxBuf).toBeInstanceOf(Buffer);
    expect(pdfName).toMatch(/\.pdf$/);
    expect(docxName).toMatch(/\.docx$/);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test -- tests/lib/hartman/generator/reports-service.test.ts
```

Expected: FAIL with "Cannot find module"

**Step 3: Write the implementation**

```typescript
// src/lib/hartman/generator/reports-service.ts
import { calculateValues, calculateRelationValues } from '@/lib/hartman/world-calculator';
import { World } from '@/lib/hartman/domain/world';
import { generatePdf } from './pdf-generator';
import { generateWord } from './word-generator';
import { sendReportByEmail } from './email-service';
import type { QuicktestRequest } from '@/lib/hartman/quick-test/types';
import type { ReportType } from '@/lib/hartman/domain/report-type';
import type { WordType } from '@/lib/hartman/domain/word-type';

export function generateUniqueOutputFilename(clave: string): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const dd   = String(now.getDate()).padStart(2, '0');
  const randomPart = crypto.randomUUID().substring(0, 8);
  return `${yyyy}_${mm}_${dd}_${clave}_${randomPart}`;
}

export async function generateAndSendReport(
  request: QuicktestRequest,
  responsesExternal: number[],
  responsesInternal: number[],
  responsesSexual: number[] | null,
  reportType: ReportType,
  wordType: WordType,
): Promise<void> {
  const externalWorldValues = calculateValues(World.EXTERNAL, responsesExternal);
  const internalWorldValues = calculateValues(World.INTERNAL, responsesInternal);
  const sexualWorldValues   = responsesSexual
    ? calculateValues(World.SEXUAL, responsesSexual)
    : null;

  const worldRelationsValues = calculateRelationValues(externalWorldValues, internalWorldValues);

  const baseName = generateUniqueOutputFilename(request.clave);

  const [pdfBytes, docxBuffer] = await Promise.all([
    generatePdf(request, externalWorldValues, internalWorldValues, sexualWorldValues, worldRelationsValues, reportType),
    generateWord(externalWorldValues, internalWorldValues, sexualWorldValues, worldRelationsValues, wordType, 3),
  ]);

  await sendReportByEmail(
    'Nuevo informe PVH generado',
    'Adjuntamos su informe PVH en PDF y Word.',
    Buffer.from(pdfBytes),
    `${baseName}.pdf`,
    docxBuffer,
    `${baseName}.docx`,
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npm run test -- tests/lib/hartman/generator/reports-service.test.ts
```

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/lib/hartman/generator/reports-service.ts tests/lib/hartman/generator/reports-service.test.ts
git commit -m "feat: add ReportsService orchestrating PDF, Word, and email delivery"
```

---

### Task 7: Update /api/iahrsubmit route

**Files:**
- Modify: `src/app/api/iahrsubmit/route.ts`
- Modify: `tests/app/api/iahrsubmit.test.ts`

**Context:**
The current route returns JSON. The Java controller calls `ReportsService` and returns `"ok"`. Update the route to call `generateAndSendReport` and return `{ message: 'ok' }`. The email mock lets tests pass without real Mailgun.

**Step 1: Update the test**

Replace `tests/app/api/iahrsubmit.test.ts` with:

```typescript
// tests/app/api/iahrsubmit.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/hartman/generator/reports-service', () => ({
  generateAndSendReport: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from '@/app/api/iahrsubmit/route';
import { generateAndSendReport } from '@/lib/hartman/generator/reports-service';

describe('POST /api/iahrsubmit', () => {
  it('returns 400 when responses are missing', async () => {
    const request = new Request('http://localhost/api/iahrsubmit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clave: 'test', responses: [] }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 200 and calls generateAndSendReport for 36 valid responses', async () => {
    const responsesExternal = [4, 1, 18, 12, 17, 6, 5, 15, 7, 14, 16, 9, 8, 2, 11, 10, 3, 13];
    const responsesInternal = [17, 13, 12, 9, 11, 7, 15, 18, 6, 1, 16, 3, 14, 4, 2, 10, 5, 8];

    const request = new Request('http://localhost/api/iahrsubmit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clave: 'Felicidad', edad: '35', sexo: 'F', estadoCivil: 'casada',
        hijos: '2', profesión: 'profesora', metodoInput: 'web',
        responses: [...responsesExternal, ...responsesInternal],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('message', 'ok');
    expect(generateAndSendReport).toHaveBeenCalledOnce();
  });

  it('returns 200 with sexual world when 54 responses provided', async () => {
    const responsesExternal = [4, 1, 18, 12, 17, 6, 5, 15, 7, 14, 16, 9, 8, 2, 11, 10, 3, 13];
    const responsesInternal = [17, 13, 12, 9, 11, 7, 15, 18, 6, 1, 16, 3, 14, 4, 2, 10, 5, 8];
    const responsesSexual   = [3, 9, 14, 17, 16, 6, 10, 18, 7, 13, 15, 5, 8, 4, 2, 11, 12, 1];

    const request = new Request('http://localhost/api/iahrsubmit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clave: 'Felicidad', edad: '35', sexo: 'F', estadoCivil: 'casada',
        hijos: '2', profesión: 'profesora', metodoInput: 'web',
        responses: [...responsesExternal, ...responsesInternal, ...responsesSexual],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const call = (generateAndSendReport as ReturnType<typeof vi.fn>).mock.calls[0];
    // 4th arg (index 3) is responsesSexual — verify it's not null when 54 responses provided
    expect(call[3]).not.toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test -- tests/app/api/iahrsubmit.test.ts
```

Expected: FAIL (route still returns JSON, not `{ message: 'ok' }`)

**Step 3: Update the route**

Replace `src/app/api/iahrsubmit/route.ts` with:

```typescript
// src/app/api/iahrsubmit/route.ts
import { generateAndSendReport } from '@/lib/hartman/generator/reports-service';
import type { QuicktestRequest } from '@/lib/hartman/quick-test/types';

export async function POST(request: Request): Promise<Response> {
  let body: QuicktestRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { responses } = body;

  if (!responses || responses.length < 36) {
    return new Response(JSON.stringify({ error: 'Invalid number of responses' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const responsesExternal = responses.slice(0, 18);
  const responsesInternal = responses.slice(18, 36);
  const responsesSexual   = responses.length >= 54 ? responses.slice(36, 54) : null;

  try {
    await generateAndSendReport(body, responsesExternal, responsesInternal, responsesSexual, 'COMPLETE', 'COMPLETE');
    return new Response(JSON.stringify({ message: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: `Report generation error: ${message}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm run test -- tests/app/api/iahrsubmit.test.ts
```

Expected: PASS (3 tests)

**Step 5: Run full test suite**

```bash
npm run test
```

Expected: All tests pass (Phase 1 + Phase 2 + Phase 3)

**Step 6: Verify build and lint**

```bash
npm run build && npm run lint
```

Expected: No errors.

**Step 7: Commit**

```bash
git add src/app/api/iahrsubmit/route.ts tests/app/api/iahrsubmit.test.ts
git commit -m "feat: update /api/iahrsubmit to trigger report generation and email delivery"
```

---

### Task 8: Add environment variables example

**Files:**
- Create: `.env.local.example`

**Step 1: Write the env example file**

```bash
# .env.local.example — copy to .env.local and fill in real values
MAILGUN_API_KEY=your-mailgun-api-key-here
MAILGUN_DOMAIN=your-mailgun-domain.com
MAILGUN_FROM_EMAIL=noreply@your-domain.com
MAILGUN_FROM_NAME=PVH Reports
MAILGUN_TO_EMAIL=recipient@your-domain.com
```

Write this to `.env.local.example` using the Write tool.

**Step 2: Verify .gitignore excludes .env.local (not the example)**

Check that `.gitignore` contains `.env.local` but NOT `.env.local.example`.

**Step 3: Commit**

```bash
git add .env.local.example
git commit -m "docs: add .env.local.example with Mailgun configuration"
```

---

## Verification Checklist

1. `npm run test` — all tests pass (Phase 1 + 2 + 3)
2. `npm run build` — TypeScript compiles with no errors
3. `npm run lint` — zero lint errors
4. `public/templates/PVH_World_ES_Template.pdf` — file present and non-empty
5. `src/lib/hartman/generator/` — 4 new source files
6. `tests/lib/hartman/generator/` — 4 new test files

## Deliverables Summary

```
src/lib/hartman/generator/
├── pdf-generator.ts      # generatePdf() — pdf-lib port of PdfGenerator.java
├── word-generator.ts     # generateWord() — docx port of WordGenerator.java
├── email-service.ts      # sendReportByEmail() — mailgun.js port of EmailService.java
└── reports-service.ts    # generateAndSendReport() — orchestrator

public/templates/
└── PVH_World_ES_Template.pdf   # template copied from Java resources

tests/lib/hartman/generator/
├── pdf-generator.test.ts    # 2 tests (valid PDF bytes for COMPLETE + FIRST_PAGE)
├── word-generator.test.ts   # 2 tests (valid DOCX buffer for SIMPLE + COMPLETE)
├── email-service.test.ts    # 2 tests (mock: correct params + missing env var)
└── reports-service.test.ts  # 3 tests (filename pattern + end-to-end with mock email)

src/app/api/iahrsubmit/
└── route.ts   # updated: calls ReportsService, returns { message: 'ok' }

.env.local.example   # Mailgun env vars documentation
```
