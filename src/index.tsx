export {
  CurveLoader,
  CurveLoaderContents,
  type CurveLoaderContentsProps,
  type CurveLoaderProps,
} from './loaders';

export { curveNames, curves, type CurveName } from './curves';

// Building a custom curve? Compose these worklets, or write your own `point`.
export {
  DS_MIN,
  DS_RANGE,
  butterflyPoint,
  cardioidPoint,
  fourierPoint,
  getDetailScale,
  getRotationDeg,
  heartPoint,
  heartWavePoint,
  lemniscatePoint,
  lissajousPoint,
  normalizeProgress,
  roseOrbitPoint,
  rosePoint,
  roseTrailPoint,
  searchPoint,
  spiroPoint,
} from './math';

export type {
  AnyCurveConfig,
  ButterflyParams,
  CardioidParams,
  CurveBase,
  CurveConfig,
  FourierParams,
  HeartWaveParams,
  LemniscateParams,
  LissajousParams,
  Point,
  RoseOrbitParams,
  RoseParams,
  RoseTrailParams,
  SearchParams,
  SpiroParams,
} from './types';
