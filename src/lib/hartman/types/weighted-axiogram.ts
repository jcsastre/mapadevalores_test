import { Axiogram } from '../domain/axiogram';
import { RemarkableInteger } from './remarkable-integer';

export interface WeightedAxiogram {
  axiogram: Axiogram;
  response: RemarkableInteger;
  diff: number;
  distorsion: boolean;
  weightPerc: number;
}
