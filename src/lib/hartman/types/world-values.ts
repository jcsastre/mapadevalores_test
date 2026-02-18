import { RemarkableInteger } from './remarkable-integer';
import { DimensionScores } from './dimension-scores';
import { WeightedAxiogram } from './weighted-axiogram';
import { NoticeableAxiogram } from './noticeable-axiogram';
import { DimensionType } from '../domain/dimension';

export interface WorldValues {
  remarkableResponses: RemarkableInteger[];
  remarkableDiffs: RemarkableInteger[];
  intCells: number[];
  dimIValues: DimensionScores;
  dimEValues: DimensionScores;
  dimSValues: DimensionScores;
  difScore: RemarkableInteger;
  dimScore: number;
  intScore: number;
  distorsionsCount: RemarkableInteger;
  dimPerc: RemarkableInteger;
  intPerc: RemarkableInteger;
  q1: number;
  q2: number;
  diScore: RemarkableInteger;
  aiPerc: RemarkableInteger;
  positivesTotal: number;
  negativesTotal: number;
  weightedAxiograms: WeightedAxiogram[];
  weightedAxiogramsByDimension: Map<DimensionType, WeightedAxiogram[]>;
  noticeableAxiogramsByDimension: Map<DimensionType, NoticeableAxiogram[]>;
}
