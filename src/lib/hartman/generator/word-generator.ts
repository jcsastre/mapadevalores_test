import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
} from 'docx';
import type { WorldValues } from '@/lib/hartman/types/world-values';
import type { WorldRelationsValues } from '@/lib/hartman/types/world-relations-values';
import type { WordType } from '@/lib/hartman/domain/word-type';
import type { WorldType } from '@/lib/hartman/domain/world';
import { Dimension, getDimensionLetter, getTextValuationByScoreSpanish, getAiPercValuationByScoreSpanish } from '@/lib/hartman/domain/dimension';
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
