import { RemarkableInteger } from './types/remarkable-integer';
import { RemarkableBigDecimal } from './types/remarkable-big-decimal';
import { DimensionScores } from './types/dimension-scores';
import { WorldValues } from './types/world-values';
import { WorldRelationsValues } from './types/world-relations-values';
import { AxiogramsByFormulaWarns } from './types/axiograms-by-formula-warns';
import { WeightedAxiogram } from './types/weighted-axiogram';
import { NoticeableAxiogram } from './types/noticeable-axiogram';
import { Dimension, DimensionType, DIM_I_CELLS_POSITIONS, DIM_E_CELLS_POSITIONS, DIM_S_CELLS_POSITIONS } from './domain/dimension';
import { WorldType } from './domain/world';
import { axiogramsByWorld } from './domain/axiogram';

const GOOD_RESPONSES = [6, 9, 10, 11, 13, 5, 17, 16, 12, 4, 1, 18, 2, 14, 8, 15, 3, 7];

export function calculateValues(world: WorldType, responses: number[]): WorldValues {
  if (responses.length !== GOOD_RESPONSES.length) {
    throw new Error('El array de entrada no tiene la misma longitud que goodResponses');
  }

  const remarkableResponses = calculateAnnotatedResponses(responses);
  const diffCells = calculateDifCells(responses);
  const intCells = calculateIntCells(diffCells);

  const valuesDimI = calculateDim(diffCells, intCells, DIM_I_CELLS_POSITIONS);
  const valuesDimE = calculateDim(diffCells, intCells, DIM_E_CELLS_POSITIONS);
  const valuesDimS = calculateDim(diffCells, intCells, DIM_S_CELLS_POSITIONS);

  // DIF
  const difScoreValue = valuesDimI.dimensionScore.value + valuesDimE.dimensionScore.value + valuesDimS.dimensionScore.value;
  const difScore: RemarkableInteger = { value: difScoreValue, remarked: difScoreValue >= 40 };

  // DIM
  const maxDimScore = Math.max(valuesDimI.dimensionScore.value, valuesDimE.dimensionScore.value, valuesDimS.dimensionScore.value);
  const dimScore = (3 * maxDimScore) - valuesDimI.dimensionScore.value - valuesDimE.dimensionScore.value - valuesDimS.dimensionScore.value;

  // INT
  const intScore = valuesDimI.integrationScore + valuesDimE.integrationScore + valuesDimS.integrationScore;

  // Distortions count
  let distorsionsCount = 0;
  for (const r of remarkableResponses) {
    distorsionsCount += r.remarked ? 1 : 0;
  }
  const remarkableDistorsionsCount: RemarkableInteger = { value: distorsionsCount, remarked: distorsionsCount > 0 };

  // DIM%
  const dimPerc = Math.round((dimScore / difScoreValue) * 100);
  const remarkableDimPerc: RemarkableInteger = { value: dimPerc, remarked: dimPerc >= 40 };

  // INT%
  const intPercValue = Math.round((intScore / difScoreValue) * 100);
  const intPerc: RemarkableInteger = { value: intPercValue, remarked: intPercValue >= 40 };

  // Q1 & Q2
  const q2 = dimScore + intScore + distorsionsCount;
  const q1 = q2 + difScoreValue;

  // D.I.
  const maxDiScore = Math.max(valuesDimI.integrationScore, valuesDimE.integrationScore, valuesDimS.integrationScore);
  const diScoreInt = (3 * maxDiScore) - valuesDimI.integrationScore - valuesDimE.integrationScore - valuesDimS.integrationScore;
  const diScore: RemarkableInteger = { value: diScoreInt, remarked: diScoreInt >= 15 };

  // AI%
  const totalNegatives = valuesDimI.negativesCount + valuesDimE.negativesCount + valuesDimS.negativesCount;
  const aiPercInt = Math.round((totalNegatives / difScoreValue) * 100);
  const aiPerc: RemarkableInteger = { value: aiPercInt, remarked: aiPercInt >= 70 };

  // Positives/Negatives Total
  const positivesTotal = valuesDimI.positivesCount + valuesDimE.positivesCount + valuesDimS.positivesCount;
  const negativesTotal = totalNegatives;

  const wAxiogramsByDim = weightedAxiogramsByDimension(GOOD_RESPONSES, remarkableResponses, diffCells, world, valuesDimI, valuesDimE, valuesDimS);
  const wAxiograms = weightedAxiograms(GOOD_RESPONSES, remarkableResponses, diffCells, world, difScoreValue);
  const nAxiogramsByDim = noticeableAxiogramsByDimension(remarkableResponses, diffCells, world);

  return {
    remarkableResponses,
    remarkableDiffs: diffCells,
    intCells,
    dimIValues: valuesDimI,
    dimEValues: valuesDimE,
    dimSValues: valuesDimS,
    difScore,
    dimScore,
    intScore,
    distorsionsCount: remarkableDistorsionsCount,
    dimPerc: remarkableDimPerc,
    intPerc,
    q1,
    q2,
    diScore,
    aiPerc,
    positivesTotal,
    negativesTotal,
    weightedAxiograms: wAxiograms,
    weightedAxiogramsByDimension: wAxiogramsByDim,
    noticeableAxiogramsByDimension: nAxiogramsByDim,
  };
}

export function calculateRelationValues(
  externalWorldValues: WorldValues,
  internalWorldValues: WorldValues,
): WorldRelationsValues {
  const bqrBlockThreshold = 2.49;

  const bqr1Value = Math.ceil((internalWorldValues.q1 / externalWorldValues.q1) * 100) / 100;
  const bqr1: RemarkableBigDecimal = { value: bqr1Value, remarked: bqr1Value >= bqrBlockThreshold };

  const bqr2Value = Math.ceil((internalWorldValues.q2 / externalWorldValues.q2) * 100) / 100;
  const bqr2: RemarkableBigDecimal = { value: bqr2Value, remarked: bqr2Value >= bqrBlockThreshold };

  const dif1dif2 = Math.ceil((externalWorldValues.difScore.value / internalWorldValues.difScore.value) * 100) / 100;

  return { bqr1, bqr2, dif1dif2 };
}

export function calculateFormulaWarns(
  externalWorldValues: WorldValues,
  internalWorldValues: WorldValues,
  sexualWorldValues: WorldValues | null,
): AxiogramsByFormulaWarns {
  const warnings: boolean[] = new Array(18).fill(false);

  for (let i = 0; i <= 17; i++) {
    const diffExternal = Math.abs(externalWorldValues.remarkableDiffs[i].value);
    const diffInternal = Math.abs(internalWorldValues.remarkableDiffs[i].value);
    const diffSexual = sexualWorldValues ? Math.abs(sexualWorldValues.remarkableDiffs[i].value) : 0;

    if (diffSexual > 0) {
      if ((diffExternal + diffInternal + diffSexual) > 9) {
        if ((diffExternal >= 3 && diffInternal >= 3) ||
            (diffExternal >= 3 && diffSexual >= 3) ||
            (diffInternal >= 3 && diffSexual >= 3)) {
          warnings[i] = true;
        }
      }
    } else {
      if ((diffExternal + diffInternal) > 6) {
        if (diffExternal >= 3 && diffInternal >= 3) {
          warnings[i] = true;
        }
      }
    }
  }

  return { warnings };
}

function calculateDim(diffCells: RemarkableInteger[], intCells: number[], cellsPositions: number[]): DimensionScores {
  const dimensionScore = calculateDimensionScore(diffCells, cellsPositions);
  const inte = calculateDimensionIntValue(intCells, cellsPositions);
  const positivesCount = calculatePositivesCount(diffCells, cellsPositions);
  const negativesCount = calculateNegativesCount(diffCells, cellsPositions);

  const net = positivesCount - negativesCount;
  const positivesNegativesNet: RemarkableInteger = { value: net, remarked: net >= 4 || net <= -4 };

  return { dimensionScore, integrationScore: inte, positivesCount, negativesCount, positivesNegativesNet };
}

export function calculatePositivesCount(cells: RemarkableInteger[], cellsPositions: number[]): number {
  let value = 0;
  for (const pos of cellsPositions) {
    if (cells[pos].value > 0) value += cells[pos].value;
  }
  return value;
}

export function calculateNegativesCount(cells: RemarkableInteger[], cellsPositions: number[]): number {
  let value = 0;
  for (const pos of cellsPositions) {
    if (cells[pos].value < 0) value += Math.abs(cells[pos].value);
  }
  return value;
}

export function calculateDimensionScore(diffCells: RemarkableInteger[], cellsPositions: number[]): RemarkableInteger {
  let value = 0;
  for (const pos of cellsPositions) {
    value += Math.abs(diffCells[pos].value);
  }
  return { value, remarked: value >= 15 };
}

export function calculateDimensionIntValue(intCells: number[], cellsPositions: number[]): number {
  let value = 0;
  for (const pos of cellsPositions) {
    value += Math.abs(intCells[pos]);
  }
  return value;
}

export function calculateAnnotatedResponses(responses: number[]): RemarkableInteger[] {
  if (responses.length !== GOOD_RESPONSES.length) {
    throw new Error('El array de entrada no tiene la misma longitud que goodResponses');
  }
  if (!responses.every(v => v >= 1 && v <= 18)) {
    throw new Error('Al menos un valor en el array no cumple la condición.');
  }

  return responses.map((response, i) => {
    const distorsion = (GOOD_RESPONSES[i] <= 9 && response > 9) || (GOOD_RESPONSES[i] >= 10 && response < 10);
    return { value: response, remarked: distorsion };
  });
}

export function calculateDifCells(responses: number[]): RemarkableInteger[] {
  if (responses.length !== GOOD_RESPONSES.length) {
    throw new Error('El array de entrada no tiene la misma longitud que goodResponses');
  }

  if (new Set(responses).size !== responses.length) {
    const seen = new Set<number>();
    const duplicates = new Set<number>();
    for (const v of responses) {
      if (seen.has(v)) duplicates.add(v);
      seen.add(v);
    }
    throw new Error('Los valores en \'responses\' tienen elementos repetidos: ' + Array.from(duplicates));
  }

  if (!responses.every(v => v >= 1 && v <= 18)) {
    throw new Error('Al menos un valor en el array no cumple la condición.');
  }

  const diffValues: number[] = new Array(responses.length);
  for (let i = 0; i < responses.length; i++) {
    if (GOOD_RESPONSES[i] <= 9) {
      diffValues[i] = GOOD_RESPONSES[i] - responses[i];
    } else {
      diffValues[i] = -GOOD_RESPONSES[i] + responses[i];
    }
  }

  const maxAbsValue = Math.max(...diffValues.map(Math.abs));
  const thresholdRemarkable = maxAbsValue * (3 / 5);

  return diffValues.map(dv => {
    const remarked = dv < -6 || dv > 6 || dv < -thresholdRemarkable || dv > thresholdRemarkable;
    return { value: dv, remarked };
  });
}

export function calculateIntCells(difCells: RemarkableInteger[]): number[] {
  if (difCells.length !== GOOD_RESPONSES.length) {
    throw new Error('El array de entrada no tiene la misma longitud que goodResponses');
  }

  return difCells.map(dc => {
    const val = Math.abs(dc.value) - 2;
    return val < 0 ? 0 : val;
  });
}

export function weightedAxiograms(
  goodResponses: number[],
  remarkableResponses: RemarkableInteger[],
  diffCells: RemarkableInteger[],
  world: WorldType,
  difScore: number,
): WeightedAxiogram[] {
  const worldAxiograms = axiogramsByWorld.get(world)!;
  const result: WeightedAxiogram[] = [];

  for (let i = 0; i <= 17; i++) {
    const axiogram = worldAxiograms[i];
    const response = remarkableResponses[i].value;
    const diffValue = diffCells[i].value;
    const distorsion = (goodResponses[i] <= 9 && response > 9) || (goodResponses[i] >= 10 && response < 10);
    const weightPerc = Math.ceil((Math.abs(diffValue) / difScore) * 100);

    result.push({ axiogram, response: remarkableResponses[i], diff: diffValue, distorsion, weightPerc });
  }

  result.sort((a, b) => b.weightPerc - a.weightPerc);
  return result;
}

export function weightedAxiogramsByDimension(
  goodResponses: number[],
  remarkableResponses: RemarkableInteger[],
  diffCells: RemarkableInteger[],
  world: WorldType,
  valuesDimI: DimensionScores,
  valuesDimE: DimensionScores,
  valuesDimS: DimensionScores,
): Map<DimensionType, WeightedAxiogram[]> {
  const worldAxiograms = axiogramsByWorld.get(world)!;
  const map = new Map<DimensionType, WeightedAxiogram[]>();

  for (let i = 0; i <= 17; i++) {
    const axiogram = worldAxiograms[i];
    const response = remarkableResponses[i].value;
    const dimension = axiogram.axiogramBase.dimension;
    const diffValue = diffCells[i].value;
    const distorsion = (goodResponses[i] <= 9 && response > 9) || (goodResponses[i] >= 10 && response < 10);

    let weightPerc = 0;
    if (dimension === Dimension.INTRINSIC) {
      weightPerc = Math.ceil((Math.abs(diffValue) / valuesDimI.dimensionScore.value) * 100);
    } else if (dimension === Dimension.EXTRINSIC) {
      weightPerc = Math.ceil((Math.abs(diffValue) / valuesDimE.dimensionScore.value) * 100);
    } else {
      weightPerc = Math.ceil((Math.abs(diffValue) / valuesDimS.dimensionScore.value) * 100);
    }

    const wa: WeightedAxiogram = { axiogram, response: remarkableResponses[i], diff: diffValue, distorsion, weightPerc };

    if (!map.has(dimension)) map.set(dimension, []);
    map.get(dimension)!.push(wa);
  }

  for (const list of map.values()) {
    list.sort((a, b) => b.weightPerc - a.weightPerc);
  }

  return map;
}

export function noticeableAxiogramsByDimension(
  remarkableResponses: RemarkableInteger[],
  diffCells: RemarkableInteger[],
  world: WorldType,
): Map<DimensionType, NoticeableAxiogram[]> {
  const worldAxiograms = axiogramsByWorld.get(world)!;
  const map = new Map<DimensionType, NoticeableAxiogram[]>();

  for (let i = 0; i <= 17; i++) {
    const axiogram = worldAxiograms[i];

    let noticeable = false;
    let distorsion = false;

    if (remarkableResponses[i].remarked) {
      distorsion = true;
      noticeable = true;
    }
    if (diffCells[i].remarked) {
      noticeable = true;
    }
    if (Math.abs(diffCells[i].value) >= 2) {
      noticeable = true;
    }

    if (noticeable) {
      const na: NoticeableAxiogram = {
        axiogram,
        response: remarkableResponses[i].value,
        diff: diffCells[i].value,
        distorsion,
      };

      const dimension = axiogram.axiogramBase.dimension;
      if (!map.has(dimension)) map.set(dimension, []);
      map.get(dimension)!.push(na);
    }
  }

  for (const list of map.values()) {
    list.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  }

  return map;
}
