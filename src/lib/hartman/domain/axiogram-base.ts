import { DimensionType, Dimension } from './dimension';

export interface AxiogramBase {
  pos: number;
  letter: string;
  dimension: DimensionType;
  dimensionValuing: DimensionType;
  isDevalued: boolean;
  value: number;
  plusRangeTxt: string;
  minusRangeTxt: string;
}

export const baseAxiograms = new Map<number, AxiogramBase>([
  [1, { pos: 1, letter: 'A', dimension: Dimension.EXTRINSIC, dimensionValuing: Dimension.EXTRINSIC, isDevalued: false, value: 6, plusRangeTxt: '1 a 5 (+5 a +1)', minusRangeTxt: '7 a 18 (-1 a -12)' }],
  [2, { pos: 2, letter: 'B', dimension: Dimension.SISTEMIC, dimensionValuing: Dimension.SISTEMIC, isDevalued: false, value: 9, plusRangeTxt: '1 a 8 (+8 a +1)', minusRangeTxt: '10 a 18 (-1 a -9)' }],
  [3, { pos: 3, letter: 'C', dimension: Dimension.SISTEMIC, dimensionValuing: Dimension.SISTEMIC, isDevalued: true, value: 10, plusRangeTxt: '11 a 18 (+1 a +8)', minusRangeTxt: '1 a 9 ( -1 a -9)' }],
  [4, { pos: 4, letter: 'D', dimension: Dimension.EXTRINSIC, dimensionValuing: Dimension.SISTEMIC, isDevalued: true, value: 11, plusRangeTxt: '12 a 18 (+1 a +7)', minusRangeTxt: '1 a 10 (-1 a  -10)' }],
  [5, { pos: 5, letter: 'E', dimension: Dimension.EXTRINSIC, dimensionValuing: Dimension.EXTRINSIC, isDevalued: true, value: 13, plusRangeTxt: '14 a 18 (+1 a +5)', minusRangeTxt: '1 a 12 (-12 a -1)' }],
  [6, { pos: 6, letter: 'F', dimension: Dimension.INTRINSIC, dimensionValuing: Dimension.SISTEMIC, isDevalued: false, value: 5, plusRangeTxt: '1 a 4 (+1 a +3)', minusRangeTxt: '6 a 18 (-1 a -13)' }],
  [7, { pos: 7, letter: 'G', dimension: Dimension.EXTRINSIC, dimensionValuing: Dimension.INTRINSIC, isDevalued: true, value: 17, plusRangeTxt: '18 (+1)', minusRangeTxt: '1 a 16 (-16 a -1)' }],
  [8, { pos: 8, letter: 'H', dimension: Dimension.SISTEMIC, dimensionValuing: Dimension.INTRINSIC, isDevalued: true, value: 16, plusRangeTxt: '17 a 18 (+1 a +2)', minusRangeTxt: '1 a 15 (-15 a -1)' }],
  [9, { pos: 9, letter: 'I', dimension: Dimension.SISTEMIC, dimensionValuing: Dimension.EXTRINSIC, isDevalued: true, value: 12, plusRangeTxt: '13 a 18 (+1 a +6)', minusRangeTxt: '1 a 11 (-11 a -1)' }],
  [10, { pos: 10, letter: 'J', dimension: Dimension.INTRINSIC, dimensionValuing: Dimension.EXTRINSIC, isDevalued: false, value: 4, plusRangeTxt: '1 a 3 (+3 a +1)', minusRangeTxt: '5 a 18 (-1 a -14)' }],
  [11, { pos: 11, letter: 'K', dimension: Dimension.INTRINSIC, dimensionValuing: Dimension.INTRINSIC, isDevalued: false, value: 1, plusRangeTxt: 'n/a', minusRangeTxt: '2 a 18 (-1 a -17)' }],
  [12, { pos: 12, letter: 'L', dimension: Dimension.INTRINSIC, dimensionValuing: Dimension.INTRINSIC, isDevalued: true, value: 18, plusRangeTxt: 'n/a', minusRangeTxt: '1 a 17 (-17 a -1)' }],
  [13, { pos: 13, letter: 'M', dimension: Dimension.EXTRINSIC, dimensionValuing: Dimension.INTRINSIC, isDevalued: false, value: 2, plusRangeTxt: '1 (+1)', minusRangeTxt: '3 a 18 (-1 a -16)' }],
  [14, { pos: 14, letter: 'N', dimension: Dimension.INTRINSIC, dimensionValuing: Dimension.SISTEMIC, isDevalued: true, value: 14, plusRangeTxt: '15 a 18 (+1 a +4)', minusRangeTxt: '1 a 13 (-13 a -1)' }],
  [15, { pos: 15, letter: 'O', dimension: Dimension.EXTRINSIC, dimensionValuing: Dimension.SISTEMIC, isDevalued: false, value: 8, plusRangeTxt: '1 a 7 (+7 a +1)', minusRangeTxt: '9 a 18 (-1 a -10)' }],
  [16, { pos: 16, letter: 'P', dimension: Dimension.INTRINSIC, dimensionValuing: Dimension.EXTRINSIC, isDevalued: true, value: 15, plusRangeTxt: '16 a 18 (+1 a +3)', minusRangeTxt: '1 a 14 (-14 a -1)' }],
  [17, { pos: 17, letter: 'Q', dimension: Dimension.SISTEMIC, dimensionValuing: Dimension.INTRINSIC, isDevalued: false, value: 3, plusRangeTxt: '1 a 2 (+2 a +1)', minusRangeTxt: '4 a 18 (-1 a -15)' }],
  [18, { pos: 18, letter: 'R', dimension: Dimension.SISTEMIC, dimensionValuing: Dimension.EXTRINSIC, isDevalued: false, value: 7, plusRangeTxt: '1 a 6 (+6 a +1)', minusRangeTxt: '8 a 18 (-1 a -11)' }],
]);
