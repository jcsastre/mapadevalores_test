import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import type { WorldValues } from '@/lib/hartman/types/world-values';
import type { WorldRelationsValues } from '@/lib/hartman/types/world-relations-values';
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
const _1W_WA_X = 30, _1W_WA_Y = 445, _1W_WA_FS = 10;
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
    remarkableCentered(page, d.value, d.remarked, sx + DD[i].x, sy - DD[i].y, f, FONT_SIZE, BLUE, RED);
    textCentered(page, String(wv.intCells[i]), sx + DD[i].x, sy - DD[i].y - 18, f, FONT_SIZE, BLUE);
  }

  // DIM-I/E/S scores
  remarkableCentered(page, wv.dimIValues.dimensionScore.value, wv.dimIValues.dimensionScore.remarked, sx + DIM_I.x, sy - DIM_I.y, f, FONT_SIZE, BLUE, RED);
  remarkableCentered(page, wv.dimEValues.dimensionScore.value, wv.dimEValues.dimensionScore.remarked, sx + DIM_E.x, sy - DIM_E.y, f, FONT_SIZE, BLUE, RED);
  remarkableCentered(page, wv.dimSValues.dimensionScore.value, wv.dimSValues.dimensionScore.remarked, sx + DIM_S.x, sy - DIM_S.y, f, FONT_SIZE, BLUE, RED);

  // INT scores per dimension
  textCentered(page, String(wv.dimIValues.integrationScore), sx + DIM_I_INT.x, sy - DIM_I_INT.y, f, FONT_SIZE, BLUE);
  textCentered(page, String(wv.dimEValues.integrationScore), sx + DIM_E_INT.x, sy - DIM_E_INT.y, f, FONT_SIZE, BLUE);
  textCentered(page, String(wv.dimSValues.integrationScore), sx + DIM_S_INT.x, sy - DIM_S_INT.y, f, FONT_SIZE, BLUE);

  // Positives, Negatives, Net per dimension
  textCentered(page, String(wv.dimIValues.positivesCount), sx + DIM_I_POS.x, sy - DIM_I_POS.y, f, FONT_SIZE, BLUE);
  textCentered(page, String(wv.dimIValues.negativesCount), sx + DIM_I_NEG.x, sy - DIM_I_NEG.y, f, FONT_SIZE, BLUE);
  remarkableCentered(page, wv.dimIValues.positivesNegativesNet.value, wv.dimIValues.positivesNegativesNet.remarked, sx + DIM_I_NET.x, sy - DIM_I_NET.y, f, FONT_SIZE, BLUE, TEAL);
  textCentered(page, String(wv.dimEValues.positivesCount), sx + DIM_E_POS.x, sy - DIM_E_POS.y, f, FONT_SIZE, BLUE);
  textCentered(page, String(wv.dimEValues.negativesCount), sx + DIM_E_NEG.x, sy - DIM_E_NEG.y, f, FONT_SIZE, BLUE);
  remarkableCentered(page, wv.dimEValues.positivesNegativesNet.value, wv.dimEValues.positivesNegativesNet.remarked, sx + DIM_E_NET.x, sy - DIM_E_NET.y, f, FONT_SIZE, BLUE, TEAL);
  textCentered(page, String(wv.dimSValues.positivesCount), sx + DIM_S_POS.x, sy - DIM_S_POS.y, f, FONT_SIZE, BLUE);
  textCentered(page, String(wv.dimSValues.negativesCount), sx + DIM_S_NEG.x, sy - DIM_S_NEG.y, f, FONT_SIZE, BLUE);
  remarkableCentered(page, wv.dimSValues.positivesNegativesNet.value, wv.dimSValues.positivesNegativesNet.remarked, sx + DIM_S_NET.x, sy - DIM_S_NET.y, f, FONT_SIZE, BLUE, TEAL);

  // DIF, DIM, INT, DIS, Q1, Q2
  remarkableCentered(page, wv.difScore.value, wv.difScore.remarked, sx + DIF.x, sy - DIF.y, f, FONT_SIZE, BLUE, RED);
  textCentered(page, String(wv.dimScore), sx + DIM.x, sy - DIM.y, f, FONT_SIZE, BLUE);
  textCentered(page, String(wv.intScore), sx + INT.x, sy - DIM.y, f, FONT_SIZE, BLUE);
  remarkableCentered(page, wv.distorsionsCount.value, wv.distorsionsCount.remarked, sx + DIS.x, sy - DIS.y, f, FONT_SIZE, BLUE, RED);
  textCentered(page, String(wv.q1), sx + Q1.x, sy - Q1.y, f, FONT_SIZE, BLUE);
  textCentered(page, String(wv.q2), sx + Q2.x, sy - Q2.y, f, FONT_SIZE, BLUE);

  // DIM%, INT%
  remarkableCentered(page, wv.dimPerc.value, wv.dimPerc.remarked, sx + DIMP.x, sy - DIMP.y, f, FONT_SIZE, BLUE, RED);
  remarkableCentered(page, wv.intPerc.value, wv.intPerc.remarked, sx + INTP.x, sy - INTP.y, f, FONT_SIZE, BLUE, RED);

  // DI, AI%, totals
  remarkableCentered(page, wv.diScore.value, wv.diScore.remarked, sx + DI.x, sy - DI.y, f, FONT_SIZE, BLUE, RED);
  remarkableCentered(page, wv.aiPerc.value, wv.aiPerc.remarked, sx + AI.x, sy - AI.y, f, FONT_SIZE, BLUE, RED);
  textCentered(page, String(wv.positivesTotal), sx + PT.x, sy - PT.y, f, FONT_SIZE, BLUE);
  textCentered(page, String(wv.negativesTotal), sx + NT.x, sy - NT.y, f, FONT_SIZE, BLUE);
}

// ─── BQR relations ────────────────────────────────────────────────────────────

function relationsBox(page: PDFPage, rv: WorldRelationsValues, sx: number, sy: number, f: PDFFont) {
  remarkableDecimalCentered(page, rv.bqr1.value, rv.bqr1.remarked, sx, sy, f, FONT_SIZE, BLUE);
  remarkableDecimalCentered(page, rv.bqr2.value, rv.bqr2.remarked, sx, sy - 15, f, FONT_SIZE, BLUE);
  textCentered(page, String(rv.dif1dif2), sx + 150, sy - 8, f, FONT_SIZE, BLACK);
}

// ─── Weighted axiograms (pages 1, 3, 5) ──────────────────────────────────────

function printWeightedAxiograms(page: PDFPage, wv: WorldValues, sx: number, sy: number, f: PDFFont) {
  let dy = 0;
  for (const dim of [Dimension.INTRINSIC, Dimension.EXTRINSIC, Dimension.SISTEMIC] as DimensionType[]) {
    const axioms = wv.weightedAxiogramsByDimension.get(dim) ?? [];
    for (const ax of axioms) {
      const ab = ax.axiogram.axiogramBase;
      textCentered(page, String(ab.value), sx + 19, sy + dy, f, _1W_WA_FS, BLACK);
      remarkableCentered(page, ax.response.value, ax.response.remarked, sx + 48, sy + dy, f, _1W_WA_FS, BLUE, RED);
      const diffStr = ax.diff > 0 ? `+${ax.diff}` : String(ax.diff);
      textCentered(page, diffStr, sx + 78, sy + dy, f, _1W_WA_FS, BLACK);
      textCentered(page, getDimensionLetter(ab.dimension), sx + 100, sy + dy, f, _1W_WA_FS, BLACK);
      const valuingY = ab.isDevalued ? sy + dy - 5 : sy + dy + 5;
      textCentered(page, getDimensionLetter(ab.dimensionValuing), sx + 105.5, valuingY, f, _1W_WA_FS - 3, BLACK);
      textLeft(page, ax.axiogram.phrase, sx + 120, sy + dy, f, _1W_WA_FS, BLACK);
      dy -= 23.75;
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
        start: { x: sx + 207, y: sy + dy + dif * _1W_OA_DY },
        end:   { x: sx + 343, y: sy + dy },
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
