# Phase 2: Quick Test Response Processing & API Route

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the quick-test response mapping, schema-based explanation generation, and a Next.js API endpoint that accepts survey responses and returns calculated Hartman world values as JSON.

**Architecture:** Port three Java classes (`QuickTestResponsesMapper`, `EsquemasJsonHandler`, `QuickTestResponseGenerator`) to TypeScript under `src/lib/hartman/quick-test/`. Add a POST route at `/api/iahrsubmit` that validates input, maps/calculates, and returns structured JSON. No PDF/Word/Email generation in this phase (Phase 3).

**Tech Stack:** Next.js 16 App Router, TypeScript 5, Vitest 4, existing world-calculator.ts from Phase 1.

---

## Context

Phase 1 delivered the complete calculation engine in `src/lib/hartman/`. Phase 2 adds the layer that bridges raw survey responses to that engine and exposes it via an HTTP endpoint.

**Java source references:**
- `/Users/jcsastre/workspace/PvhService/src/main/java/pvh/quicktest/QuickTestResponsesMapper.java`
- `/Users/jcsastre/workspace/PvhService/src/main/java/pvh/quicktest/EsquemasJsonHandler.java`
- `/Users/jcsastre/workspace/PvhService/src/main/java/pvh/quicktest/QuickTestResponseGenerator.java`
- `/Users/jcsastre/workspace/PvhService/src/main/java/pvh/controllers/QuickTestcontrollers.java`
- `/Users/jcsastre/workspace/PvhService/src/main/resources/esquemas.json`
- `/Users/jcsastre/workspace/PvhService/src/test/java/pvh/quicktest/QuickTestResponsesMapperTest.java`

**Existing hartman-web files to import:**
- `@/lib/hartman/world-calculator` — `calculateValues`, `calculateRelationValues`
- `@/lib/hartman/domain/dimension` — `getTextValuationByScoreSpanish`
- `@/lib/hartman/domain/world` — `World`
- `@/lib/hartman/types/world-values` — `WorldValues`
- `@/lib/hartman/types/world-relations-values` — `WorldRelationsValues`

---

### Task 1: Port QuickTestResponsesMapper

**Files:**
- Create: `src/lib/hartman/quick-test/responses-mapper.ts`
- Create: `tests/lib/hartman/quick-test/responses-mapper.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/lib/hartman/quick-test/responses-mapper.test.ts
import { describe, it, expect } from 'vitest';
import { mapResponsesToStandardFormat } from '@/lib/hartman/quick-test/responses-mapper';

describe('mapResponsesToStandardFormat', () => {
  it('maps correctly for Guillem ME', () => {
    const responses = [13, 11, 1, 6, 10, 17, 2, 3, 5, 18, 15, 4, 14, 9, 16, 8, 12, 7];
    const expected  = [3,  7,  8, 12, 9,  4,  18,16, 14, 5,  2,  17, 1,  13, 11, 15, 6,  10];
    expect(mapResponsesToStandardFormat(responses)).toEqual(expected);
  });

  it('maps correctly for Eveline MI', () => {
    const responses = [2,  11, 17, 6, 1,  15, 10, 18, 13, 4,  5,  16, 3,  14, 9,  8, 7,  12];
    const expected  = [5,  1,  13, 10, 11, 4,  17, 16, 15, 7,  2,  18, 9,  14, 6,  12, 3,  8];
    expect(mapResponsesToStandardFormat(responses)).toEqual(expected);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test -- tests/lib/hartman/quick-test/responses-mapper.test.ts
```

Expected: FAIL with "Cannot find module"

**Step 3: Write the implementation**

```typescript
// src/lib/hartman/quick-test/responses-mapper.ts

const ORIGINAL_POSITIONS: number[] = [6, 9, 10, 11, 13, 5, 17, 16, 12, 4, 1, 18, 2, 14, 8, 15, 3, 7];

const RESPONSES_MAPPING: Record<number, number> = {
  1: 6,  2: 9,  3: 10, 4: 11, 5: 13, 6: 5,
  7: 17, 8: 16, 9: 12, 10: 4, 11: 1, 12: 18,
  13: 2, 14: 14, 15: 8, 16: 15, 17: 3, 18: 7,
};

export function mapResponsesToStandardFormat(responses: number[]): number[] {
  const mapped = new Array<number>(18);
  for (let i = 0; i < 18; i++) {
    const originalPosition = ORIGINAL_POSITIONS[i];
    for (let j = 0; j < 18; j++) {
      if (RESPONSES_MAPPING[responses[j]] === originalPosition) {
        mapped[i] = j + 1;
        break;
      }
    }
  }
  return mapped;
}
```

**Step 4: Run test to verify it passes**

```bash
npm run test -- tests/lib/hartman/quick-test/responses-mapper.test.ts
```

Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add src/lib/hartman/quick-test/responses-mapper.ts tests/lib/hartman/quick-test/responses-mapper.test.ts
git commit -m "feat: add QuickTestResponsesMapper TypeScript port"
```

---

### Task 2: Copy esquemas.json and port EsquemasHandler

**Files:**
- Create: `src/lib/hartman/quick-test/esquemas.json` (copy from Java resources)
- Create: `src/lib/hartman/quick-test/esquemas-handler.ts`
- Create: `tests/lib/hartman/quick-test/esquemas-handler.test.ts`

**Step 1: Copy the JSON file**

Copy `/Users/jcsastre/workspace/PvhService/src/main/resources/esquemas.json`
to `src/lib/hartman/quick-test/esquemas.json`.

Do NOT edit the JSON content — copy it verbatim.

**Step 2: Write the failing test**

```typescript
// tests/lib/hartman/quick-test/esquemas-handler.test.ts
import { describe, it, expect } from 'vitest';
import { getEstructura } from '@/lib/hartman/quick-test/esquemas-handler';

describe('getEstructura', () => {
  it('returns ME DIM_I Concreto Desbloqueado Estructura Desbloqueada', () => {
    const result = getEstructura('ME', 'DIM_I', 'Concreto Desbloqueado', 'Estructura Desbloqueada');
    expect(result).toBe('En las relaciones interpersonales tienes fluidez, buen manejo y objetividad.');
  });

  it('returns MI DIM_I Concreto Bloqueado Estructura Bloqueada Negativamente', () => {
    const result = getEstructura('MI', 'DIM_I', 'Concreto Bloqueado', 'Estructura Bloqueada Negativamente');
    expect(result).toBe('En autoestima estás bloqueada con cierta tendencia a desvalorarte.');
  });

  it('returns null for unknown section', () => {
    // @ts-expect-error testing invalid input
    const result = getEstructura('MX', 'DIM_I', 'Concreto Desbloqueado', 'Estructura Desbloqueada');
    expect(result).toBeNull();
  });
});
```

**Step 3: Run test to verify it fails**

```bash
npm run test -- tests/lib/hartman/quick-test/esquemas-handler.test.ts
```

Expected: FAIL with "Cannot find module"

**Step 4: Write the implementation**

```typescript
// src/lib/hartman/quick-test/esquemas-handler.ts
import esquemas from './esquemas.json';

export type WorldKey = 'ME' | 'MI';
export type DimensionKey = 'DIM_I' | 'DIM_E' | 'DIM_S';
export type ConcretoType = 'Concreto Desbloqueado' | 'Concreto Bloqueado';
export type EstructuraType =
  | 'Estructura Desbloqueada'
  | 'Estructura Bloqueada Negativamente'
  | 'Estructura Bloqueada Positivamente';

type EsquemasJson = {
  [world in WorldKey]: {
    [dim in DimensionKey]: {
      [concreto in ConcretoType]: {
        [estructura in EstructuraType]: string;
      };
    };
  };
};

const data = esquemas as EsquemasJson;

export function getEstructura(
  section: WorldKey,
  dimension: DimensionKey,
  concretoType: ConcretoType,
  estructuraType: EstructuraType,
): string | null {
  const worldData = data[section];
  if (!worldData) return null;
  const dim = worldData[dimension];
  if (!dim) return null;
  const concreto = dim[concretoType];
  if (!concreto) return null;
  return concreto[estructuraType] ?? null;
}
```

**Step 5: Run test to verify it passes**

```bash
npm run test -- tests/lib/hartman/quick-test/esquemas-handler.test.ts
```

Expected: PASS (3 tests)

**Step 6: Commit**

```bash
git add src/lib/hartman/quick-test/esquemas.json src/lib/hartman/quick-test/esquemas-handler.ts tests/lib/hartman/quick-test/esquemas-handler.test.ts
git commit -m "feat: add EsquemasHandler TypeScript port with JSON schema data"
```

---

### Task 3: Port QuickTestResponseGenerator

**Files:**
- Create: `src/lib/hartman/quick-test/response-generator.ts`
- Create: `tests/lib/hartman/quick-test/response-generator.test.ts`

**Context:** `generateExplanations` maps two sets of 18 responses, calculates `WorldValues` for EXTERNAL and INTERNAL, then returns 6 text valuations (one per dimension per world), in this order:
`[ext_DIM_I, ext_DIM_E, ext_DIM_S, int_DIM_I, int_DIM_E, int_DIM_S]`

The text valuation is `getTextValuationByScoreSpanish(dimensionScore.value)` from `dimension.ts`.

The test uses a known input from the Java `QuickTestResponseGenerator.main()`:
- `responsesExternal = [5, 8, 3, 11, 12, 7, 18, 16, 10, 14, 2, 15, 1, 4, 13, 17, 6, 9]`
- `responsesInternal = [6, 1, 10, 12, 13, 9, 17, 15, 16, 5, 8, 18, 4, 11, 3, 14, 2, 7]`

To get expected values, run the Java main method or derive from `getTextValuationByScoreSpanish` applied to the calculated dimension scores. You will need to run the Java code OR compute from the calculator.

**NOTE:** Rather than hardcoding the expected strings, derive them by running `calculateValues` in the test itself and asserting the text matches `getTextValuationByScoreSpanish`. This makes the test portable.

**Step 1: Write the failing test**

```typescript
// tests/lib/hartman/quick-test/response-generator.test.ts
import { describe, it, expect } from 'vitest';
import { generateExplanations } from '@/lib/hartman/quick-test/response-generator';
import { calculateValues } from '@/lib/hartman/world-calculator';
import { getTextValuationByScoreSpanish } from '@/lib/hartman/domain/dimension';
import { World } from '@/lib/hartman/domain/world';
import { mapResponsesToStandardFormat } from '@/lib/hartman/quick-test/responses-mapper';

describe('generateExplanations', () => {
  it('returns 6 text valuations for external and internal worlds', () => {
    const responsesExternal = [5, 8, 3, 11, 12, 7, 18, 16, 10, 14, 2, 15, 1, 4, 13, 17, 6, 9];
    const responsesInternal = [6, 1, 10, 12, 13, 9, 17, 15, 16, 5, 8, 18, 4, 11, 3, 14, 2, 7];

    const result = generateExplanations(responsesExternal, responsesInternal);

    // Derive expected values using the same engine
    const mappedExt = mapResponsesToStandardFormat(responsesExternal);
    const mappedInt = mapResponsesToStandardFormat(responsesInternal);
    const extValues = calculateValues(World.EXTERNAL, mappedExt);
    const intValues = calculateValues(World.INTERNAL, mappedInt);

    expect(result).toHaveLength(6);
    expect(result[0]).toBe(getTextValuationByScoreSpanish(extValues.dimIValues.dimensionScore.value));
    expect(result[1]).toBe(getTextValuationByScoreSpanish(extValues.dimEValues.dimensionScore.value));
    expect(result[2]).toBe(getTextValuationByScoreSpanish(extValues.dimSValues.dimensionScore.value));
    expect(result[3]).toBe(getTextValuationByScoreSpanish(intValues.dimIValues.dimensionScore.value));
    expect(result[4]).toBe(getTextValuationByScoreSpanish(intValues.dimEValues.dimensionScore.value));
    expect(result[5]).toBe(getTextValuationByScoreSpanish(intValues.dimSValues.dimensionScore.value));
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test -- tests/lib/hartman/quick-test/response-generator.test.ts
```

Expected: FAIL with "Cannot find module"

**Step 3: Write the implementation**

```typescript
// src/lib/hartman/quick-test/response-generator.ts
import { mapResponsesToStandardFormat } from './responses-mapper';
import { calculateValues } from '@/lib/hartman/world-calculator';
import { getTextValuationByScoreSpanish } from '@/lib/hartman/domain/dimension';
import { World } from '@/lib/hartman/domain/world';

export function generateExplanations(
  responsesExternal: number[],
  responsesInternal: number[],
): string[] {
  const mappedExternal = mapResponsesToStandardFormat(responsesExternal);
  const mappedInternal = mapResponsesToStandardFormat(responsesInternal);

  const externalValues = calculateValues(World.EXTERNAL, mappedExternal);
  const internalValues = calculateValues(World.INTERNAL, mappedInternal);

  return [
    getTextValuationByScoreSpanish(externalValues.dimIValues.dimensionScore.value),
    getTextValuationByScoreSpanish(externalValues.dimEValues.dimensionScore.value),
    getTextValuationByScoreSpanish(externalValues.dimSValues.dimensionScore.value),
    getTextValuationByScoreSpanish(internalValues.dimIValues.dimensionScore.value),
    getTextValuationByScoreSpanish(internalValues.dimEValues.dimensionScore.value),
    getTextValuationByScoreSpanish(internalValues.dimSValues.dimensionScore.value),
  ];
}
```

**Step 4: Run test to verify it passes**

```bash
npm run test -- tests/lib/hartman/quick-test/response-generator.test.ts
```

Expected: PASS (1 test)

**Step 5: Commit**

```bash
git add src/lib/hartman/quick-test/response-generator.ts tests/lib/hartman/quick-test/response-generator.test.ts
git commit -m "feat: add QuickTestResponseGenerator TypeScript port"
```

---

### Task 4: TypeScript DTOs for the API

**Files:**
- Create: `src/lib/hartman/quick-test/types.ts`

No test needed — pure type definitions.

**Step 1: Write the types**

```typescript
// src/lib/hartman/quick-test/types.ts
import type { WorldValues } from '@/lib/hartman/types/world-values';
import type { WorldRelationsValues } from '@/lib/hartman/types/world-relations-values';

export interface QuicktestRequest {
  clave: string;
  edad: string;
  sexo: string;
  estadoCivil: string;
  hijos: string;
  profesión: string;
  metodoInput: string;
  /** 36 values (ext+int) or 54 values (ext+int+sexual), each 1-18 */
  responses: number[];
}

export interface QuicktestResponse {
  externalWorldValues: WorldValues;
  internalWorldValues: WorldValues;
  sexualWorldValues: WorldValues | null;
  worldRelationsValues: WorldRelationsValues;
}
```

**Step 2: Verify TypeScript compiles**

```bash
npm run build
```

Expected: Build succeeds with no type errors.

**Step 3: Commit**

```bash
git add src/lib/hartman/quick-test/types.ts
git commit -m "feat: add QuicktestRequest and QuicktestResponse DTOs"
```

---

### Task 5: Next.js API Route `/api/iahrsubmit`

**Files:**
- Create: `src/app/api/iahrsubmit/route.ts`
- Create: `tests/app/api/iahrsubmit.test.ts`

**Context:** This is a Next.js App Router route handler. It ports the Java `@PostMapping("/iahrsubmit")` endpoint. In Phase 2 it returns the calculated values as JSON instead of sending email.

**Step 1: Write the failing test**

```typescript
// tests/app/api/iahrsubmit.test.ts
import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/iahrsubmit/route';

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

  it('returns 200 with calculated values for 36 valid responses', async () => {
    // Known valid responses (ext+int from Phase 1 Felicidad test data)
    const responsesExternal = [4, 1, 18, 12, 17, 6, 5, 15, 7, 14, 16, 9, 8, 2, 11, 10, 3, 13];
    const responsesInternal = [17, 13, 12, 9, 11, 7, 15, 18, 6, 1, 16, 3, 14, 4, 2, 10, 5, 8];

    const request = new Request('http://localhost/api/iahrsubmit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clave: 'Felicidad',
        edad: '35',
        sexo: 'F',
        estadoCivil: 'casada',
        hijos: '2',
        profesión: 'profesora',
        metodoInput: 'web',
        responses: [...responsesExternal, ...responsesInternal],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('externalWorldValues');
    expect(body).toHaveProperty('internalWorldValues');
    expect(body).toHaveProperty('worldRelationsValues');
    expect(body.sexualWorldValues).toBeNull();
  });

  it('returns 200 with sexual world when 54 responses provided', async () => {
    const responsesExternal = [4, 1, 18, 12, 17, 6, 5, 15, 7, 14, 16, 9, 8, 2, 11, 10, 3, 13];
    const responsesInternal = [17, 13, 12, 9, 11, 7, 15, 18, 6, 1, 16, 3, 14, 4, 2, 10, 5, 8];
    const responsesSexual =   [3, 9, 14, 17, 16, 6, 10, 18, 7, 13, 15, 5, 8, 4, 2, 11, 12, 1];

    const request = new Request('http://localhost/api/iahrsubmit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clave: 'Felicidad',
        edad: '35',
        sexo: 'F',
        estadoCivil: 'casada',
        hijos: '2',
        profesión: 'profesora',
        metodoInput: 'web',
        responses: [...responsesExternal, ...responsesInternal, ...responsesSexual],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.sexualWorldValues).not.toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm run test -- tests/app/api/iahrsubmit.test.ts
```

Expected: FAIL with "Cannot find module"

**Step 3: Write the implementation**

```typescript
// src/app/api/iahrsubmit/route.ts
import { NextResponse } from 'next/server';
import { calculateValues, calculateRelationValues } from '@/lib/hartman/world-calculator';
import { World } from '@/lib/hartman/domain/world';
import type { QuicktestRequest, QuicktestResponse } from '@/lib/hartman/quick-test/types';

export async function POST(request: Request): Promise<NextResponse> {
  let body: QuicktestRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { responses } = body;

  if (!responses || responses.length < 36) {
    return NextResponse.json({ error: 'Invalid number of responses' }, { status: 400 });
  }

  const responsesExternal = responses.slice(0, 18);
  const responsesInternal = responses.slice(18, 36);
  const responsesSexual = responses.length >= 54 ? responses.slice(36, 54) : null;

  try {
    const externalWorldValues = calculateValues(World.EXTERNAL, responsesExternal);
    const internalWorldValues = calculateValues(World.INTERNAL, responsesInternal);
    const sexualWorldValues = responsesSexual
      ? calculateValues(World.SEXUAL, responsesSexual)
      : null;

    const worldRelationsValues = calculateRelationValues(externalWorldValues, internalWorldValues);

    const responseBody: QuicktestResponse = {
      externalWorldValues,
      internalWorldValues,
      sexualWorldValues,
      worldRelationsValues,
    };

    return NextResponse.json(responseBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Calculation error: ${message}` }, { status: 400 });
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

Expected: All tests pass (Phase 1 tests + Phase 2 tests)

**Step 6: Verify build and lint**

```bash
npm run build && npm run lint
```

Expected: No errors.

**Step 7: Commit**

```bash
git add src/app/api/iahrsubmit/route.ts tests/app/api/iahrsubmit.test.ts
git commit -m "feat: add /api/iahrsubmit POST route returning calculated world values"
```

---

## Verification Checklist

1. `npm run test` — all tests pass (Phase 1 + Phase 2)
2. `npm run build` — TypeScript compilation succeeds
3. `npm run lint` — zero linting errors
4. Phase 2 file count: 7 new source files + 4 new test files

## Deliverables Summary

```
src/lib/hartman/quick-test/
├── responses-mapper.ts        # mapResponsesToStandardFormat()
├── esquemas.json              # copied from Java resources verbatim
├── esquemas-handler.ts        # getEstructura() lookup
├── response-generator.ts      # generateExplanations()
└── types.ts                   # QuicktestRequest, QuicktestResponse

src/app/api/iahrsubmit/
└── route.ts                   # POST handler

tests/lib/hartman/quick-test/
├── responses-mapper.test.ts   # 2 tests (ported from Java)
├── esquemas-handler.test.ts   # 3 tests
└── response-generator.test.ts # 1 test

tests/app/api/
└── iahrsubmit.test.ts         # 3 tests
```
