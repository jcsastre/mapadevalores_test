import { Axiogram } from '../domain/axiogram';

export interface NoticeableAxiogram {
  axiogram: Axiogram;
  response: number;
  diff: number;
  distorsion: boolean;
}
