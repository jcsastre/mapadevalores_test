import { RemarkableInteger } from './remarkable-integer';

export interface DimensionScores {
  dimensionScore: RemarkableInteger;
  integrationScore: number;
  positivesCount: number;
  negativesCount: number;
  positivesNegativesNet: RemarkableInteger;
}
